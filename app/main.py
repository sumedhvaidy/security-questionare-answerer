"""
FastAPI application for Security Questionnaire Answerer.
Engineer 2: Citation Agent + Drafting Agent

Flow:
1. Receive request via POST /process
2. Citation Agent finds relevant citations
3. Drafting Agent generates answers with confidence
4. Return response (and optionally forward to callback URL)
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from contextlib import asynccontextmanager
from typing import Optional
import httpx
import math

from app.models import (
    QuestionnaireInput,
    QuestionnaireOutput,
    QuestionAnswer,
    BatchResult,
    Question
)
from app.agents import CitationAgent, DraftingAgent
from app.config import settings


# Initialize agents
citation_agent = CitationAgent()
drafting_agent = DraftingAgent()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("🚀 Security Questionnaire Answerer starting up...")
    print(f"📦 Batch size: {settings.batch_size}")
    print(f"🤖 Model: {settings.fireworks_model}")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title="Security Questionnaire Answerer",
    description="Engineer 2: Citation Agent + Drafting Agent - Processes security questionnaires with citations and confidence scores",
    version="1.0.0",
    lifespan=lifespan
)


async def forward_to_callback(callback_url: str, data: dict):
    """Forward the response to a callback URL (another agent/service)."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(callback_url, json=data)
            print(f"✅ Forwarded to {callback_url} - Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to forward to {callback_url}: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "citation-drafting-agent"}


@app.post("/process", response_model=QuestionnaireOutput)
async def process_questionnaire(
    input_data: QuestionnaireInput,
    background_tasks: BackgroundTasks,
    callback_url: Optional[str] = None
) -> QuestionnaireOutput:
    """
    Process a security questionnaire with citation and drafting agents.
    
    - Receives context documents and questions
    - Processes questions in batches of 5
    - Citation Agent finds relevant citations for each question
    - Drafting Agent generates answers with confidence scores
    - Optionally forwards response to callback_url
    
    Query Parameters:
        callback_url: Optional URL to forward the response to (e.g., next agent)
    
    Returns structured output with answers, confidence, and citations.
    """
    questions = input_data.questions
    context_docs = input_data.context_documents
    
    # Calculate batches
    total_questions = len(questions)
    batch_size = settings.batch_size
    total_batches = math.ceil(total_questions / batch_size)
    
    all_batches = []
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, total_questions)
        batch_questions = questions[start_idx:end_idx]
        
        # Step 1: Citation Agent - Find citations for batch
        citation_results = await citation_agent.find_citations_batch(
            batch_questions,
            context_docs
        )
        
        # Step 2: Drafting Agent - Generate answers based on citations
        draft_results = await drafting_agent.draft_answers_batch(
            batch_questions,
            citation_results
        )
        
        # Combine results into QuestionAnswer objects
        batch_answers = []
        citation_map = {cr.question_id: cr for cr in citation_results}
        
        for question, draft in zip(batch_questions, draft_results):
            citations = citation_map.get(question.question_id)
            
            answer = QuestionAnswer(
                question_id=question.question_id,
                question_text=question.question_text,
                answer=draft.answer,
                confidence=draft.confidence,
                confidence_score=draft.confidence_score,
                citations=citations.citations if citations else [],
                reasoning=draft.reasoning
            )
            batch_answers.append(answer)
        
        all_batches.append(BatchResult(
            batch_number=batch_num + 1,
            answers=batch_answers
        ))
    
    output = QuestionnaireOutput(
        request_id=input_data.request_id,
        total_questions=total_questions,
        total_batches=total_batches,
        batches=all_batches,
        status="completed"
    )
    
    # Forward to callback URL if provided (runs in background)
    if callback_url:
        background_tasks.add_task(
            forward_to_callback,
            callback_url,
            output.model_dump()
        )
    
    return output


@app.post("/process/async")
async def process_questionnaire_async(
    input_data: QuestionnaireInput,
    background_tasks: BackgroundTasks,
    callback_url: str
):
    """
    Async processing - immediately returns, processes in background, 
    then sends result to callback_url.
    
    Use this when you don't want to wait for processing to complete.
    """
    async def process_and_forward():
        """Process questionnaire and forward result."""
        questions = input_data.questions
        context_docs = input_data.context_documents
        
        total_questions = len(questions)
        batch_size = settings.batch_size
        total_batches = math.ceil(total_questions / batch_size)
        
        all_batches = []
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, total_questions)
            batch_questions = questions[start_idx:end_idx]
            
            citation_results = await citation_agent.find_citations_batch(
                batch_questions, context_docs
            )
            draft_results = await drafting_agent.draft_answers_batch(
                batch_questions, citation_results
            )
            
            batch_answers = []
            citation_map = {cr.question_id: cr for cr in citation_results}
            
            for question, draft in zip(batch_questions, draft_results):
                citations = citation_map.get(question.question_id)
                answer = QuestionAnswer(
                    question_id=question.question_id,
                    question_text=question.question_text,
                    answer=draft.answer,
                    confidence=draft.confidence,
                    confidence_score=draft.confidence_score,
                    citations=citations.citations if citations else [],
                    reasoning=draft.reasoning
                )
                batch_answers.append(answer)
            
            all_batches.append(BatchResult(batch_number=batch_num + 1, answers=batch_answers))
        
        output = QuestionnaireOutput(
            request_id=input_data.request_id,
            total_questions=total_questions,
            total_batches=total_batches,
            batches=all_batches,
            status="completed"
        )
        
        await forward_to_callback(callback_url, output.model_dump())
    
    # Queue the processing task
    background_tasks.add_task(process_and_forward)
    
    return {
        "status": "accepted",
        "request_id": input_data.request_id,
        "message": f"Processing {len(input_data.questions)} questions. Results will be sent to {callback_url}"
    }
