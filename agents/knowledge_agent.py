"""
Knowledge Agent - The Brain of the Security Questionnaire System

This agent THINKS, not just retrieves:
1. Question → Normalize & fingerprint
2. Check qa_library (verified answers) → If found, return with high confidence
3. Vector search chunks → Find evidence
4. Score confidence → Decide: answer or escalate
5. Return structured response with citations
"""

import os
import json
import time
from datetime import datetime, timezone
from typing import Optional, List
from dataclasses import dataclass, asdict
from dotenv import load_dotenv
import voyageai
from pymongo import MongoClient
import anthropic

load_dotenv()

# ============================================================================
# Configuration
# ============================================================================

DB_NAME = os.getenv("MONGODB_DB_NAME", "security_questionnaire")
VOYAGE_MODEL = "voyage-3-large"
CONFIDENCE_THRESHOLD = 0.7  # Below this → escalate
QA_LIBRARY_BOOST = 0.15  # Bonus for verified answers
ANSWERABILITY_PENALTY = 0.5  # Multiply confidence by this if evidence doesn't answer


# ============================================================================
# Answerability Check Prompt
# ============================================================================

ANSWERABILITY_PROMPT = """You are a critical evaluator for a security questionnaire system. Your job is to determine if retrieved evidence ACTUALLY ANSWERS a question, or if it's merely TOPICALLY RELATED.

## THE CRITICAL DISTINCTION

**ANSWERS** = The evidence contains specific information that directly addresses what the question is asking. Someone reading this evidence would know the answer.

**RELATED** = The evidence mentions similar topics, keywords, or concepts, but does NOT contain the specific information needed to answer the question.

## EXAMPLES

### Example 1: ANSWERS ✓
Question: "What encryption algorithm do you use for data at rest?"
Evidence: "All customer data is encrypted using AES-256 encryption at rest."
Verdict: ANSWERS - The evidence directly states the encryption algorithm (AES-256).

### Example 2: RELATED ✗
Question: "Can you sign our custom DPA?"
Evidence: "DataFlow requires vendors to sign data processing agreements with specific security clauses."
Verdict: RELATED - This talks about DataFlow's requirements for THEIR vendors, not whether they'll sign a CUSTOMER's custom DPA. The evidence is about the wrong direction of the relationship.

### Example 3: RELATED ✗
Question: "What is your password rotation policy?"
Evidence: "DataFlow implements strong access controls including multi-factor authentication."
Verdict: RELATED - MFA is related to access control but doesn't answer the specific question about password rotation.

### Example 4: ANSWERS ✓
Question: "Do you have SOC 2 certification?"
Evidence: "DataFlow completed SOC 2 Type II certification in November 2024."
Verdict: ANSWERS - Directly confirms SOC 2 certification with specific details.

### Example 5: RELATED ✗
Question: "What is your data retention period?"
Evidence: "DataFlow classifies data into tiers: Critical, Sensitive, Internal, and Public."
Verdict: RELATED - Data classification is related to data management but doesn't specify retention periods.

## QUESTION TYPES THAT OFTEN GET "RELATED" EVIDENCE

1. **Business/Legal decisions** (e.g., "Can you sign X?", "Will you agree to Y?") - Policies describe WHAT exists, not business flexibility
2. **Specific metrics/numbers** (e.g., "How many days?", "What percentage?") - General policies often lack specifics
3. **Future commitments** (e.g., "Will you notify us if...?") - Evidence about past practices ≠ future commitments
4. **Customer-specific requests** (e.g., "Can you do X for us?") - Standard policies don't address custom requests

## YOUR TASK

Question: {question}

Evidence:
{evidence}

Think step by step:
1. What SPECIFIC information is the question asking for?
2. Does the evidence contain that SPECIFIC information?
3. Or does it just mention related topics/keywords?

Respond with ONLY one of these exact formats:
- ANSWERS: [one sentence explaining what specific information in the evidence answers the question]
- RELATED: [one sentence explaining why this is topically related but doesn't actually answer the question]"""


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class Evidence:
    """A piece of evidence supporting an answer."""
    text: str
    doc_title: str
    doc_type: str
    section: Optional[str]
    similarity_score: float
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AgentResponse:
    """The Knowledge Agent's response to a question."""
    question: str
    answer: str
    confidence: float
    source_type: str  # "qa_library" | "vector_search" | "escalate"
    evidence: List[Evidence]
    reasoning: str
    needs_escalation: bool
    category: Optional[str] = None
    escalation_reason: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "answer": self.answer,
            "confidence": self.confidence,
            "source_type": self.source_type,
            "evidence": [e.to_dict() for e in self.evidence],
            "reasoning": self.reasoning,
            "needs_escalation": self.needs_escalation,
            "category": self.category,
            "escalation_reason": self.escalation_reason
        }


# ============================================================================
# Knowledge Agent
# ============================================================================

class KnowledgeAgent:
    """
    The Knowledge Agent - maintains verified answers and retrieves evidence.
    
    This is what makes it AGENTIC:
    1. It has MEMORY (qa_library of verified answers)
    2. It makes DECISIONS (reuse vs search vs escalate)
    3. It provides REASONING (why it chose this answer)
    """
    
    def __init__(
        self,
        voyage_api_key: Optional[str] = None,
        mongodb_uri: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        confidence_threshold: float = CONFIDENCE_THRESHOLD
    ):
        """
        Initialize the Knowledge Agent.
        
        Args:
            voyage_api_key: VoyageAI API key (or set VOYAGE_API_KEY env var)
            mongodb_uri: MongoDB connection URI (or set MONGODB_URI env var)
            anthropic_api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
            confidence_threshold: Minimum confidence to auto-answer (default 0.7)
        """
        self.voyage = voyageai.Client(
            api_key=voyage_api_key or os.getenv("VOYAGE_API_KEY")
        )
        self.mongo = MongoClient(mongodb_uri or os.getenv("MONGODB_URI"))
        self.db = self.mongo[DB_NAME]
        self.claude = anthropic.Anthropic(
            api_key=anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        )
        self.confidence_threshold = confidence_threshold
        
    def answer_question(self, question: str, verbose: bool = True) -> AgentResponse:
        """
        Main entry point - the agent's decision loop.
        
        Args:
            question: The security questionnaire question
            verbose: Whether to print progress (default True)
            
        Returns:
            AgentResponse with answer, confidence, evidence, and escalation info
        """
        if verbose:
            print(f"\n{'='*60}")
            print(f"🤖 KNOWLEDGE AGENT PROCESSING")
            print(f"{'='*60}")
            print(f"Question: {question}")
            print()
        
        # Step 1: Normalize the question
        normalized = self._normalize_question(question)
        if verbose:
            print(f"📝 Normalized: {normalized['intent']}")
            print(f"   Fingerprint: {normalized['fingerprint']}")
            print(f"   Category: {normalized['category']}")
            print()
        
        # Step 2: Check qa_library FIRST (this is the agentic part!)
        qa_match = self._check_qa_library(normalized['fingerprint'], question)
        if qa_match:
            if verbose:
                print(f"✅ FOUND IN QA LIBRARY (verified answer)")
                print(f"   Original question: {qa_match['question_text'][:60]}...")
                print(f"   Confidence: {qa_match['confidence']}")
            return self._build_response_from_qa(question, qa_match, normalized['category'])
        
        if verbose:
            print("❌ Not in QA library, falling back to vector search...")
            print()
        
        # Step 3: Vector search for evidence
        evidence = self._vector_search(question)
        if verbose:
            print(f"🔍 Found {len(evidence)} evidence chunks")
            for i, e in enumerate(evidence[:3]):
                print(f"   [{i+1}] {e.doc_title} ({e.doc_type}) - Score: {e.similarity_score:.3f}")
                print(f"       Section: {e.section or 'N/A'}")
            print()
        
        # Step 4: Evaluate confidence (similarity-based)
        raw_confidence = self._calculate_confidence(evidence)
        if verbose:
            print(f"📊 Similarity-based confidence: {raw_confidence:.2f}")
        
        # Step 5: CRITICAL - Check if evidence actually ANSWERS the question
        if verbose:
            print()
        answers_question, answerability_reasoning = self._check_answerability(
            question, evidence, verbose
        )
        
        # Adjust confidence based on answerability
        if not answers_question:
            confidence = raw_confidence * ANSWERABILITY_PENALTY
            if verbose:
                print(f"⚠️  Evidence is RELATED but doesn't ANSWER - confidence penalty applied")
                print(f"📊 Adjusted confidence: {confidence:.2f}")
        else:
            confidence = raw_confidence
            if verbose:
                print(f"✅ Evidence ANSWERS the question")
        print()
        
        # Step 6: Decision - answer or escalate?
        if confidence < self.confidence_threshold:
            if verbose:
                print(f"⚠️  LOW CONFIDENCE ({confidence:.2f}) - Recommending escalation")
            
            # Use answerability reasoning for better escalation reason
            escalation_reason = (
                f"Evidence is topically related but doesn't answer the question: {answerability_reasoning}"
                if not answers_question
                else "Confidence below threshold - needs human verification"
            )
            
            return self._build_escalation_response(
                question, evidence, confidence, normalized['category'],
                custom_reason=escalation_reason
            )
        
        # Step 7: Draft answer from evidence
        if verbose:
            print(f"✅ Confidence OK ({confidence:.2f}) - Drafting answer...")
        return self._draft_answer(question, evidence, confidence, normalized['category'])
    
    def answer_batch(
        self, 
        questions: List[str], 
        verbose: bool = False
    ) -> List[AgentResponse]:
        """
        Process a batch of questions.
        
        Args:
            questions: List of questions to answer
            verbose: Whether to print progress for each question
            
        Returns:
            List of AgentResponse objects
        """
        responses = []
        for i, question in enumerate(questions):
            if not verbose:
                print(f"Processing question {i+1}/{len(questions)}...", end="\r")
            response = self.answer_question(question, verbose=verbose)
            responses.append(response)
        
        if not verbose:
            print(f"\nProcessed {len(questions)} questions")
        
        return responses
    
    def _normalize_question(self, question: str) -> dict:
        """Normalize question to stable form for matching."""
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"""Extract the core intent from this security questionnaire question.
                
Question: {question}

Return JSON only:
{{"intent": "brief description of what's being asked", "fingerprint": "lowercase_underscored_key", "category": "encryption|access_control|logging|incident_response|compliance|data_handling|network|authentication|other"}}"""
            }]
        )
        
        try:
            text = response.content[0].text
            # Handle markdown code blocks
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except Exception:
            # Fallback
            return {
                "intent": question[:50],
                "fingerprint": question[:30].lower().replace(" ", "_"),
                "category": "other"
            }
    
    def _check_qa_library(self, fingerprint: str, question: str) -> Optional[dict]:
        """
        Check if we have a verified answer for this question.
        
        This is the MEMORY component - the agent learns from past answers.
        """
        qa_collection = self.db["qa_library"]
        
        # First try exact fingerprint match
        exact_match = qa_collection.find_one({"question_fingerprint": fingerprint})
        if exact_match:
            return exact_match
        
        # Try semantic similarity on question embeddings
        try:
            query_embedding = self.voyage.embed(
                [question], 
                model=VOYAGE_MODEL, 
                input_type="query"
            ).embeddings[0]
            
            # Vector search on qa_library
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "qa_question_index",
                        "path": "question_embedding",
                        "queryVector": query_embedding,
                        "numCandidates": 20,
                        "limit": 3
                    }
                },
                {
                    "$project": {
                        "question_fingerprint": 1,
                        "question_text": 1,
                        "answer": 1,
                        "evidence_source": 1,
                        "confidence": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            
            results = list(qa_collection.aggregate(pipeline))
            # High similarity threshold for qa_library matches
            if results and results[0].get("score", 0) > 0.85:
                return results[0]
        except Exception as e:
            # Vector index might not exist on qa_library yet
            print(f"   (QA library vector search not available: {e})")
        
        return None
    
    def _vector_search(self, question: str, limit: int = 5) -> List[Evidence]:
        """Search document chunks for relevant evidence."""
        # Generate query embedding
        query_embedding = self.voyage.embed(
            [question],
            model=VOYAGE_MODEL,
            input_type="query"
        ).embeddings[0]
        
        # Vector search on chunks
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "chunk_vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": limit
                }
            },
            {
                "$lookup": {
                    "from": "documents",
                    "localField": "doc_id",
                    "foreignField": "_id",
                    "as": "doc_info"
                }
            },
            {
                "$project": {
                    "text": 1,
                    "section": 1,
                    "doc_id": 1,
                    "doc_type": 1,
                    "doc_info": {"$arrayElemAt": ["$doc_info", 0]},
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(self.db["chunks"].aggregate(pipeline))
        
        evidence = []
        for r in results:
            doc_info = r.get("doc_info", {})
            evidence.append(Evidence(
                text=r.get("text", ""),
                doc_title=doc_info.get("title", r.get("doc_id", "Unknown")),
                doc_type=r.get("doc_type", "unknown"),
                section=r.get("section"),
                similarity_score=r.get("score", 0)
            ))
        
        return evidence
    
    def _calculate_confidence(self, evidence: List[Evidence]) -> float:
        """
        Calculate confidence score based on evidence quality.
        
        Factors:
        1. Top evidence similarity (50%)
        2. Source authority (30%) - SOC2 > policy > other
        3. Evidence count (20%)
        """
        if not evidence:
            return 0.0
        
        top_score = evidence[0].similarity_score if evidence else 0
        
        # Source authority weights
        authority_map = {"soc2": 1.0, "policy": 0.8, "procedure": 0.7, "other": 0.5}
        avg_authority = sum(
            authority_map.get(e.doc_type, 0.5) for e in evidence[:3]
        ) / min(len(evidence), 3)
        
        # Evidence count factor (more evidence = more confident, up to a point)
        count_factor = min(len(evidence) / 3, 1.0)
        
        confidence = (
            0.5 * top_score +
            0.3 * avg_authority +
            0.2 * count_factor
        )
        
        return min(confidence, 0.98)  # Cap at 0.98
    
    def _check_answerability(
        self, 
        question: str, 
        evidence: List[Evidence],
        verbose: bool = True
    ) -> tuple[bool, str]:
        """
        Check if evidence ACTUALLY ANSWERS the question vs just being related.
        
        This is the critical check that prevents RAG hallucinations.
        
        Args:
            question: The question being asked
            evidence: Retrieved evidence chunks
            verbose: Whether to print the evaluation
            
        Returns:
            Tuple of (answers_question: bool, reasoning: str)
        """
        if not evidence:
            return False, "No evidence available"
        
        # Combine top evidence for evaluation
        evidence_text = "\n\n---\n\n".join([
            f"[{e.doc_title} - {e.section or 'General'}]\n{e.text[:600]}"
            for e in evidence[:3]
        ])
        
        prompt = ANSWERABILITY_PROMPT.format(
            question=question,
            evidence=evidence_text
        )
        
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        result = response.content[0].text.strip()
        
        if verbose:
            print(f"🎯 Answerability check: {result[:80]}...")
        
        answers = result.upper().startswith("ANSWERS")
        reasoning = result.split(":", 1)[1].strip() if ":" in result else result
        
        return answers, reasoning
    
    def _build_response_from_qa(
        self, 
        question: str, 
        qa_match: dict,
        category: Optional[str] = None
    ) -> AgentResponse:
        """Build response from verified QA library match."""
        return AgentResponse(
            question=question,
            answer=qa_match["answer"],
            confidence=min(qa_match.get("confidence", 0.9) + QA_LIBRARY_BOOST, 0.99),
            source_type="qa_library",
            evidence=[Evidence(
                text=qa_match["answer"],
                doc_title=qa_match.get("evidence_source", "Verified Answer Library"),
                doc_type="verified",
                section=None,
                similarity_score=1.0
            )],
            reasoning=f"Found verified answer in QA library (fingerprint: {qa_match['question_fingerprint']}). This answer has been human-verified and is reusable.",
            needs_escalation=False,
            category=category
        )
    
    def _build_escalation_response(
        self, 
        question: str, 
        evidence: List[Evidence], 
        confidence: float,
        category: Optional[str] = None,
        custom_reason: Optional[str] = None
    ) -> AgentResponse:
        """Build escalation response for low-confidence questions."""
        
        # Use custom reason if provided, otherwise determine automatically
        if custom_reason:
            reason = custom_reason
        elif not evidence:
            reason = "No relevant evidence found in knowledge base"
        elif confidence < 0.4:
            reason = "Evidence is weak or not directly relevant"
        else:
            reason = "Evidence found but confidence below threshold - needs human verification"
        
        return AgentResponse(
            question=question,
            answer="[REQUIRES HUMAN REVIEW]",
            confidence=confidence,
            source_type="escalate",
            evidence=evidence[:3],
            reasoning=f"Confidence {confidence:.2f} is below threshold {self.confidence_threshold}. Escalating for human review.",
            needs_escalation=True,
            category=category,
            escalation_reason=reason
        )
    
    def _draft_answer(
        self, 
        question: str, 
        evidence: List[Evidence], 
        confidence: float,
        category: Optional[str] = None
    ) -> AgentResponse:
        """Draft answer from evidence using Claude."""
        
        # Prepare evidence context
        evidence_text = "\n\n".join([
            f"[{e.doc_title} - {e.section or 'General'}]\n{e.text[:500]}"
            for e in evidence[:3]
        ])
        
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"""You are answering a security questionnaire question for a B2B SaaS company.

Question: {question}

Evidence from our documentation:
{evidence_text}

Write a professional, concise answer (2-4 sentences) based ONLY on the evidence provided.
- Be specific and factual
- Reference specific controls, standards, or timeframes from the evidence
- Do not make up information not in the evidence

Answer:"""
            }]
        )
        
        answer = response.content[0].text.strip()
        
        return AgentResponse(
            question=question,
            answer=answer,
            confidence=confidence,
            source_type="vector_search",
            evidence=evidence[:3],
            reasoning=f"Drafted answer from {len(evidence)} evidence chunks. Top evidence from {evidence[0].doc_title} (similarity: {evidence[0].similarity_score:.3f})",
            needs_escalation=False,
            category=category
        )
    
    def learn_from_feedback(
        self, 
        question: str, 
        approved_answer: str, 
        evidence_source: str
    ) -> str:
        """
        Store approved answer in QA library for future reuse.
        
        This is the LEARNING component - the agent improves over time.
        
        Args:
            question: The original question
            approved_answer: Human-approved answer
            evidence_source: Source document or description
            
        Returns:
            The fingerprint of the stored answer
        """
        normalized = self._normalize_question(question)
        
        # Generate embedding for the question
        embedding = self.voyage.embed(
            [question],
            model=VOYAGE_MODEL,
            input_type="query"
        ).embeddings[0]
        
        qa_record = {
            "_id": f"qa_{normalized['fingerprint']}",
            "question_fingerprint": normalized["fingerprint"],
            "question_text": question,
            "question_embedding": embedding,
            "answer": approved_answer,
            "evidence_source": evidence_source,
            "category": normalized["category"],
            "confidence": 0.95,
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc),
            "usage_count": 0
        }
        
        self.db["qa_library"].replace_one(
            {"_id": qa_record["_id"]},
            qa_record,
            upsert=True
        )
        
        print(f"✅ Learned new answer (fingerprint: {normalized['fingerprint']})")
        return normalized['fingerprint']
    
    def get_stats(self) -> dict:
        """Get statistics about the knowledge base."""
        return {
            "qa_library_count": self.db["qa_library"].count_documents({}),
            "chunks_count": self.db["chunks"].count_documents({}),
            "documents_count": self.db["documents"].count_documents({})
        }


# ============================================================================
# Output Formatting
# ============================================================================

def format_response_for_engineer2(responses: List[AgentResponse]) -> dict:
    """
    Format responses for Engineer 2's Citation + Drafting agents.
    
    Returns dict with:
        - questions: List[str]
        - answers: List[str]
        - confidence_scores: List[float]
        - categories: List[str]
        - evidence: List[List[dict]]
        - needs_escalation: List[bool]
    """
    return {
        "questions": [r.question for r in responses],
        "answers": [r.answer for r in responses],
        "confidence_scores": [r.confidence for r in responses],
        "categories": [r.category for r in responses],
        "evidence": [[e.to_dict() for e in r.evidence] for r in responses],
        "needs_escalation": [r.needs_escalation for r in responses]
    }


def format_for_escalation_agent(responses: List[AgentResponse]) -> dict:
    """
    Format responses for Engineer 3's Escalation Agent.
    
    Returns the format expected by EscalationAgent.process_batch():
        - questions: List[str]
        - answers: List[str]
        - confidence_scores: List[float]
        - categories: List[str]
    """
    return {
        "questions": [r.question for r in responses],
        "answers": [r.answer for r in responses],
        "confidence_scores": [r.confidence for r in responses],
        "categories": [r.category for r in responses]
    }

