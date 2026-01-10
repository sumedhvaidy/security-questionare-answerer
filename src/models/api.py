"""
API request/response models for the questionnaire system.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from src.models.common import (
    ConfidenceLevel,
    Citation,
    Question,
    ContextDocument,
)


# ============== INPUT MODELS ==============

class QuestionnaireInput(BaseModel):
    """Input payload containing context and questions."""
    request_id: str = Field(..., description="Unique request identifier")
    context_documents: List[ContextDocument] = Field(..., description="List of context documents from RAG/MongoDB")
    questions: List[Question] = Field(..., description="List of questions to answer")


# ============== OUTPUT MODELS ==============

class QuestionAnswer(BaseModel):
    """Complete answer for a single question with citations and confidence."""
    question_id: str = Field(..., description="ID of the question being answered")
    question_text: str = Field(..., description="Original question text")
    answer: str = Field(..., description="Generated answer text")
    confidence: ConfidenceLevel = Field(..., description="Confidence level")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Numeric confidence score")
    citations: List[Citation] = Field(default_factory=list, description="Citations supporting the answer")
    reasoning: Optional[str] = Field(default=None, description="Reasoning for the answer")
    needs_escalation: bool = Field(default=False, description="Whether this needs human review")
    escalation_reason: Optional[str] = Field(default=None, description="Why escalation is needed")
    category: Optional[str] = Field(default=None, description="Question category")


class BatchResult(BaseModel):
    """Result for a batch of questions."""
    batch_number: int = Field(..., description="Batch number in sequence")
    answers: List[QuestionAnswer] = Field(..., description="Answers for this batch")


class QuestionnaireOutput(BaseModel):
    """Complete output payload with all answers."""
    request_id: str = Field(..., description="Original request identifier")
    total_questions: int = Field(..., description="Total number of questions processed")
    total_batches: int = Field(..., description="Number of batches processed")
    batches: List[BatchResult] = Field(..., description="Results organized by batch")
    escalations_required: int = Field(default=0, description="Number of questions needing escalation")
    status: str = Field(default="completed", description="Processing status")


# ============== INTERNAL AGENT MODELS ==============

class CitationResult(BaseModel):
    """Output from Citation Agent."""
    question_id: str
    citations: List[Citation]


class DraftResult(BaseModel):
    """Output from Drafting Agent."""
    question_id: str
    answer: str
    confidence: ConfidenceLevel
    confidence_score: float
    reasoning: Optional[str] = None


# ============== ESCALATION MODELS ==============

class EscalationRequest(BaseModel):
    """Request format for escalation processing."""
    request_id: str
    total_questions: int
    total_batches: int
    batches: List[BatchResult]
    status: str = "completed"


class EscalationResult(BaseModel):
    """Result for a single question escalation decision."""
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
    """Response from Escalation Agent."""
    request_id: str
    total_questions: int
    escalations_required: int
    results: List[EscalationResult]
    status: str = "completed"

