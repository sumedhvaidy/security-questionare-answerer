import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

interface Question {
  id: number;
  category: string;
  question: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const questions: Question[] = body.questions;

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions provided" },
        { status: 400 }
      );
    }

    // Transform questions to API format
    const apiPayload = {
      request_id: `req-${Date.now()}`,
      questions: questions.map((q) => ({
        question_id: `q-${q.id}`,
        question_text: q.question,
        category: q.category || "General",
      })),
      context_documents: [], // Will use Knowledge Agent's MongoDB documents
    };

    // Call the FastAPI backend with escalation endpoint
    const response = await fetch(`${API_BASE_URL}/process/with-escalation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const fullResult = await response.json();
    const result = fullResult.questionnaire;
    const escalationData = fullResult.escalation;

    // Create a map of original questions for fallback
    const originalQuestionsMap = new Map(
      questions.map((q) => [`q-${q.id}`, q])
    );

    // Create a map of escalation results by question_id
    const escalationMap = new Map<string, any>();
    if (escalationData?.results) {
      escalationData.results.forEach((esc: any) => {
        escalationMap.set(esc.question_id, esc);
      });
    }

    // Transform response to frontend format
    const transformedResults = result.batches.flatMap((batch: any) =>
      batch.answers.map((answer: any) => {
        const originalQuestion = originalQuestionsMap.get(answer.question_id);
        const escalationInfo = escalationMap.get(answer.question_id);
        
        return {
          id: parseInt(answer.question_id.replace("q-", "")) || 0,
          category: answer.category || originalQuestion?.category || "General",
          // Use answer.question_text from API, fallback to original question
          question: answer.question_text || originalQuestion?.question || "Unknown question",
          answer: answer.answer,
          confidence: Math.round((answer.confidence_score || 0) * 100),
          status:
            (answer.confidence_score || 0) >= 0.7
              ? "auto"
              : (answer.confidence_score || 0) >= 0.5
              ? "review"
              : "manual",
          sources: answer.citations?.map((c: any) => c.doc_title) || [],
          needs_escalation: answer.needs_escalation || escalationInfo?.requires_escalation || false,
          escalation_reason: answer.escalation_reason || escalationInfo?.escalation_reason || "",
          reasoning: answer.reasoning || "",
          // Include employee routing info from escalation
          routed_to: escalationInfo?.routed_to ? {
            name: escalationInfo.routed_to.name,
            email: escalationInfo.routed_to.email,
            department: escalationInfo.routed_to.department,
            title: escalationInfo.routed_to.title || escalationInfo.routed_to.department
          } : undefined,
        };
      })
    );

    return NextResponse.json({
      success: true,
      request_id: result.request_id,
      total_questions: result.total_questions,
      escalations_required: result.escalations_required,
      results: transformedResults,
    });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      { error: "Failed to process questionnaire" },
      { status: 500 }
    );
  }
}

