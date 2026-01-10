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


class EscalationResult(BaseModel):
    """Result for a single question escalation decision"""
    question_id: str
    question_text: str
    answer: str
    confidence: str
    confidence_score: float
    requires_escalation: bool
    escalation_reason: Optional[str] = None
    routed_to: Optional[dict] = None
    department: Optional[str] = None
    category: Optional[str] = None
    citations: List[Citation] = Field(default_factory=list)


class EscalationResponse(BaseModel):
    """Response format for escalation agent"""
    request_id: str
    total_questions: int
    escalations_required: int
    results: List[EscalationResult]
    status: str = "completed"
