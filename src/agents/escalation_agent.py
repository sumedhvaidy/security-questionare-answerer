"""
Escalation Agent - Routes low-confidence answers to appropriate humans.
Accepts citation agentic AI request format.
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
from src.models.escalation_request import (
    EscalationRequest,
    AnswerItem,
    Citation as EscalationCitation,
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
    
    async def process_batch(
        self,
        request: EscalationRequest
    ) -> EscalationResponse:
        """
        Process an escalation request from citation agentic AI and determine escalations.
        
        Args:
            request: EscalationRequest from citation agentic AI with batches of answers
        
        Returns:
            EscalationResponse with escalation decisions and employee routing info
        """
        escalation_results: List[EscalationResult] = []
        
        for batch in request.batches:
            for answer_item in batch.answers:
                # Extract category from citations or question text
                category = self._extract_category_from_answer(answer_item)
                
                # Check threshold-based escalation
                threshold_escalation = answer_item.confidence_score < self.confidence_threshold
                
                # Use Firework AI to make intelligent escalation decision
                citations_context = self._format_citations_context_from_escalation(answer_item.citations)
                firework_decision = await self._check_with_firework(
                    answer_item.question_text,
                    answer_item.answer,
                    answer_item.confidence_score,
                    category,
                    citations_context=citations_context,
                    reasoning=answer_item.reasoning
                )
                
                # Final decision: escalate if either threshold or Firework says so
                requires_escalation = threshold_escalation or firework_decision.get("requires_escalation", False)
                
                routed_to = None
                department = None
                escalation_reason = None
                
                if requires_escalation:
                    routed_to = await self._route_to_employee(
                        answer_item.question_text,
                        category,
                        firework_decision.get("department")
                    )
                    department = routed_to.get("department") if routed_to else None
                    escalation_reason = firework_decision.get(
                        "reason",
                        f"Low confidence score: {answer_item.confidence_score:.2f}"
                    )
                
                # Convert citations to common Citation format
                citations = [
                    Citation(
                        doc_id=c.doc_id,
                        doc_title=c.doc_title,
                        relevant_excerpt=c.relevant_excerpt,
                        relevance_score=c.relevance_score
                    ) for c in answer_item.citations
                ]
                
                escalation_results.append(EscalationResult(
                    question_id=answer_item.question_id,
                    question_text=answer_item.question_text,
                    answer=answer_item.answer,
                    confidence=answer_item.confidence,
                    confidence_score=answer_item.confidence_score,
                    requires_escalation=requires_escalation,
                    escalation_reason=escalation_reason,
                    routed_to=routed_to,
                    department=department,
                    category=category,
                    citations=citations
                ))
        
        escalations_required = sum(1 for r in escalation_results if r.requires_escalation)
        
        return EscalationResponse(
            request_id=request.request_id,
            total_questions=request.total_questions,
            escalations_required=escalations_required,
            results=escalation_results,
            status="completed"
        )
    
    async def process_answers(
        self,
        request_id: str,
        batches: List[BatchResult]
    ) -> EscalationResponse:
        """
        Process answers from the drafting stage and determine which need escalation.
        
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
    
    def _extract_category_from_answer(self, answer_item: AnswerItem) -> Optional[str]:
        """Extract category from citations, question text, or answer content."""
        question_lower = answer_item.question_text.lower()
        answer_lower = answer_item.answer.lower()
        
        category_keywords = {
            "encryption": ["encrypt", "encryption", "encrypted", "aes", "kms", "key management"],
            "authentication": ["auth", "authenticate", "login", "credentials", "password", "jwt", "token", "mfa"],
            "authorization": ["authorize", "permission", "access control", "rbac", "role"],
            "compliance": ["compliance", "gdpr", "soc2", "hipaa", "iso 27001", "certification"],
            "data_protection": ["data protection", "pii", "personal data", "data privacy"],
            "api_security": ["api", "endpoint", "rate limit", "api key"],
            "network_security": ["network", "firewall", "vpn", "ssl", "tls"],
            "infrastructure": ["infrastructure", "cloud", "aws", "azure", "gcp", "server"],
            "database": ["database", "sql", "nosql", "backup", "replication"],
            "incident_response": ["incident", "breach", "notification", "response"],
        }
        
        # Check question first
        for category, keywords in category_keywords.items():
            if any(keyword in question_lower for keyword in keywords):
                return category
        
        # Check answer content
        for category, keywords in category_keywords.items():
            if any(keyword in answer_lower for keyword in keywords):
                return category
        
        # Check citation titles
        for citation in answer_item.citations:
            citation_lower = citation.doc_title.lower()
            for category, keywords in category_keywords.items():
                if any(keyword in citation_lower for keyword in keywords):
                    return category
        
        return None
    
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
    
    def _format_citations_context_from_escalation(self, citations: List[EscalationCitation]) -> str:
        """Format escalation citations for context in Firework AI prompt."""
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

        # Try multiple models with fallback
        model_names = [
            "accounts/fireworks/models/deepseek-v3p2",
            "accounts/fireworks/models/llama-v3-70b-instruct",
            "fireworks/llama-v3-70b-instruct",
        ]
        
        last_error = None
        for model_name in model_names:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{self.firework_base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.firework_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model_name,
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are an expert security analyst. Respond only with valid JSON."
                                },
                                {
                                    "role": "user",
                                    "content": prompt
                                }
                            ],
                            "temperature": 0.3,
                            "max_tokens": 200
                        }
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        result_text = response_data["choices"][0]["message"]["content"].strip()
                        
                        # Extract JSON from response
                        if "```json" in result_text:
                            result_text = result_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in result_text:
                            result_text = result_text.split("```")[1].split("```")[0].strip()
                        
                        result_text = result_text.strip()
                        if result_text.startswith("{"):
                            decision = json.loads(result_text)
                            if not hasattr(self, '_fireworks_success_logged'):
                                print(f"✅ Fireworks AI model '{model_name}' working successfully")
                                self._fireworks_success_logged = True
                            return decision
                        else:
                            last_error = f"Invalid JSON format from model {model_name}"
                            continue
                    elif response.status_code == 404:
                        last_error = f"Model {model_name} not found (404)"
                        continue
                    else:
                        try:
                            error_data = response.json()
                            error_msg = error_data.get("error", {}).get("message", response.text[:100])
                            last_error = f"Model {model_name}: {error_msg}"
                        except:
                            last_error = f"Model {model_name}: HTTP {response.status_code}"
                        continue
            except json.JSONDecodeError:
                continue
            except Exception as e:
                last_error = f"Error with {model_name}: {str(e)[:50]}"
                continue
        
        # Fallback to threshold-based decision
        if not hasattr(self, '_fireworks_warning_shown'):
            print(f"⚠️  Fireworks AI models unavailable ({last_error}). Using threshold-based escalation.")
            self._fireworks_warning_shown = True
        
        return {
            "requires_escalation": confidence < self.confidence_threshold,
            "reason": f"Threshold-based: Confidence {confidence:.2f} {'below' if confidence < self.confidence_threshold else 'above'} threshold {self.confidence_threshold}",
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
        
        # Check if database is connected
        if db.database is None:
            print("⚠️  MongoDB not connected - using fallback employee routing")
            # Return None so frontend knows employee routing failed
            return None
        
        employees_collection = db.database.employees
        
        # Try to find employee by category/expertise match
        employee_doc = None
        
        # Strategy 1: Match by expertise areas
        if category:
            employee_doc = await employees_collection.find_one({
                "expertise_areas": {"$regex": category, "$options": "i"}
            })
        
        # Strategy 2: Match by department
        if not employee_doc:
            employee_doc = await employees_collection.find_one({
                "department": {"$regex": department, "$options": "i"}
            })
        
        # Strategy 3: Any Security team member
        if not employee_doc:
            employee_doc = await employees_collection.find_one({
                "department": {"$regex": "security", "$options": "i"}
            })
        
        # Strategy 4: Just get any employee
        if not employee_doc:
            employee_doc = await employees_collection.find_one({})
        
        if employee_doc:
            return {
                "id": str(employee_doc.get("_id")),
                "name": employee_doc.get("name"),
                "email": employee_doc.get("email"),
                "title": employee_doc.get("role") or employee_doc.get("title"),
                "role": employee_doc.get("role"),
                "department": employee_doc.get("department")
            }
        
        # No employees in database
        print("⚠️  No employees found in database")
        return None
        
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
            "network_security": "Security",
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
