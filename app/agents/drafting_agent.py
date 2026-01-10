"""
Drafting Agent - Generates answers with confidence scores based on citations.
"""
import json
from typing import Optional

from app.llm_client import llm_client
from app.models import (
    Question,
    Citation,
    CitationResult,
    DraftResult,
    ConfidenceLevel
)


DRAFTING_SYSTEM_PROMPT = """You are a Drafting Agent specializing in answering security questionnaires.

Your task is to generate accurate, professional answers based on the provided citations and context.

IMPORTANT GUIDELINES:
1. Base your answers ONLY on the provided citations
2. Be concise but comprehensive
3. Use professional security/compliance language
4. Assign confidence based on citation quality and coverage:
   - HIGH (0.8-1.0): Strong, direct evidence in citations
   - MEDIUM (0.5-0.79): Partial evidence or inference required
   - LOW (0.0-0.49): Weak evidence or significant assumptions needed
5. If citations are insufficient, acknowledge limitations in the answer
6. Provide brief reasoning for your confidence assessment

Output your response in the following JSON format:
{
    "answer": "Your detailed answer here",
    "confidence": "high|medium|low",
    "confidence_score": 0.85,
    "reasoning": "Brief explanation of confidence level"
}"""


class DraftingAgent:
    """Agent responsible for drafting answers based on citations."""
    
    def __init__(self):
        self.client = llm_client
    
    def _format_citations(self, citations: list[Citation]) -> str:
        """Format citations for the prompt."""
        if not citations:
            return "No relevant citations found."
        
        formatted = []
        for i, citation in enumerate(citations, 1):
            formatted.append(f"""
CITATION {i}:
- Document: {citation.doc_title} (ID: {citation.doc_id})
- Relevance Score: {citation.relevance_score}
- Excerpt: "{citation.relevant_excerpt}"
""")
        return "\n".join(formatted)
    
    async def draft_answer(
        self,
        question: Question,
        citation_result: CitationResult
    ) -> DraftResult:
        """
        Draft an answer for a single question based on its citations.
        
        Args:
            question: The question to answer
            citation_result: Citations found by the Citation Agent
            
        Returns:
            DraftResult with answer, confidence, and reasoning
        """
        citations_text = self._format_citations(citation_result.citations)
        
        user_prompt = f"""Generate an answer for the following security questionnaire question:

QUESTION ID: {question.question_id}
QUESTION: {question.question_text}
CATEGORY: {question.category or 'General'}

AVAILABLE CITATIONS:
{citations_text}

Based on these citations, provide a comprehensive answer with confidence assessment in JSON format."""

        messages = [
            {"role": "system", "content": DRAFTING_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.client.chat_completion(messages, temperature=0.4)
        result = self.client.parse_json_response(response)
        
        # Map string confidence to enum
        confidence_map = {
            "high": ConfidenceLevel.HIGH,
            "medium": ConfidenceLevel.MEDIUM,
            "low": ConfidenceLevel.LOW
        }
        
        return DraftResult(
            question_id=question.question_id,
            answer=result["answer"],
            confidence=confidence_map.get(result["confidence"].lower(), ConfidenceLevel.MEDIUM),
            confidence_score=result["confidence_score"],
            reasoning=result.get("reasoning")
        )
    
    async def draft_answers_batch(
        self,
        questions: list[Question],
        citation_results: list[CitationResult]
    ) -> list[DraftResult]:
        """
        Draft answers for a batch of questions.
        
        Args:
            questions: List of questions
            citation_results: Corresponding citation results from Citation Agent
            
        Returns:
            List of DraftResults for each question
        """
        # Create a mapping for quick lookup
        citation_map = {cr.question_id: cr for cr in citation_results}
        
        results = []
        for question in questions:
            citation_result = citation_map.get(
                question.question_id,
                CitationResult(question_id=question.question_id, citations=[])
            )
            result = await self.draft_answer(question, citation_result)
            results.append(result)
        
        return results
