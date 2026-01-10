"""
Citation Agent - Extracts relevant citations from context documents for each question.
"""
import json
from typing import Optional

from app.llm_client import llm_client
from app.models import (
    Question,
    ContextDocument,
    Citation,
    CitationResult
)


CITATION_SYSTEM_PROMPT = """You are a Citation Agent specializing in security questionnaire analysis.

Your task is to analyze context documents and find relevant citations for security-related questions.

For each question, identify the most relevant excerpts from the provided context documents that can help answer the question.

IMPORTANT GUIDELINES:
1. Only cite documents that are directly relevant to the question
2. Extract specific excerpts (not entire documents)
3. Assign a relevance score (0.0-1.0) based on how well the excerpt addresses the question
4. If no relevant context exists, return an empty citations array
5. Prioritize quality over quantity - only include truly relevant citations

Output your response in the following JSON format:
{
    "citations": [
        {
            "doc_id": "document_id",
            "doc_title": "Document Title",
            "relevant_excerpt": "The specific text excerpt that is relevant",
            "relevance_score": 0.85
        }
    ]
}"""


class CitationAgent:
    """Agent responsible for finding and extracting citations from context documents."""
    
    def __init__(self):
        self.client = llm_client
    
    def _format_context(self, documents: list[ContextDocument]) -> str:
        """Format context documents for the prompt."""
        formatted = []
        for doc in documents:
            formatted.append(f"""
--- DOCUMENT ---
ID: {doc.doc_id}
Title: {doc.title}
Source: {doc.source}
Content:
{doc.content}
--- END DOCUMENT ---
""")
        return "\n".join(formatted)
    
    async def find_citations(
        self,
        question: Question,
        context_documents: list[ContextDocument]
    ) -> CitationResult:
        """
        Find relevant citations for a single question.
        
        Args:
            question: The question to find citations for
            context_documents: List of context documents to search
            
        Returns:
            CitationResult with list of relevant citations
        """
        context_text = self._format_context(context_documents)
        
        user_prompt = f"""Find relevant citations from the context documents for the following question:

QUESTION ID: {question.question_id}
QUESTION: {question.question_text}
CATEGORY: {question.category or 'General'}

CONTEXT DOCUMENTS:
{context_text}

Analyze the documents and provide citations in JSON format."""

        messages = [
            {"role": "system", "content": CITATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.client.chat_completion(messages, temperature=0.3)
        result = self.client.parse_json_response(response)
        
        citations = [
            Citation(
                doc_id=c["doc_id"],
                doc_title=c["doc_title"],
                relevant_excerpt=c["relevant_excerpt"],
                relevance_score=c["relevance_score"]
            )
            for c in result.get("citations", [])
        ]
        
        return CitationResult(
            question_id=question.question_id,
            citations=citations
        )
    
    async def find_citations_batch(
        self,
        questions: list[Question],
        context_documents: list[ContextDocument]
    ) -> list[CitationResult]:
        """
        Find citations for a batch of questions.
        
        Args:
            questions: List of questions (max 5 recommended)
            context_documents: List of context documents
            
        Returns:
            List of CitationResults for each question
        """
        results = []
        for question in questions:
            result = await self.find_citations(question, context_documents)
            results.append(result)
        return results
