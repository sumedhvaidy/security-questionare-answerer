"""
Pydantic models for request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ConfidenceLevel(str, Enum):
    """Confidence levels for answers."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ============== INPUT MODELS ==============

class ContextDocument(BaseModel):
    """A single context document from RAG/MongoDB."""
    doc_id: str = Field(..., description="Unique identifier for the document")
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content/text")
    source: str = Field(..., description="Source of the document (e.g., 'mongodb', 'rag')")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata")


class Question(BaseModel):
    """A single security questionnaire question."""
    question_id: str = Field(..., description="Unique identifier for the question")
    question_text: str = Field(..., description="The actual question text")
    category: Optional[str] = Field(default=None, description="Question category (e.g., 'data_security', 'compliance')")


class QuestionnaireInput(BaseModel):
    """Input payload containing context and questions."""
    request_id: str = Field(..., description="Unique request identifier")
    context_documents: list[ContextDocument] = Field(..., description="List of context documents from RAG/MongoDB")
    questions: list[Question] = Field(..., description="List of questions to answer (processed in batches of 5)")


# ============== OUTPUT MODELS ==============

class Citation(BaseModel):
    """A citation referencing a context document."""
    doc_id: str = Field(..., description="ID of the cited document")
    doc_title: str = Field(..., description="Title of the cited document")
    relevant_excerpt: str = Field(..., description="Relevant excerpt from the document")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score (0-1)")


class QuestionAnswer(BaseModel):
    """Complete answer for a single question with citations and confidence."""
    question_id: str = Field(..., description="ID of the question being answered")
    question_text: str = Field(..., description="Original question text")
    answer: str = Field(..., description="Generated answer text")
    confidence: ConfidenceLevel = Field(..., description="Confidence level of the answer")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Numeric confidence score (0-1)")
    citations: list[Citation] = Field(..., description="Citations supporting the answer")
    reasoning: Optional[str] = Field(default=None, description="Brief reasoning for the answer")


class BatchResult(BaseModel):
    """Result for a batch of questions (max 5)."""
    batch_number: int = Field(..., description="Batch number in sequence")
    answers: list[QuestionAnswer] = Field(..., description="Answers for this batch")


class QuestionnaireOutput(BaseModel):
    """Complete output payload with all answers."""
    request_id: str = Field(..., description="Original request identifier")
    total_questions: int = Field(..., description="Total number of questions processed")
    total_batches: int = Field(..., description="Number of batches processed")
    batches: list[BatchResult] = Field(..., description="Results organized by batch")
    status: str = Field(default="completed", description="Processing status")


# ============== INTERNAL MODELS ==============

class CitationResult(BaseModel):
    """Internal model for citation agent output."""
    question_id: str
    citations: list[Citation]


class DraftResult(BaseModel):
    """Internal model for drafting agent output."""
    question_id: str
    answer: str
    confidence: ConfidenceLevel
    confidence_score: float
    reasoning: Optional[str] = None
