"""
Escalation Agent - Routes low-confidence answers to appropriate humans.
"""
from typing import List, Dict, Optional
import httpx
import json

from src.core.config import settings
from src.core.database import db
from src.models.common import Citation
from src.models.api import (
    QuestionAnswer,
    BatchResult,
    EscalationResult,
    EscalationResponse,
)


class EscalationAgent:
    """Agent that determines if human escalation is needed and routes to appropriate employees."""
    
    def __init__(
        self, 
        firework_api_key: Optional[str] = None, 
        confidence_threshold: float = 0.7
    ):
        self.firework_api_key = firework_api_key or settings.fireworks_api_key
        self.confidence_threshold = confidence_threshold
        self.firework_base_url = "https://api.fireworks.ai/inference/v1"
    
    async def process_answers(
        self,
        request_id: str,
        batches: List[BatchResult]
    ) -> EscalationResponse:
        """
        Process answers and determine which need escalation.
        
        Args:
            request_id: The request identifier
            batches: List of BatchResult from the drafting stage
        
        Returns:
            EscalationResponse with escalation decisions and routing info
        """
        escalation_results: List[EscalationResult] = []
        
        for batch in batches:
            for answer in batch.answers:
                # Check if already flagged for escalation
                if answer.needs_escalation:
                    requires_escalation = True
                    firework_decision = {
                        "requires_escalation": True,
                        "reason": answer.escalation_reason or "Flagged by Knowledge Agent",
                        "department": self._suggest_department_from_category(answer.category)
                    }
                else:
                    # Check threshold-based escalation
                    threshold_escalation = answer.confidence_score < self.confidence_threshold
                    
                    # Use Firework AI for intelligent escalation decision
                    firework_decision = await self._check_with_firework(
                        answer.question_text,
                        answer.answer,
                        answer.confidence_score,
                        answer.category,
                        citations_context=self._format_citations_context(answer.citations),
                        reasoning=answer.reasoning
                    )
                    
                    requires_escalation = threshold_escalation or firework_decision.get("requires_escalation", False)
                
                routed_to = None
                department = None
                escalation_reason = None
                
                if requires_escalation:
                    routed_to = await self._route_to_employee(
                        answer.question_text,
                        answer.category,
                        firework_decision.get("department")
                    )
                    department = routed_to.get("department") if routed_to else None
                    escalation_reason = firework_decision.get(
                        "reason",
                        f"Low confidence score: {answer.confidence_score:.2f}"
                    )
                
                escalation_results.append(EscalationResult(
                    question_id=answer.question_id,
                    question_text=answer.question_text,
                    answer=answer.answer,
                    confidence=answer.confidence.value,
                    confidence_score=answer.confidence_score,
                    requires_escalation=requires_escalation,
                    escalation_reason=escalation_reason,
                    routed_to=routed_to,
                    department=department,
                    category=answer.category,
                    citations=answer.citations
                ))
        
        total_questions = sum(len(b.answers) for b in batches)
        escalations_required = sum(1 for r in escalation_results if r.requires_escalation)
        
        return EscalationResponse(
            request_id=request_id,
            total_questions=total_questions,
            escalations_required=escalations_required,
            results=escalation_results,
            status="completed"
        )
    
    def _format_citations_context(self, citations: List[Citation]) -> str:
        """Format citations for context in Firework AI prompt."""
        if not citations:
            return "No citations provided."
        
        context_parts = []
        for i, citation in enumerate(citations, 1):
            excerpt = citation.relevant_excerpt[:200] + "..." if len(citation.relevant_excerpt) > 200 else citation.relevant_excerpt
            context_parts.append(
                f"Citation {i}: {citation.doc_title}\n"
                f"  Excerpt: {excerpt}\n"
                f"  Relevance: {citation.relevance_score:.2f}"
            )
        
        return "\n\n".join(context_parts)
    
    async def _check_with_firework(
        self, 
        question: str, 
        answer: str, 
        confidence: float, 
        category: Optional[str],
        citations_context: Optional[str] = None,
        reasoning: Optional[str] = None
    ) -> Dict:
        """Use Firework AI to determine if escalation is needed."""
        citations_section = f"\n\nCitations Context:\n{citations_context}" if citations_context else ""
        reasoning_section = f"\n\nOriginal Reasoning: {reasoning}" if reasoning else ""
        
        prompt = f"""You are a security questionnaire review system. Analyze if this Q&A pair requires human escalation.

Question: {question}
Answer: {answer}
Confidence Score: {confidence:.2f}
Category: {category or "Unknown"}{citations_section}{reasoning_section}

Consider these factors:
1. Is the answer complete and accurate?
2. Does the answer address all aspects of the question?
3. Are the citations relevant and sufficient?
4. Is the confidence score appropriate for the complexity?
5. Are there any security concerns that need human review?

Respond in JSON format:
{{
    "requires_escalation": true/false,
    "reason": "Brief explanation",
    "department": "Suggested department (e.g., Security, Compliance, Engineering) or null"
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.firework_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.firework_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                        "messages": [
                            {"role": "system", "content": "You are an expert security analyst. Respond only with valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 200
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Fireworks API error: {response.status_code}")
                
                response_data = response.json()
                result_text = response_data["choices"][0]["message"]["content"].strip()
                
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                
                return json.loads(result_text)
        
        except Exception as e:
            print(f"Firework AI error: {e}. Using threshold-based decision.")
            return {
                "requires_escalation": confidence < self.confidence_threshold,
                "reason": f"Fallback: Confidence {confidence:.2f} below threshold",
                "department": self._suggest_department_from_category(category)
            }
    
    async def _route_to_employee(
        self, 
        question: str, 
        category: Optional[str], 
        suggested_department: Optional[str]
    ) -> Optional[Dict]:
        """Route escalation to the most appropriate employee."""
        department = suggested_department or self._suggest_department_from_category(category) or "Security"
        
        employees_collection = db.database.employees
        
        # Try to find employee by category/expertise match
        if category:
            employee_doc = await employees_collection.find_one({
                "$or": [
                    {"expertise_areas": {"$regex": category, "$options": "i"}},
                    {"department": {"$regex": department, "$options": "i"}}
                ]
            })
        else:
            employee_doc = await employees_collection.find_one({
                "department": {"$regex": department, "$options": "i"}
            })
        
        if not employee_doc:
            employee_doc = await employees_collection.find_one({
                "department": {"$regex": department, "$options": "i"}
            })
        
        if not employee_doc:
            employee_doc = await employees_collection.find_one({
                "$or": [
                    {"department": "Security"},
                    {"expertise_areas": {"$ne": []}}
                ]
            })
        
        if employee_doc:
            return {
                "id": str(employee_doc.get("_id")),
                "name": employee_doc.get("name"),
                "email": employee_doc.get("email"),
                "role": employee_doc.get("role"),
                "department": employee_doc.get("department")
            }
        
        return None
    
    def _suggest_department_from_category(self, category: Optional[str]) -> Optional[str]:
        """Suggest department based on question category."""
        if not category:
            return None
        
        category_lower = category.lower()
        
        category_to_dept = {
            "authentication": "Security",
            "authorization": "Security",
            "encryption": "Security",
            "data_protection": "Security",
            "data_handling": "Security",
            "access_control": "Security",
            "api_security": "Engineering",
            "network": "Security",
            "compliance": "Compliance",
            "incident_response": "Security",
            "logging": "Engineering",
            "infrastructure": "Engineering",
            "database": "Engineering",
        }
        
        for key, dept in category_to_dept.items():
            if key in category_lower:
                return dept
        
        return "Security"

