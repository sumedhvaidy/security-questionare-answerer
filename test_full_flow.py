"""
Full flow test: Citation Agent → Drafting Agent → Clean JSON output
Demonstrates both LLM calls and packages results clearly.
"""
import requests
import json

API_URL = "https://api.fireworks.ai/inference/v1/chat/completions"
API_KEY = "fw_9uVgLprHZxyLmY2f8K63xx"
MODEL = "accounts/fireworks/models/deepseek-v3p2"

HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

# ============== DUMMY COMPANY DATA ==============
COMPANY_NAME = "SecureCloud Inc."

CONTEXT_DOCUMENTS = [
    {
        "doc_id": "DOC-001",
        "title": "SecureCloud Data Protection Policy",
        "content": """SecureCloud Inc. implements comprehensive data protection measures:
- All customer data is encrypted using AES-256 encryption at rest
- TLS 1.3 is enforced for all data in transit
- Encryption keys are stored in AWS KMS with automatic rotation every 90 days
- Database backups are encrypted and stored in geographically separate regions
- PII data is additionally protected with field-level encryption"""
    },
    {
        "doc_id": "DOC-002", 
        "title": "SecureCloud Access Control Standards",
        "content": """SecureCloud Inc. maintains strict access control:
- Role-Based Access Control (RBAC) is implemented across all systems
- Multi-factor authentication (MFA) is mandatory for all employees
- Privileged access requires manager approval and is reviewed quarterly
- All access is logged and monitored via Splunk SIEM
- Service accounts use rotating credentials with 24-hour expiry
- Zero-trust architecture with network segmentation"""
    },
    {
        "doc_id": "DOC-003",
        "title": "SecureCloud Compliance Certifications",
        "content": """SecureCloud Inc. maintains the following certifications:
- SOC 2 Type II (annual audit, last completed December 2025)
- ISO 27001:2022 certified since 2023
- GDPR compliant for EU data processing
- HIPAA compliant with BAA available
- Annual penetration testing by NCC Group
- Quarterly vulnerability assessments"""
    }
]

# Test question
TEST_QUESTION = {
    "question_id": "Q-001",
    "question_text": "How does your organization protect customer data at rest?",
    "category": "Data Security"
}


def call_fireworks(messages: list, temperature: float = 0.4) -> dict:
    """Make a call to Fireworks AI."""
    payload = {
        "model": MODEL,
        "max_tokens": 2048,
        "temperature": temperature,
        "messages": messages
    }
    response = requests.post(API_URL, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.json()


def extract_json(content: str) -> dict:
    """Extract JSON from response, handling markdown code blocks."""
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    return json.loads(content.strip())


def run_citation_agent(question: dict, context_docs: list) -> dict:
    """
    CALL 1: Citation Agent - Find relevant citations from context.
    """
    context_text = "\n\n".join([
        f"[{doc['doc_id']}] {doc['title']}\n{doc['content']}" 
        for doc in context_docs
    ])
    
    system_prompt = """You are a Citation Agent. Find relevant citations from the provided documents to answer security questions.

Return JSON format:
{
    "citations": [
        {
            "doc_id": "document id",
            "doc_title": "document title", 
            "relevant_excerpt": "exact relevant quote from document",
            "relevance_score": 0.0-1.0
        }
    ]
}

Only include citations that directly help answer the question. Be specific with excerpts."""

    user_prompt = f"""QUESTION: {question['question_text']}

CONTEXT DOCUMENTS:
{context_text}

Find all relevant citations for this question. Return JSON only."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    print("📚 CALL 1: Citation Agent...")
    response = call_fireworks(messages, temperature=0.3)
    content = response["choices"][0]["message"]["content"]
    
    return extract_json(content)


def run_drafting_agent(question: dict, citations: list) -> dict:
    """
    CALL 2: Drafting Agent - Generate answer with confidence score.
    """
    citations_text = "\n".join([
        f"- [{c['doc_id']}] {c['doc_title']}: \"{c['relevant_excerpt']}\" (relevance: {c['relevance_score']})"
        for c in citations
    ]) if citations else "No citations available."
    
    system_prompt = """You are a Drafting Agent for security questionnaires. Generate professional answers based on citations.

Return JSON format:
{
    "answer": "your complete answer",
    "confidence": "high" | "medium" | "low",
    "confidence_score": 0.0-1.0,
    "reasoning": "brief explanation of confidence level"
}

Confidence guidelines:
- HIGH (0.8-1.0): Direct, comprehensive evidence in citations
- MEDIUM (0.5-0.79): Partial evidence, some inference needed  
- LOW (0.0-0.49): Weak evidence or significant gaps"""

    user_prompt = f"""QUESTION: {question['question_text']}

AVAILABLE CITATIONS:
{citations_text}

Generate a professional answer based on these citations. Return JSON only."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    print("✍️  CALL 2: Drafting Agent...")
    response = call_fireworks(messages, temperature=0.4)
    content = response["choices"][0]["message"]["content"]
    
    return extract_json(content)


def main():
    print("=" * 60)
    print(f"🏢 Company: {COMPANY_NAME}")
    print(f"❓ Question: {TEST_QUESTION['question_text']}")
    print("=" * 60)
    
    # CALL 1: Get citations
    citation_result = run_citation_agent(TEST_QUESTION, CONTEXT_DOCUMENTS)
    citations = citation_result.get("citations", [])
    print(f"   Found {len(citations)} citation(s)")
    
    # CALL 2: Generate answer
    draft_result = run_drafting_agent(TEST_QUESTION, citations)
    print(f"   Confidence: {draft_result['confidence']} ({draft_result['confidence_score']})")
    
    # Package final result
    final_output = {
        "company": COMPANY_NAME,
        "question": {
            "id": TEST_QUESTION["question_id"],
            "text": TEST_QUESTION["question_text"],
            "category": TEST_QUESTION["category"]
        },
        "answer": draft_result["answer"],
        "confidence": {
            "level": draft_result["confidence"],
            "score": draft_result["confidence_score"],
            "reasoning": draft_result.get("reasoning", "")
        },
        "citations": [
            {
                "document_id": c["doc_id"],
                "document_title": c["doc_title"],
                "excerpt": c["relevant_excerpt"],
                "relevance_score": c["relevance_score"]
            }
            for c in citations
        ]
    }
    
    # Save to file
    with open("test_response.json", "w") as f:
        json.dump(final_output, f, indent=2)
    
    print("\n" + "=" * 60)
    print("📄 FINAL OUTPUT (saved to test_response.json):")
    print("=" * 60)
    print(json.dumps(final_output, indent=2))


if __name__ == "__main__":
    main()
