"""
Example usage of Escalation Agent with Citation Request format
"""
import asyncio
import os
import json
from dotenv import load_dotenv
from database import db
from agents.escalation_agent import EscalationAgent
from models.request_for_escalation_agent import EscalationRequest

# Load environment variables from .env file
load_dotenv()


async def main():
    # Initialize MongoDB connection
    mongodb_uri = os.getenv("MONGODB_URI")
    db_name = "Employees"  # Use Employees database as specified
    
    if not mongodb_uri:
        print("Error: MONGODB_URI environment variable not set")
        print("Please set MONGODB_URI in your .env file or environment")
        return
    
    print(f"Connecting to MongoDB database: {db_name}")
    await db.connect(mongodb_uri, db_name)
    
    # Initialize Escalation Agent with Firework AI key
    firework_key = os.getenv("FIREWORKS_API_KEY")
    
    if not firework_key:
        print("Error: FIREWORKS_API_KEY environment variable not set")
        print("Please set FIREWORKS_API_KEY in your .env file or environment")
        await db.disconnect()
        return
    
    escalation_agent = EscalationAgent(
        firework_api_key=firework_key,
        confidence_threshold=0.7
    )
    
    # Load the citation request from test file (or create it programmatically)
    # Modify one question to have low confidence to test escalation
    try:
        with open("test_escalation_agent_json_request", "r") as f:
            request_data = json.load(f)
            # Modify Q-002 to have low confidence for testing escalation
            if "batches" in request_data and len(request_data["batches"]) > 0:
                if "answers" in request_data["batches"][0]:
                    for answer in request_data["batches"][0]["answers"]:
                        if answer.get("question_id") == "Q-002":
                            answer["confidence"] = "low"
                            answer["confidence_score"] = 0.45  # Below threshold to test escalation
                            answer["citations"] = []  # Remove citations for low confidence
                            answer["reasoning"] = "Incomplete answer - lacks specific details about implementation"
            escalation_request = EscalationRequest(**request_data)
            print("✅ Loaded request from test_escalation_agent_json_request (modified Q-002 for escalation test)")
    except FileNotFoundError:
        # Create example request programmatically
        from models.request_for_escalation_agent import Batch, AnswerItem, Citation
        
        escalation_request = EscalationRequest(
            request_id="req-fastapi-001",
            total_questions=3,
            total_batches=1,
            batches=[
                Batch(
                    batch_number=1,
                    answers=[
                        AnswerItem(
                            question_id="Q-001",
                            question_text="How is customer data encrypted at rest?",
                            answer="Customer data at rest is encrypted using AES-256 encryption.",
                            confidence="high",
                            confidence_score=0.95,
                            citations=[
                                Citation(
                                    doc_id="DOC-001",
                                    doc_title="SecureCloud Data Protection Policy",
                                    relevant_excerpt="All customer data encrypted using AES-256 at rest",
                                    relevance_score=1.0
                                )
                            ],
                            reasoning="Citation directly addresses encryption at rest."
                        ),
                        AnswerItem(
                            question_id="Q-002",
                            question_text="What access control mechanisms are in place?",
                            answer="We use RBAC and MFA. This provides basic access control for our systems.",
                            confidence="low",
                            confidence_score=0.45,  # Low confidence - will trigger escalation
                            citations=[],
                            reasoning="Basic answer provided without comprehensive details. Lacks specific information about implementation details, monitoring, or audit trails."
                        ),
                        AnswerItem(
                            question_id="Q-003",
                            question_text="What compliance certifications do you hold?",
                            answer="We have SOC 2 Type II and ISO 27001.",
                            confidence="high",
                            confidence_score=0.90,
                            citations=[
                                Citation(
                                    doc_id="DOC-003",
                                    doc_title="SecureCloud Compliance",
                                    relevant_excerpt="SOC 2 Type II and ISO 27001 certified",
                                    relevance_score=1.0
                                )
                            ],
                            reasoning="Citation confirms compliance certifications."
                        )
                    ]
                )
            ],
            status="completed"
        )
    
    # Process the escalation request
    print("Processing escalation request from citation agentic AI...")
    print(f"Request ID: {escalation_request.request_id}")
    print(f"Total Questions: {escalation_request.total_questions}")
    print(f"Total Batches: {escalation_request.total_batches}\n")
    
    result = await escalation_agent.process_batch(escalation_request)
    
    # Display results
    print("=" * 80)
    print("ESCALATION RESULTS")
    print("=" * 80)
    print(f"Request ID: {result.request_id}")
    print(f"Total Questions: {result.total_questions}")
    print(f"Escalations Required: {result.escalations_required}")
    print(f"Status: {result.status}\n")
    
    print("-" * 80)
    for i, res in enumerate(result.results, 1):
        print(f"\n{i}. Question ID: {res.question_id}")
        print(f"   Question: {res.question_text[:60]}...")
        print(f"   Confidence: {res.confidence} ({res.confidence_score:.2f})")
        print(f"   Category: {res.category or 'Unknown'}")
        print(f"   Requires Escalation: {'✅ YES' if res.requires_escalation else '❌ NO'}")
        
        if res.requires_escalation:
            print(f"   Escalation Reason: {res.escalation_reason}")
            if res.routed_to:
                print(f"   Routed to: {res.routed_to['name']} ({res.routed_to['email']})")
                print(f"   Department: {res.routed_to['department']}")
            else:
                print(f"   ⚠️  Could not find appropriate employee to route to")
        
        if res.citations:
            print(f"   Citations: {len(res.citations)} citation(s)")
            for j, citation in enumerate(res.citations[:2], 1):  # Show first 2
                print(f"     {j}. {citation.doc_title} (relevance: {citation.relevance_score:.2f})")
        
        print("-" * 80)
    
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
