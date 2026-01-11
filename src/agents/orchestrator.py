"""
Questionnaire Orchestrator - Stitches all agents together in the pipeline.

Pipeline Flow:
1. Parse questionnaire input (questions + context documents)
2. For each question batch:
   a. Knowledge Agent: Check QA library → Vector search → Answerability check
   b. If needs more context: Citation Agent finds relevant citations
   c. Drafting Agent: Generate final answer with confidence
   d. Escalation Agent: Route low-confidence answers to humans
3. Return structured output with all answers, citations, and escalations
"""

import math
from typing import List, Optional
from dataclasses import dataclass

from src.core.config import settings
from src.models.common import Question, ContextDocument, Citation, ConfidenceLevel
from src.models.api import (
    QuestionnaireInput,
    QuestionnaireOutput,
    QuestionAnswer,
    BatchResult,
    EscalationResponse,
)
from src.agents.knowledge_agent import KnowledgeAgent
from src.agents.citation_agent import CitationAgent
from src.agents.drafting_agent import DraftingAgent
from src.agents.escalation_agent import EscalationAgent


@dataclass
class OrchestratorConfig:
    """Configuration for the orchestrator."""
    batch_size: int = 5
    confidence_threshold: float = 0.5  # Below 50% = needs escalation, 50-70% = review
    use_knowledge_agent: bool = True  # Use MongoDB vector search
    use_citation_agent: bool = True   # Use RAG context documents
    run_escalation: bool = True       # Route to humans


class QuestionnaireOrchestrator:
    """
    Orchestrates the multi-agent pipeline for answering security questionnaires.
    
    This is the main entry point that coordinates:
    - KnowledgeAgent (Engineer 1): MongoDB + Vector search + QA library
    - CitationAgent (Engineer 2): RAG context citations
    - DraftingAgent (Engineer 2): Answer generation with confidence
    - EscalationAgent (Engineer 3): Human routing for low confidence
    """
    
    def __init__(self, config: Optional[OrchestratorConfig] = None):
        self.config = config or OrchestratorConfig()
        
        # Initialize agents
        if self.config.use_knowledge_agent:
            self.knowledge_agent = KnowledgeAgent()
        else:
            self.knowledge_agent = None
        
        self.citation_agent = CitationAgent()
        self.drafting_agent = DraftingAgent()
        
        if self.config.run_escalation:
            self.escalation_agent = EscalationAgent(
                confidence_threshold=self.config.confidence_threshold
            )
        else:
            self.escalation_agent = None
    
    async def process_questionnaire(
        self,
        input_data: QuestionnaireInput,
        verbose: bool = False
    ) -> QuestionnaireOutput:
        """
        Process a complete security questionnaire.
        
        Args:
            input_data: QuestionnaireInput with context documents and questions
            verbose: Whether to print progress
            
        Returns:
            QuestionnaireOutput with all answers, citations, and escalation info
        """
        questions = input_data.questions
        context_docs = input_data.context_documents
        
        total_questions = len(questions)
        batch_size = self.config.batch_size
        total_batches = math.ceil(total_questions / batch_size)
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"🚀 QUESTIONNAIRE ORCHESTRATOR")
            print(f"{'='*60}")
            print(f"Request ID: {input_data.request_id}")
            print(f"Questions: {total_questions}")
            print(f"Context Documents: {len(context_docs)}")
            print(f"Batches: {total_batches}")
            print()
        
        all_batches: List[BatchResult] = []
        total_escalations = 0
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, total_questions)
            batch_questions = questions[start_idx:end_idx]
            
            if verbose:
                print(f"\n--- Batch {batch_num + 1}/{total_batches} ---")
            
            batch_answers = await self._process_batch(
                batch_questions, context_docs, verbose
            )
            
            all_batches.append(BatchResult(
                batch_number=batch_num + 1,
                answers=batch_answers
            ))
            
            # Count escalations
            total_escalations += sum(1 for a in batch_answers if a.needs_escalation)
        
        output = QuestionnaireOutput(
            request_id=input_data.request_id,
            total_questions=total_questions,
            total_batches=total_batches,
            batches=all_batches,
            escalations_required=total_escalations,
            status="completed"
        )
        
        if verbose:
            print(f"\n{'='*60}")
            print(f"✅ PROCESSING COMPLETE")
            print(f"{'='*60}")
            print(f"Total Questions: {total_questions}")
            print(f"Escalations Required: {total_escalations}")
            print()
        
        return output
    
    async def _process_batch(
        self,
        questions: List[Question],
        context_docs: List[ContextDocument],
        verbose: bool
    ) -> List[QuestionAnswer]:
        """Process a batch of questions through the agent pipeline."""
        answers: List[QuestionAnswer] = []
        
        for question in questions:
            if verbose:
                print(f"\n  Processing: {question.question_text[:50]}...")
            
            # Step 1: Knowledge Agent retrieves relevant evidence (if enabled)
            knowledge_result = None
            if self.knowledge_agent:
                try:
                    knowledge_result = self.knowledge_agent.retrieve(
                        question.question_text, 
                        verbose=False
                    )
                    
                    if verbose:
                        source = knowledge_result.get("source", "unknown")
                        docs = knowledge_result.get("context_documents", [])
                        avg_sim = sum(d.get("metadata", {}).get("similarity_score", 0) for d in docs) / max(len(docs), 1)
                        print(f"    KnowledgeAgent: {source} (avg similarity: {avg_sim:.2f}, {len(docs)} docs)")
                except Exception as e:
                    if verbose:
                        print(f"    KnowledgeAgent error: {e}")
                    knowledge_result = None
            
            # Step 2: Citation + Drafting agents process the question
            # Use documents from Knowledge Agent if available, else fall back to input context_docs
            if verbose:
                print(f"    Using Citation+Drafting agents...")
            
            # Convert Knowledge Agent docs to ContextDocument objects
            docs_for_citation = context_docs  # default fallback
            if knowledge_result and knowledge_result.get("context_documents"):
                docs_for_citation = [
                    ContextDocument(
                        doc_id=doc.get("doc_id", f"doc_{i}"),
                        title=doc.get("title", "Unknown"),
                        content=doc.get("content", ""),
                        source=doc.get("source", "knowledge_base"),
                        metadata=doc.get("metadata", {})
                    )
                    for i, doc in enumerate(knowledge_result["context_documents"])
                ]
            
            # Citation Agent: Find relevant citations from retrieved docs
            citation_result = await self.citation_agent.find_citations(
                question, docs_for_citation
            )
            
            # Drafting Agent: Generate answer based on citations
            draft_result = await self.drafting_agent.draft_answer(
                question, citation_result
            )
            
            # Determine if escalation needed based on Drafting Agent confidence
            # <50% = needs escalation, 50-70% = needs review (handled in frontend)
            needs_escalation = draft_result.confidence_score < self.config.confidence_threshold
            escalation_reason = None
            
            if needs_escalation:
                confidence_pct = int(draft_result.confidence_score * 100)
                if draft_result.confidence_score < 0.3:
                    escalation_reason = f"Very low confidence ({confidence_pct}%) - insufficient documentation found"
                elif draft_result.confidence_score < 0.5:
                    escalation_reason = f"Low confidence ({confidence_pct}%) - requires human verification"
                else:
                    escalation_reason = f"Medium confidence ({confidence_pct}%) - may need additional review"
            
            answer = QuestionAnswer(
                question_id=question.question_id,
                question_text=question.question_text,
                answer=draft_result.answer,
                confidence=draft_result.confidence,
                confidence_score=draft_result.confidence_score,
                citations=citation_result.citations,
                reasoning=draft_result.reasoning,
                needs_escalation=needs_escalation,
                escalation_reason=escalation_reason,
                category=question.category
            )
            
            answers.append(answer)
            
            if verbose:
                status = "⚠️ ESCALATE" if needs_escalation else "✅ OK"
                print(f"    Result: {status} (confidence: {draft_result.confidence_score:.2f})")
        
        return answers
    
    def _convert_knowledge_evidence_to_context(
        self, 
        evidence: List[dict]
    ) -> str:
        """Convert KnowledgeAgent evidence to context string for Citation Agent."""
        if not evidence:
            return ""
        
        context_parts = []
        for e in evidence:
            text = e.get("text", "")
            source = e.get("source_document", "unknown")
            similarity = e.get("similarity_score", 0)
            context_parts.append(f"[Source: {source}, Similarity: {similarity:.2f}]\n{text}")
        
        return "\n\n".join(context_parts)
    
    async def process_with_escalation(
        self,
        input_data: QuestionnaireInput,
        verbose: bool = False
    ) -> tuple[QuestionnaireOutput, Optional[EscalationResponse]]:
        """
        Process questionnaire and also run escalation routing.
        
        Returns both the questionnaire output and escalation response.
        """
        # First process the questionnaire
        output = await self.process_questionnaire(input_data, verbose)
        
        # Then run escalation agent if enabled and there are escalations
        escalation_response = None
        if self.escalation_agent and output.escalations_required > 0:
            if verbose:
                print(f"\n🚨 Running escalation routing for {output.escalations_required} questions...")
            
            escalation_response = await self.escalation_agent.process_answers(
                request_id=output.request_id,
                batches=output.batches
            )
            
            if verbose:
                for result in escalation_response.results:
                    if result.requires_escalation:
                        routed = result.routed_to
                        if routed:
                            print(f"   → {result.question_text[:40]}... → {routed['name']} ({routed['department']})")
                        else:
                            print(f"   → {result.question_text[:40]}... → [No employee found]")
        
        return output, escalation_response


# ============================================================================
# Convenience Functions
# ============================================================================

async def process_questionnaire(
    request_id: str,
    questions: List[dict],
    context_documents: List[dict],
    verbose: bool = False
) -> QuestionnaireOutput:
    """
    Convenience function to process a questionnaire from raw dicts.
    
    Args:
        request_id: Unique request identifier
        questions: List of question dicts with question_id, question_text, category
        context_documents: List of document dicts with doc_id, title, content, source
        verbose: Whether to print progress
        
    Returns:
        QuestionnaireOutput with all answers
    """
    input_data = QuestionnaireInput(
        request_id=request_id,
        context_documents=[ContextDocument(**d) for d in context_documents],
        questions=[Question(**q) for q in questions]
    )
    
    orchestrator = QuestionnaireOrchestrator()
    return await orchestrator.process_questionnaire(input_data, verbose)

