"""
Escalation Agent for handling human escalation based on confidence scores and Firework AI decisions.
Routes questions to the right department and identifies appropriate employees.
Accepts citation agentic AI request format.
"""
from typing import List, Dict, Optional
import httpx
import json
from database import db
from models.request_for_escalation_agent import (
    EscalationRequest, 
    EscalationResponse, 
    EscalationResult, 
    AnswerItem,
    Citation
)


class EscalationAgent:
    """Agent that determines if human escalation is needed and routes to appropriate employees"""
    
    def __init__(self, firework_api_key: str, confidence_threshold: float = 0.7):
        """
        Initialize Escalation Agent
        
        Args:
            firework_api_key: Firework AI API key
            confidence_threshold: Minimum confidence score threshold (0-1)
        """
        self.firework_api_key = firework_api_key
        self.confidence_threshold = confidence_threshold
        self.firework_base_url = "https://api.fireworks.ai/inference/v1"
    
    async def process_batch(
        self,
        request: EscalationRequest
    ) -> EscalationResponse:
        """
        Process an escalation request from citation agentic AI and determine escalations
        
        Args:
            request: EscalationRequest from citation agentic AI with batches of answers
        
        Returns:
            EscalationResponse with escalation decisions and employee routing info
        """
        escalation_results: List[EscalationResult] = []
        
        # Process all batches
        for batch in request.batches:
            for answer_item in batch.answers:
                # Extract category from citations or question text
                category = self._extract_category_from_answer(answer_item)
                
                # Check threshold-based escalation
                threshold_escalation = answer_item.confidence_score < self.confidence_threshold
                
                # Use Firework AI to make intelligent escalation decision
                # Include citations in the decision for better context
                citations_context = self._format_citations_context(answer_item.citations)
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
                    # Route to appropriate employee
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
                
                escalation_result = EscalationResult(
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
                    citations=answer_item.citations
                )
                
                escalation_results.append(escalation_result)
        
        escalations_required = sum(1 for r in escalation_results if r.requires_escalation)
        
        return EscalationResponse(
            request_id=request.request_id,
            total_questions=request.total_questions,
            escalations_required=escalations_required,
            results=escalation_results,
            status="completed"
        )
    
    async def process_batch_legacy(
        self,
        questions: List[str],
        answers: List[str],
        confidence_scores: List[float],
        categories: Optional[List[str]] = None,
        department: Optional[str] = None
    ) -> Dict:
        """
        Legacy method: Process a batch of security questionnaire Q&As and determine escalations
        Maintained for backward compatibility
        
        Args:
            questions: List of security questions
            answers: List of corresponding answers
            confidence_scores: List of confidence scores (0-1)
            categories: Optional list of question categories (e.g., "authentication", "encryption")
        
        Returns:
            Dictionary with escalation decisions and employee routing info
        """
        if categories is None:
            categories = [None] * len(questions)
        
        if len(questions) != len(answers) != len(confidence_scores) != len(categories):
            raise ValueError("All input lists must have the same length")
        
        escalation_results = []
        
        for question, answer, confidence, category in zip(questions, answers, confidence_scores, categories):
            # First check threshold-based escalation
            threshold_escalation = confidence < self.confidence_threshold
            
            # Use Firework AI to make intelligent escalation decision
            firework_decision = await self._check_with_firework(question, answer, confidence, category)
            
            # Final decision: escalate if either threshold or Firework says so
            requires_escalation = threshold_escalation or firework_decision.get("requires_escalation", False)
            
            if requires_escalation:
                # Route to appropriate employee
                employee_info = await self._route_to_employee(question, category, firework_decision.get("department"))
                
                escalation_results.append({
                    "question": question,
                    "answer": answer,
                    "confidence_score": confidence,
                    "category": category,
                    "requires_escalation": True,
                    "escalation_reason": firework_decision.get("reason", f"Low confidence score: {confidence:.2f}"),
                    "routed_to": employee_info,
                    "department": employee_info.get("department") if employee_info else None
                })
            else:
                escalation_results.append({
                    "question": question,
                    "answer": answer,
                    "confidence_score": confidence,
                    "category": category,
                    "requires_escalation": False,
                    "escalation_reason": None,
                    "routed_to": None,
                    "department": None
                })
        
        return {
            "total_questions": len(questions),
            "escalations_required": sum(1 for r in escalation_results if r["requires_escalation"]),
            "results": escalation_results
        }
    
    def _extract_category_from_answer(self, answer_item: AnswerItem) -> Optional[str]:
        """
        Extract category from citations, question text, or answer content
        
        Args:
            answer_item: AnswerItem with question, answer, and citations
        
        Returns:
            Suggested category string or None
        """
        question_lower = answer_item.question_text.lower()
        answer_lower = answer_item.answer.lower()
        
        # Keywords mapping to categories
        category_keywords = {
            "encryption": ["encrypt", "encryption", "encrypted", "aes", "kms", "key management"],
            "authentication": ["auth", "authenticate", "login", "credentials", "password", "jwt", "token"],
            "authorization": ["authorize", "permission", "access control", "rbac", "role"],
            "compliance": ["compliance", "gdpr", "soc2", "hipaa", "iso 27001", "certification"],
            "data-protection": ["data protection", "pii", "personal data", "data privacy"],
            "api-security": ["api", "endpoint", "rate limit", "api key"],
            "network-security": ["network", "firewall", "vpn", "ssl", "tls"],
            "infrastructure": ["infrastructure", "cloud", "aws", "azure", "gcp", "server"],
            "database": ["database", "sql", "nosql", "backup", "replication"],
            "devops": ["devops", "ci/cd", "deployment", "monitoring", "logging"]
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
        """
        Format citations for context in Firework AI prompt
        
        Args:
            citations: List of Citation objects
        
        Returns:
            Formatted string with citation context
        """
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
        """
        Use Firework AI to determine if escalation is needed
        
        Args:
            question: Security question
            answer: Generated answer
            confidence: Confidence score
            category: Question category
            citations_context: Optional formatted citations context
            reasoning: Optional reasoning from citation agent
        
        Returns:
            Dictionary with escalation decision and reasoning
            requires_escalation: true/false,
            reason: "Brief explanation",
            department: "Suggested department (e.g., Security, Compliance, Engineering) or null"
        """
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
            # Use Fireworks AI API via httpx (OpenAI-compatible endpoint)
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.firework_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.firework_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "accounts/fireworks/models/llama-v3-70b-instruct",
                        # Try alternative models if this fails: "meta-llama/Llama-3-70b-instruct" or "fireworks/llama-v3-70b-instruct"
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
                
                if response.status_code != 200:
                    raise Exception(f"Fireworks API error: {response.status_code} - {response.text}")
                
                response_data = response.json()
                result_text = response_data["choices"][0]["message"]["content"].strip()
                
                # Extract JSON from response (handle markdown code blocks)
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                
                decision = json.loads(result_text)
                return decision
        
        except Exception as e:
            print(f"Firework AI error: {e}. Using threshold-based decision.")
            # Fallback to threshold-based decision
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
        """
        Route escalation to the most appropriate employee based on question and category
        
        Args:
            question: Security question
            category: Question category
            suggested_department: Department suggested by Firework AI
        
        Returns:
            Employee information dictionary or None
            id: employee id,
            name: employee name,
            email: employee email,
            role: employee role,
            department: employee department
        """
        # Determine department
        department = suggested_department or self._suggest_department_from_category(category)
        
        if not department:
            # Default to Security if we can't determine
            department = "Security"
        
        # Search for matching employee
        employees_collection = db.database.employees
        
        # First, try to find employee by category/expertise match
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
            # Fallback: get any employee from the department
            employee_doc = await employees_collection.find_one({
                "department": {"$regex": department, "$options": "i"}
            })
        
        if not employee_doc:
            # Last resort: get any security-related employee
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
        """
        Suggest department based on question category
        Returns:
            Department (str): the department that the question is related to
        """
        if not category:
            return None
        
        category_lower = category.lower()
        
        category_to_dept = {
            "authentication": "Security",
            "authorization": "Security",
            "encryption": "Security",
            "data-protection": "Security",
            "api-security": "Engineering",
            "network-security": "Security",
            "compliance": "Compliance",
            "gdpr": "Compliance",
            "soc2": "Compliance",
            "infrastructure": "Engineering",
            "database": "Engineering",
            "devops": "Engineering"
        }
        
        for key, dept in category_to_dept.items():
            if key in category_lower:
                return dept
        
        return "Security"  # Default
