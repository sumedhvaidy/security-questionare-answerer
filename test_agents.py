#!/usr/bin/env python3
"""
Test the agents directly without running the API server.

Usage:
    python test_agents.py                    # Test all agents
    python test_agents.py --knowledge        # Test Knowledge Agent only
    python test_agents.py --citation         # Test Citation + Drafting only
    python test_agents.py --orchestrator     # Test full pipeline
"""
import asyncio
import argparse
from dotenv import load_dotenv

load_dotenv()

# Sample test data
SAMPLE_CONTEXT_DOCS = [
    {
        "doc_id": "doc-001",
        "title": "Data Encryption Policy",
        "content": """Our organization implements AES-256 encryption for all data at rest. 
All databases are encrypted using industry-standard encryption protocols. 
Encryption keys are rotated every 90 days and stored in a Hardware Security Module (HSM).
Data in transit is protected using TLS 1.3 for all API communications.""",
        "source": "policy",
    },
    {
        "doc_id": "doc-002",
        "title": "Access Control Framework",
        "content": """We implement Role-Based Access Control (RBAC) across all systems.
All user access requires multi-factor authentication (MFA).
Privileged access is granted on a need-to-know basis and reviewed quarterly.
Access logs are maintained for 12 months and monitored in real-time.""",
        "source": "policy",
    },
    {
        "doc_id": "doc-003",
        "title": "SOC 2 Type II Report",
        "content": """DataFlow Systems completed SOC 2 Type II certification in November 2024.
The audit covered Security, Availability, and Confidentiality trust service criteria.
No exceptions were noted during the audit period.
Annual penetration testing is performed by certified third-party auditors.""",
        "source": "soc2",
    },
]

SAMPLE_QUESTIONS = [
    {"question_id": "q-001", "question_text": "Is customer data encrypted at rest?", "category": "encryption"},
    {"question_id": "q-002", "question_text": "Do you require MFA for all users?", "category": "authentication"},
    {"question_id": "q-003", "question_text": "Do you have SOC 2 certification?", "category": "compliance"},
    {"question_id": "q-004", "question_text": "Can you sign our custom DPA?", "category": "compliance"},
]


async def test_knowledge_agent():
    """Test the Knowledge Agent (requires MongoDB)."""
    print("\n" + "="*60)
    print("🧠 TESTING KNOWLEDGE AGENT (Retrieval)")
    print("="*60)
    
    try:
        from src.agents.knowledge_agent import KnowledgeAgent
        import json
        
        agent = KnowledgeAgent()
        
        # Show stats
        stats = agent.get_stats()
        print(f"\n📊 Knowledge Base Stats:")
        print(f"   QA Library: {stats['qa_library_count']} verified answers")
        print(f"   Documents: {stats['documents_count']} documents")
        print(f"   Chunks: {stats['chunks_count']} searchable chunks")
        
        # Test retrieval
        print("\n🔍 Testing: 'Is customer data encrypted at rest?'")
        result = agent.retrieve("Is customer data encrypted at rest?", verbose=True)
        
        print("\n📋 RETRIEVED DATA (for Citation Agent):")
        print(f"   Question ID: {result['question_id']}")
        print(f"   Category: {result['category']}")
        print(f"   Source: {result['source']}")
        print(f"   Context Documents: {len(result['context_documents'])}")
        
        if result['verified_answer']:
            print(f"\n   ✅ Verified Answer Found:")
            print(f"      {result['verified_answer'][:150]}...")
        else:
            print(f"\n   📚 Top Evidence Chunks:")
            for i, doc in enumerate(result['context_documents'][:3], 1):
                print(f"      [{i}] {doc['title']} (score: {doc['metadata']['similarity_score']:.3f})")
                print(f"          {doc['content'][:100]}...")
        
        # Show JSON structure (full output for Citation Agent)
        print("\n📄 JSON Output Structure (passed to Citation Agent):")
        # Create a condensed view showing document structure
        condensed_docs = []
        for doc in result['context_documents'][:3]:  # Show first 3
            condensed_docs.append({
                "title": doc['title'],
                "section": doc.get('metadata', {}).get('section', 'N/A'),
                "similarity_score": doc.get('metadata', {}).get('similarity_score', 0),
                "content_preview": doc['content'][:200] + "..."
            })
        
        output = {
            "question": result['question'],
            "question_id": result['question_id'],
            "category": result['category'],
            "source": result['source'],
            "verified_answer": result['verified_answer'],
            "context_documents_count": len(result['context_documents']),
            "context_documents_sample": condensed_docs
        }
        print(json.dumps(output, indent=2))
        
        return True
        
    except Exception as e:
        print(f"\n❌ Knowledge Agent Error: {e}")
        print("   (Make sure MONGODB_URI and VOYAGE_API_KEY are set)")
        import traceback
        traceback.print_exc()
        return False


async def test_full_pipeline():
    """Test the full pipeline: Knowledge → Citation → Drafting."""
    print("\n" + "="*60)
    print("🔗 TESTING FULL PIPELINE (Knowledge → Citation → Drafting)")
    print("="*60)
    
    try:
        from src.agents.knowledge_agent import KnowledgeAgent
        from src.agents.citation_agent import CitationAgent
        from src.agents.drafting_agent import DraftingAgent
        from src.models.common import Question, ContextDocument
        import json
        
        # Initialize all agents
        print("\n📦 Initializing agents...")
        knowledge_agent = KnowledgeAgent()
        citation_agent = CitationAgent()
        drafting_agent = DraftingAgent()
        print("   ✅ All agents initialized")
        
        # Test questions
        test_questions = [
            "Is customer data encrypted at rest?",
            "Do you require MFA for all users?",
            "Can you sign our custom DPA?"
        ]
        
        for question_text in test_questions:
            print(f"\n{'─'*60}")
            print(f"❓ Question: {question_text}")
            print(f"{'─'*60}")
            
            # Step 1: Knowledge Agent retrieves evidence
            print("\n🧠 Step 1: Knowledge Agent (Retrieval)")
            knowledge_result = knowledge_agent.retrieve(question_text, verbose=False)
            print(f"   Source: {knowledge_result['source']}")
            print(f"   Documents found: {len(knowledge_result['context_documents'])}")
            
            if knowledge_result['verified_answer']:
                print(f"   ✅ Found verified answer in QA library!")
                print(f"   Answer: {knowledge_result['verified_answer'][:150]}...")
                continue  # Skip Citation/Drafting for verified answers
            
            # Convert Knowledge Agent output to ContextDocument format for Citation Agent
            context_docs = []
            for doc in knowledge_result['context_documents']:
                context_docs.append(ContextDocument(
                    doc_id=doc['doc_id'],
                    title=doc['title'],
                    content=doc['content'],
                    source=doc.get('source', 'mongodb'),
                    metadata=doc.get('metadata')
                ))
            
            # Step 2: Citation Agent extracts relevant citations
            print("\n📑 Step 2: Citation Agent (Extract Citations)")
            question = Question(
                question_id=knowledge_result['question_id'],
                question_text=question_text,
                category=knowledge_result['category']
            )
            citation_result = await citation_agent.find_citations(question, context_docs)
            print(f"   Citations found: {len(citation_result.citations)}")
            for i, c in enumerate(citation_result.citations[:3], 1):
                print(f"      [{i}] {c.doc_title} (relevance: {c.relevance_score:.2f})")
                print(f"          \"{c.relevant_excerpt[:80]}...\"")
            
            # Step 3: Drafting Agent generates the answer
            print("\n✍️  Step 3: Drafting Agent (Generate Answer)")
            draft_result = await drafting_agent.draft_answer(question, citation_result)
            
            print(f"\n   {'='*50}")
            print(f"   📋 FINAL ANSWER")
            print(f"   {'='*50}")
            print(f"   Answer: {draft_result.answer}")
            print(f"   Confidence: {draft_result.confidence.value} ({draft_result.confidence_score:.2f})")
            print(f"   Reasoning: {draft_result.reasoning}")
            
            # Show if escalation needed
            if draft_result.confidence_score < 0.7:
                print(f"\n   ⚠️  LOW CONFIDENCE - Would trigger escalation")
            elif draft_result.confidence_score < 0.8:
                print(f"\n   ⚡ MEDIUM CONFIDENCE - May need review")
            else:
                print(f"\n   ✅ HIGH CONFIDENCE - No escalation needed")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Pipeline Error: {e}")
        print("   (Make sure all API keys are set: MONGODB_URI, VOYAGE_API_KEY, FIREWORKS_API_KEY)")
        import traceback
        traceback.print_exc()
        return False


async def test_escalation():
    """Test the Escalation Agent with sample answers."""
    print("\n" + "="*60)
    print("🚨 TESTING ESCALATION AGENT")
    print("="*60)
    
    try:
        from src.agents.escalation_agent import EscalationAgent
        from src.models.common import Citation, ConfidenceLevel
        from src.models.api import QuestionAnswer, BatchResult
        from src.core.database import db
        import os
        
        # Connect to MongoDB for employee routing
        mongodb_uri = os.getenv("MONGODB_URI")
        if mongodb_uri:
            print("\n🔌 Connecting to MongoDB...")
            await db.connect(mongodb_uri, db_name="Employees")
        else:
            print("\n⚠️  MONGODB_URI not set - employee routing will use placeholder")
        
        escalation_agent = EscalationAgent(confidence_threshold=0.7)
        print(f"📦 Escalation Agent initialized (threshold: 0.7)")
        
        # Create sample answers with varying confidence levels
        sample_answers = [
            QuestionAnswer(
                question_id="q-001",
                question_text="Is customer data encrypted at rest?",
                answer="Yes, all data is encrypted using AES-256.",
                confidence=ConfidenceLevel.HIGH,
                confidence_score=0.95,
                citations=[
                    Citation(
                        doc_id="enc-policy",
                        doc_title="Encryption Key Management Policy",
                        relevant_excerpt="All sensitive data must be encrypted using AES-256",
                        relevance_score=1.0
                    )
                ],
                reasoning="Strong evidence from policy documents",
                needs_escalation=False,
                category="encryption"
            ),
            QuestionAnswer(
                question_id="q-002",
                question_text="Do you require MFA for all users?",
                answer="Yes, MFA is required for all system access.",
                confidence=ConfidenceLevel.MEDIUM,
                confidence_score=0.70,
                citations=[
                    Citation(
                        doc_id="sec-policy",
                        doc_title="Information Security Policy",
                        relevant_excerpt="MFA is mandatory for all system access",
                        relevance_score=0.9
                    )
                ],
                reasoning="Good evidence but minor coverage gap",
                needs_escalation=False,
                category="authentication"
            ),
            QuestionAnswer(
                question_id="q-003",
                question_text="Can you sign our custom DPA?",
                answer="Unable to provide a definitive answer.",
                confidence=ConfidenceLevel.LOW,
                confidence_score=0.20,
                citations=[],
                reasoning="No relevant documentation found",
                needs_escalation=True,
                escalation_reason="No evidence for legal/contractual question",
                category="compliance"
            ),
        ]
        
        # Create batch result
        batch = BatchResult(batch_number=1, answers=sample_answers)
        
        print(f"\n📋 Processing {len(sample_answers)} answers...")
        for ans in sample_answers:
            status = "⚠️" if ans.needs_escalation or ans.confidence_score < 0.7 else "✅"
            print(f"   {status} [{ans.confidence_score:.0%}] {ans.question_text[:40]}...")
        
        # Process with escalation agent
        print("\n🔄 Running Escalation Agent...")
        result = await escalation_agent.process_answers(
            request_id="test-escalation-001",
            batches=[batch]
        )
        
        print(f"\n{'='*60}")
        print("📊 ESCALATION RESULTS")
        print(f"{'='*60}")
        print(f"Total Questions: {result.total_questions}")
        print(f"Escalations Required: {result.escalations_required}")
        
        print("\n📋 Individual Results:")
        for r in result.results:
            if r.requires_escalation:
                print(f"\n   🚨 ESCALATION NEEDED: {r.question_text[:40]}...")
                print(f"      Confidence: {r.confidence_score:.0%}")
                print(f"      Reason: {r.escalation_reason}")
                print(f"      Department: {r.department or 'N/A'}")
                if r.routed_to:
                    print(f"      Routed To: {r.routed_to.get('name', 'N/A')} ({r.routed_to.get('email', 'N/A')})")
                else:
                    print(f"      Routed To: No employee found in database")
            else:
                print(f"\n   ✅ NO ESCALATION: {r.question_text[:40]}...")
                print(f"      Confidence: {r.confidence_score:.0%}")
        
        # Disconnect from MongoDB
        if db.database is not None:
            await db.disconnect()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Escalation Error: {e}")
        print("   (Make sure FIREWORKS_API_KEY is set and MongoDB has employees)")
        import traceback
        traceback.print_exc()
        return False


async def test_citation_drafting():
    """Test Citation + Drafting agents (uses Fireworks AI)."""
    print("\n" + "="*60)
    print("📝 TESTING CITATION + DRAFTING AGENTS")
    print("="*60)
    
    try:
        from src.agents.citation_agent import CitationAgent
        from src.agents.drafting_agent import DraftingAgent
        from src.models.common import Question, ContextDocument
        
        citation_agent = CitationAgent()
        drafting_agent = DraftingAgent()
        
        # Convert sample data to models
        context_docs = [ContextDocument(**d) for d in SAMPLE_CONTEXT_DOCS]
        questions = [Question(**q) for q in SAMPLE_QUESTIONS[:2]]  # Test first 2
        
        print(f"\n📚 Context Documents: {len(context_docs)}")
        print(f"❓ Questions to process: {len(questions)}")
        
        for question in questions:
            print(f"\n--- Processing: {question.question_text} ---")
            
            # Step 1: Find citations
            print("   🔍 Finding citations...")
            citation_result = await citation_agent.find_citations(question, context_docs)
            print(f"   Found {len(citation_result.citations)} citations")
            
            for i, c in enumerate(citation_result.citations[:2], 1):
                print(f"      [{i}] {c.doc_title} (relevance: {c.relevance_score:.2f})")
            
            # Step 2: Draft answer
            print("   ✍️  Drafting answer...")
            draft_result = await drafting_agent.draft_answer(question, citation_result)
            
            print(f"\n   📋 RESULT:")
            print(f"      Answer: {draft_result.answer[:150]}...")
            print(f"      Confidence: {draft_result.confidence.value} ({draft_result.confidence_score:.2f})")
            print(f"      Reasoning: {draft_result.reasoning}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Citation/Drafting Error: {e}")
        print("   (Make sure FIREWORKS_API_KEY is set)")
        import traceback
        traceback.print_exc()
        return False


async def test_orchestrator():
    """Test the full orchestrator pipeline."""
    print("\n" + "="*60)
    print("🎭 TESTING ORCHESTRATOR (FULL PIPELINE)")
    print("="*60)
    
    try:
        from src.agents.orchestrator import QuestionnaireOrchestrator, OrchestratorConfig
        from src.models.api import QuestionnaireInput
        from src.models.common import Question, ContextDocument
        
        # Create orchestrator (disable knowledge agent if no MongoDB)
        config = OrchestratorConfig(
            batch_size=5,
            confidence_threshold=0.7,
            use_knowledge_agent=False,  # Set to True if MongoDB is configured
            use_citation_agent=True,
            run_escalation=False  # Set to True if MongoDB is configured for employees
        )
        
        orchestrator = QuestionnaireOrchestrator(config)
        
        # Create input
        input_data = QuestionnaireInput(
            request_id="test-001",
            context_documents=[ContextDocument(**d) for d in SAMPLE_CONTEXT_DOCS],
            questions=[Question(**q) for q in SAMPLE_QUESTIONS]
        )
        
        print(f"\n📥 Input:")
        print(f"   Request ID: {input_data.request_id}")
        print(f"   Questions: {len(input_data.questions)}")
        print(f"   Context Docs: {len(input_data.context_documents)}")
        
        # Process
        print("\n🔄 Processing...")
        output = await orchestrator.process_questionnaire(input_data, verbose=True)
        
        print("\n" + "="*60)
        print("📤 OUTPUT SUMMARY")
        print("="*60)
        print(f"Request ID: {output.request_id}")
        print(f"Total Questions: {output.total_questions}")
        print(f"Total Batches: {output.total_batches}")
        print(f"Escalations Required: {output.escalations_required}")
        
        print("\n📋 Answers:")
        for batch in output.batches:
            for answer in batch.answers:
                status = "⚠️ ESCALATE" if answer.needs_escalation else "✅ OK"
                print(f"\n   {status} [{answer.confidence_score:.0%}] {answer.question_text[:40]}...")
                print(f"      → {answer.answer[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Orchestrator Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    parser = argparse.ArgumentParser(description="Test the agents")
    parser.add_argument("--knowledge", action="store_true", help="Test Knowledge Agent only (retrieval)")
    parser.add_argument("--citation", action="store_true", help="Test Citation + Drafting only (uses sample data)")
    parser.add_argument("--pipeline", action="store_true", help="Test full pipeline: Knowledge → Citation → Drafting")
    parser.add_argument("--escalation", action="store_true", help="Test Escalation Agent (routing)")
    parser.add_argument("--orchestrator", action="store_true", help="Test full orchestrator (batch processing)")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    
    args = parser.parse_args()
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║           Security Questionnaire - Agent Tester              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # If no specific flag, show options
    if not any([args.knowledge, args.citation, args.pipeline, args.escalation, args.orchestrator, args.all]):
        print("Available tests:")
        print("  --knowledge     Test Knowledge Agent only (retrieval from MongoDB)")
        print("  --citation      Test Citation + Drafting (uses sample data)")
        print("  --pipeline      Test full pipeline: Knowledge → Citation → Drafting ⭐")
        print("  --escalation    Test Escalation Agent (routing to employees)")
        print("  --orchestrator  Test full orchestrator (batch processing)")
        print("  --all           Run all tests")
        print("\nExample: python test_agents.py --pipeline\n")
        return
    
    if args.all or args.knowledge:
        await test_knowledge_agent()
    
    if args.all or args.pipeline:
        await test_full_pipeline()
    
    if args.all or args.escalation:
        await test_escalation()
    
    if args.all or args.citation:
        await test_citation_drafting()
    
    if args.all or args.orchestrator:
        await test_orchestrator()


if __name__ == "__main__":
    asyncio.run(main())

