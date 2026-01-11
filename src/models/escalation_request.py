"""
Pydantic models for escalation request format from citation agentic AI
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class Citation(BaseModel):
    """Citation from document agent"""
    doc_id: str
    doc_title: str
    relevant_excerpt: str
    relevance_score: float = Field(ge=0.0, le=1.0)


class AnswerItem(BaseModel):
    """Individual answer from citation agent"""
    question_id: str
    question_text: str
    answer: str
    confidence: str = Field(description="Confidence level: 'high', 'medium', 'low'")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Numeric confidence score 0-1")
    citations: List[Citation] = Field(default_factory=list)
    reasoning: Optional[str] = None


class Batch(BaseModel):
    """Batch of answers"""
    batch_number: int
    answers: List[AnswerItem]


class EscalationRequest(BaseModel):
    """Request format from citation agentic AI for escalation processing"""
    request_id: str
    total_questions: int
    total_batches: int
    batches: List[Batch]
    status: str = "completed"

