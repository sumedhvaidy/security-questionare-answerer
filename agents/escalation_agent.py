"""
Escalation Agent for handling human escalation based on confidence scores and Firework AI decisions.
Routes questions to the right department and identifies appropriate employees.
"""
from typing import List, Dict, Optional
import httpx
import json
from database import db


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
        questions: List[str], 
        answers: List[str], 
        confidence_scores: List[float],
        categories: Optional[List[str]] = None
    ) -> Dict:
        """
        Process a batch of security questionnaire Q&As and determine escalations
        
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
    
    async def _check_with_firework(
        self, 
        question: str, 
        answer: str, 
        confidence: float, 
        category: Optional[str]
    ) -> Dict:
        """
        Use Firework AI to determine if escalation is needed
        
        Args:
            question: Security question
            answer: Generated answer
            confidence: Confidence score
            category: Question category
        
        Returns:
            Dictionary with escalation decision and reasoning
        """
        prompt = f"""You are a security questionnaire review system. Analyze if this Q&A pair requires human escalation.

Question: {question}
Answer: {answer}
Confidence Score: {confidence:.2f}
Category: {category or "Unknown"}

Consider these factors:
1. Is the answer complete and accurate?
2. Does the answer address all aspects of the question?
3. Is the confidence score appropriate for the complexity?
4. Are there any security concerns that need human review?

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
        """Suggest department based on question category"""
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
