#!/usr/bin/env python3
"""
Test script for the Knowledge Agent

Usage:
    python scripts/test_knowledge_agent.py
    python scripts/test_knowledge_agent.py --interactive
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from agents.knowledge_agent import (
    KnowledgeAgent, 
    AgentResponse,
    format_for_escalation_agent
)

load_dotenv()


def print_response(response: AgentResponse):
    """Pretty print the agent's response."""
    print()
    print("=" * 60)
    print("📋 AGENT RESPONSE")
    print("=" * 60)
    print()
    print(f"Question: {response.question}")
    print()
    print(f"Answer: {response.answer}")
    print()
    print(f"Confidence: {response.confidence:.0%}")
    print(f"Source: {response.source_type}")
    print(f"Category: {response.category or 'Unknown'}")
    print(f"Needs Escalation: {'⚠️ YES' if response.needs_escalation else '✅ NO'}")
    if response.escalation_reason:
        print(f"Escalation Reason: {response.escalation_reason}")
    print()
    print("Evidence Citations:")
    for i, e in enumerate(response.evidence[:3], 1):
        print(f"  [{i}] {e.doc_title}")
        if e.section:
            print(f"      Section: {e.section}")
        print(f"      Relevance: {e.similarity_score:.0%}")
        print(f"      Preview: {e.text[:100]}...")
    print()
    print(f"Agent Reasoning: {response.reasoning}")
    print()


def run_demo():
    """Interactive demo of the Knowledge Agent."""
    print("\n" + "=" * 60)
    print("🚀 KNOWLEDGE AGENT DEMO")
    print("=" * 60)
    print()
    print("This demo shows the Knowledge Agent's decision-making:")
    print("  1. Check QA Library (verified answers)")
    print("  2. Vector search (find evidence)")
    print("  3. Calculate confidence")
    print("  4. Decide: Answer or Escalate")
    print()
    
    # Check environment
    required_vars = ["MONGODB_URI", "VOYAGE_API_KEY", "ANTHROPIC_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("\nPlease set these in your .env file:")
        for v in missing:
            print(f"  {v}=your_value_here")
        return
    
    agent = KnowledgeAgent()
    
    # Show stats
    stats = agent.get_stats()
    print(f"📊 Knowledge Base Stats:")
    print(f"   QA Library: {stats['qa_library_count']} verified answers")
    print(f"   Documents: {stats['documents_count']} documents")
    print(f"   Chunks: {stats['chunks_count']} searchable chunks")
    print()
    
    # Demo questions
    demo_questions = [
        "Is customer data encrypted at rest?",
        "What encryption standards do you use for data at rest and in transit?",
        "How quickly do you notify customers of security incidents?",
        "What access control mechanisms do you have in place?",
        "Do you support customer-managed encryption keys (BYOK)?",
    ]
    
    print("Demo Questions:")
    for i, q in enumerate(demo_questions, 1):
        print(f"  {i}. {q}")
    print()
    
    choice = input("Enter question number (1-5) or type your own question: ").strip()
    
    if choice.isdigit() and 1 <= int(choice) <= len(demo_questions):
        question = demo_questions[int(choice) - 1]
    elif len(choice) > 10:
        question = choice
    else:
        question = demo_questions[0]
    
    response = agent.answer_question(question)
    print_response(response)
    
    # Show escalation format
    if response.needs_escalation:
        print("\n📤 This would be sent to the Escalation Agent:")
        escalation_data = format_for_escalation_agent([response])
        print(f"   Questions: {escalation_data['questions']}")
        print(f"   Confidence: {escalation_data['confidence_scores']}")
        print(f"   Categories: {escalation_data['categories']}")


def run_batch_test():
    """Test batch processing."""
    print("\n🔄 Testing Batch Processing...")
    
    agent = KnowledgeAgent()
    
    questions = [
        "Is data encrypted at rest?",
        "How do you handle security incidents?",
        "What certifications do you have?",
    ]
    
    responses = agent.answer_batch(questions, verbose=False)
    
    print(f"\nProcessed {len(responses)} questions:")
    for r in responses:
        status = "✅" if not r.needs_escalation else "⚠️"
        print(f"  {status} [{r.confidence:.0%}] {r.question[:50]}...")
    
    # Format for escalation agent
    print("\n📤 Format for Escalation Agent:")
    data = format_for_escalation_agent(responses)
    for i, (q, conf, cat) in enumerate(zip(
        data["questions"], 
        data["confidence_scores"], 
        data["categories"]
    )):
        print(f"  {i+1}. [{conf:.0%}] [{cat}] {q[:40]}...")


def run_interactive():
    """Interactive question-answering loop."""
    print("\n🤖 Interactive Knowledge Agent")
    print("Type 'quit' to exit, 'learn' to teach the agent\n")
    
    agent = KnowledgeAgent()
    
    while True:
        question = input("\n❓ Question: ").strip()
        
        if question.lower() == 'quit':
            break
        
        if question.lower() == 'learn':
            q = input("   Question to learn: ").strip()
            a = input("   Approved answer: ").strip()
            s = input("   Evidence source: ").strip()
            agent.learn_from_feedback(q, a, s)
            continue
        
        if len(question) < 5:
            print("   Please enter a valid question")
            continue
        
        response = agent.answer_question(question)
        print_response(response)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the Knowledge Agent")
    parser.add_argument(
        "--interactive", "-i",
        action="store_true",
        help="Run in interactive mode"
    )
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Run batch processing test"
    )
    
    args = parser.parse_args()
    
    if args.interactive:
        run_interactive()
    elif args.batch:
        run_batch_test()
    else:
        run_demo()

