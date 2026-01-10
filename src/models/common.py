"""
Common models shared across all agents.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from dataclasses import dataclass, asdict


class ConfidenceLevel(str, Enum):
    """Confidence levels for answers."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Citation(BaseModel):
    """A citation referencing a source document."""
    doc_id: str = Field(..., description="ID of the cited document")
    doc_title: str = Field(..., description="Title of the cited document")
    relevant_excerpt: str = Field(..., description="Relevant excerpt from the document")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score (0-1)")


@dataclass
class Evidence:
    """Evidence from vector search (used by Knowledge Agent)."""
    text: str
    doc_title: str
    doc_type: str
    section: Optional[str]
    similarity_score: float
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    def to_citation(self) -> Citation:
        """Convert Evidence to Citation format."""
        return Citation(
            doc_id=self.doc_title.lower().replace(" ", "_"),
            doc_title=self.doc_title,
            relevant_excerpt=self.text[:500],
            relevance_score=self.similarity_score
        )


class Question(BaseModel):
    """A security questionnaire question."""
    question_id: str = Field(..., description="Unique identifier for the question")
    question_text: str = Field(..., description="The actual question text")
    category: Optional[str] = Field(default=None, description="Question category")


class ContextDocument(BaseModel):
    """A context document from RAG/MongoDB."""
    doc_id: str = Field(..., description="Unique identifier for the document")
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content/text")
    source: str = Field(..., description="Source of the document (e.g., 'mongodb', 'rag')")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata")

