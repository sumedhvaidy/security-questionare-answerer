"""
Unified models for the Security Questionnaire system.
"""
from src.models.common import (
    ConfidenceLevel,
    Citation,
    Evidence,
    Question,
    ContextDocument,
)
from src.models.employee import (
    Employee,
    EmployeeCreate,
    EmployeeResponse,
    PyObjectId,
)
from src.models.api import (
    # Input models
    QuestionnaireInput,
    # Output models
    QuestionAnswer,
    BatchResult,
    QuestionnaireOutput,
    # Internal models
    CitationResult,
    DraftResult,
    # Escalation models (internal orchestrator format)
    EscalationRequest,
    EscalationResult,
    EscalationResponse,
)
from src.models.escalation_request import (
    # External citation agent request format
    EscalationRequest as CitationEscalationRequest,
    AnswerItem,
    Batch,
    Citation as EscalationCitation,
)

__all__ = [
    # Common
    "ConfidenceLevel",
    "Citation",
    "Evidence",
    "Question",
    "ContextDocument",
    # Employee
    "Employee",
    "EmployeeCreate",
    "EmployeeResponse",
    "PyObjectId",
    # API
    "QuestionnaireInput",
    "QuestionAnswer",
    "BatchResult",
    "QuestionnaireOutput",
    "CitationResult",
    "DraftResult",
    "EscalationRequest",
    "EscalationResult",
    "EscalationResponse",
    # External citation agent format
    "CitationEscalationRequest",
    "AnswerItem",
    "Batch",
    "EscalationCitation",
]

