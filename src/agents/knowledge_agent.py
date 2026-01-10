"""
Knowledge Agent - Retrieval component of the Security Questionnaire System

This agent handles:
1. Check QA library for verified answers
2. Vector search for relevant evidence chunks
3. Return structured JSON data for Citation/Drafting agents

The actual answer generation and confidence scoring is handled by
Citation Agent + Drafting Agent.
"""

import os
import json
from datetime import datetime, timezone
from typing import Optional, List
from dotenv import load_dotenv
import voyageai
from pymongo import MongoClient

from src.core.config import settings
from src.models.common import Evidence

load_dotenv()

# ============================================================================
# Configuration
# ============================================================================

VOYAGE_MODEL = settings.voyage_model
QA_LIBRARY_BOOST = 0.15


# ============================================================================
# Knowledge Agent
# ============================================================================

class KnowledgeAgent:
    """
    Knowledge Agent - Retrieval and evidence gathering.
    
    This agent:
    1. Checks QA library for verified answers (memory)
    2. Performs vector search for relevant evidence
    3. Returns structured data for downstream agents
    """
    
    def __init__(
        self,
        voyage_api_key: Optional[str] = None,
        mongodb_uri: Optional[str] = None,
    ):
        self.voyage = voyageai.Client(
            api_key=voyage_api_key or settings.voyage_api_key or os.getenv("VOYAGE_API_KEY")
        )
        self.mongo = MongoClient(
            mongodb_uri or settings.mongodb_uri or os.getenv("MONGODB_URI")
        )
        self.db = self.mongo[settings.mongodb_db_name]
    
    def retrieve(self, question: str, limit: int = 5, verbose: bool = True) -> dict:
        """
        Main entry point - retrieve evidence for a question.
        
        Returns JSON data in format compatible with Citation Agent:
        {
            "question": str,
            "question_id": str,
            "category": str,
            "source": "qa_library" | "vector_search",
            "context_documents": [
                {
                    "doc_id": str,
                    "title": str,
                    "content": str,
                    "source": str,
                    "metadata": {"similarity_score": float, "section": str}
                }
            ],
            "verified_answer": str | None  # If found in QA library
        }
        """
        if verbose:
            print(f"\n{'='*60}")
            print(f"🔍 KNOWLEDGE AGENT - RETRIEVING")
            print(f"{'='*60}")
            print(f"Question: {question}\n")
        
        # Step 1: Normalize question to get fingerprint and category
        normalized = self._normalize_question(question)
        if verbose:
            print(f"📝 Fingerprint: {normalized['fingerprint']}")
            print(f"   Category: {normalized['category']}\n")
        
        # Step 2: Check QA library first
        qa_match = self._check_qa_library(normalized['fingerprint'], question)
        if qa_match:
            if verbose:
                print(f"✅ FOUND IN QA LIBRARY (verified answer)")
                print(f"   Confidence: {qa_match.get('confidence', 0.95)}")
            
            return {
                "question": question,
                "question_id": normalized['fingerprint'],
                "category": normalized['category'],
                "source": "qa_library",
                "context_documents": [{
                    "doc_id": qa_match.get("_id", "qa_library"),
                    "title": qa_match.get("evidence_source", "Verified Answer Library"),
                    "content": qa_match["answer"],
                    "source": "qa_library",
                    "metadata": {
                        "similarity_score": 1.0,
                        "verified": True,
                        "last_verified": qa_match.get("last_verified")
                    }
                }],
                "verified_answer": qa_match["answer"]
            }
        
        if verbose:
            print("❌ Not in QA library, searching document chunks...\n")
        
        # Step 3: Vector search for evidence
        evidence = self._vector_search(question, limit=limit)
        
        if verbose:
            print(f"🔍 Found {len(evidence)} evidence chunks:")
            for i, e in enumerate(evidence[:5]):
                print(f"   [{i+1}] {e.doc_title} - Score: {e.similarity_score:.3f}")
                if e.section:
                    print(f"       Section: {e.section}")
            print()
        
        # Convert to context_documents format for Citation Agent
        context_documents = []
        for e in evidence:
            context_documents.append({
                "doc_id": e.doc_title.lower().replace(" ", "_"),
                "title": e.doc_title,
                "content": e.text,
                "source": e.doc_type,
                "metadata": {
                    "similarity_score": e.similarity_score,
                    "section": e.section
                }
            })
        
        return {
            "question": question,
            "question_id": normalized['fingerprint'],
            "category": normalized['category'],
            "source": "vector_search",
            "context_documents": context_documents,
            "verified_answer": None
        }
    
    def retrieve_batch(
        self, 
        questions: List[str], 
        limit: int = 5,
        verbose: bool = False
    ) -> List[dict]:
        """Retrieve evidence for multiple questions."""
        results = []
        for i, question in enumerate(questions):
            if verbose:
                print(f"\nProcessing {i+1}/{len(questions)}...")
            result = self.retrieve(question, limit=limit, verbose=verbose)
            results.append(result)
        return results
    
    def _normalize_question(self, question: str) -> dict:
        """Create a simple fingerprint and category for the question."""
        # Simple keyword-based categorization (no LLM needed)
        question_lower = question.lower()
        
        category_keywords = {
            "encryption": ["encrypt", "aes", "kms", "key management", "data at rest", "in transit", "tls", "ssl"],
            "authentication": ["auth", "mfa", "multi-factor", "password", "login", "sso", "saml", "oauth"],
            "access_control": ["access control", "rbac", "permission", "privilege", "least privilege"],
            "compliance": ["soc 2", "soc2", "gdpr", "hipaa", "iso 27001", "compliance", "certification", "audit"],
            "incident_response": ["incident", "breach", "notification", "response"],
            "data_handling": ["data retention", "backup", "deletion", "processing", "dpa"],
            "logging": ["log", "audit trail", "monitoring"],
            "network": ["network", "firewall", "vpc", "segmentation"],
        }
        
        category = "other"
        for cat, keywords in category_keywords.items():
            if any(kw in question_lower for kw in keywords):
                category = cat
                break
        
        # Simple fingerprint from question
        fingerprint = "_".join(question_lower.split()[:5]).replace("?", "").replace("'", "")
        
        return {
            "fingerprint": fingerprint,
            "category": category,
            "intent": question
        }
    
    def _check_qa_library(self, fingerprint: str, question: str) -> Optional[dict]:
        """Check if we have a verified answer for this question."""
        qa_collection = self.db["qa_library"]
        
        # First try exact fingerprint match
        exact_match = qa_collection.find_one({"question_fingerprint": fingerprint})
        if exact_match:
            return exact_match
        
        # Try semantic similarity
        try:
            query_embedding = self.voyage.embed(
                [question], model=VOYAGE_MODEL, input_type="query"
            ).embeddings[0]
            
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
                        "question_fingerprint": 1, "question_text": 1,
                        "answer": 1, "evidence_source": 1, "confidence": 1,
                        "last_verified": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            
            results = list(qa_collection.aggregate(pipeline))
            if results and results[0].get("score", 0) > 0.85:
                return results[0]
        except Exception as e:
            print(f"   (QA library search error: {e})")
        
        return None
    
    def _vector_search(self, question: str, limit: int = 5) -> List[Evidence]:
        """Search document chunks for relevant evidence."""
        query_embedding = self.voyage.embed(
            [question], model=VOYAGE_MODEL, input_type="query"
        ).embeddings[0]
        
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
                    "text": 1, "section": 1, "doc_id": 1, "doc_type": 1,
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
    
    def learn_from_feedback(self, question: str, approved_answer: str, evidence_source: str) -> str:
        """Store approved answer in QA library for future reuse."""
        normalized = self._normalize_question(question)
        
        embedding = self.voyage.embed(
            [question], model=VOYAGE_MODEL, input_type="query"
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
            {"_id": qa_record["_id"]}, qa_record, upsert=True
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
