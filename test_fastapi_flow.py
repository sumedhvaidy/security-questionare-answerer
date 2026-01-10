"""
Test the full FastAPI flow:
1. Start server
2. Send request to /process endpoint
3. Get response OR forward to callback URL

Run the server first:
    uvicorn app.main:app --reload --port 8000

Then run this test:
    python test_fastapi_flow.py
"""
import requests
import json

API_BASE = "http://localhost:8000"

# ============== TEST INPUT ==============
TEST_INPUT = {
    "request_id": "req-fastapi-001",
    "context_documents": [
        {
            "doc_id": "DOC-001",
            "title": "SecureCloud Data Protection Policy",
            "content": """SecureCloud Inc. implements comprehensive data protection:
- All customer data encrypted using AES-256 at rest
- TLS 1.3 for all data in transit
- Encryption keys in AWS KMS with 90-day rotation
- Database backups encrypted in separate regions
- Field-level encryption for PII data""",
            "source": "mongodb",
            "metadata": {"category": "security"}
        },
        {
            "doc_id": "DOC-002",
            "title": "SecureCloud Access Control Standards",
            "content": """Access control measures:
- Role-Based Access Control (RBAC) across all systems
- Multi-factor authentication (MFA) mandatory
- Privileged access requires manager approval
- All access logged and monitored via Splunk SIEM
- Zero-trust architecture implemented""",
            "source": "rag",
            "metadata": {"category": "access_control"}
        },
        {
            "doc_id": "DOC-003",
            "title": "SecureCloud Compliance",
            "content": """Certifications maintained:
- SOC 2 Type II (annual audit)
- ISO 27001:2022 certified
- GDPR compliant for EU data
- HIPAA compliant with BAA available
- Annual penetration testing by NCC Group""",
            "source": "mongodb",
            "metadata": {"category": "compliance"}
        }
    ],
    "questions": [
        {
            "question_id": "Q-001",
            "question_text": "How is customer data encrypted at rest?",
            "category": "data_security"
        },
        {
            "question_id": "Q-002",
            "question_text": "What access control mechanisms are in place?",
            "category": "access_control"
        },
        {
            "question_id": "Q-003",
            "question_text": "What compliance certifications do you hold?",
            "category": "compliance"
        }
    ]
}


def test_health():
    """Test health endpoint."""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200


def test_process_sync():
    """
    Test synchronous processing - waits for response.
    """
    print("\n" + "=" * 60)
    print("📤 Testing POST /process (synchronous)")
    print("=" * 60)
    
    response = requests.post(
        f"{API_BASE}/process",
        json=TEST_INPUT,
        timeout=180
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Success! Request ID: {result['request_id']}")
        print(f"   Total Questions: {result['total_questions']}")
        print(f"   Total Batches: {result['total_batches']}")
        
        # Show first answer as example
        if result['batches'] and result['batches'][0]['answers']:
            first = result['batches'][0]['answers'][0]
            print(f"\n   Example Answer (Q-001):")
            print(f"   Question: {first['question_text']}")
            print(f"   Answer: {first['answer'][:150]}...")
            print(f"   Confidence: {first['confidence']} ({first['confidence_score']})")
            print(f"   Citations: {len(first['citations'])}")
        
        # Save full response
        with open("test_response.json", "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n📄 Full response saved to test_response.json")
        
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None


def test_process_with_callback():
    """
    Test processing with callback URL.
    The response will also be forwarded to the callback.
    """
    print("\n" + "=" * 60)
    print("📤 Testing POST /process with callback_url")
    print("=" * 60)
    
    # In real use, this would be another agent's endpoint
    callback = "https://httpbin.org/post"  # Test endpoint that echoes back
    
    response = requests.post(
        f"{API_BASE}/process",
        json=TEST_INPUT,
        params={"callback_url": callback},
        timeout=180
    )
    
    if response.status_code == 200:
        print(f"✅ Response received AND forwarded to: {callback}")
        return response.json()
    else:
        print(f"❌ Error: {response.status_code}")
        return None


def test_process_async():
    """
    Test async processing - returns immediately, 
    sends result to callback when done.
    """
    print("\n" + "=" * 60)
    print("📤 Testing POST /process/async (fire-and-forget)")
    print("=" * 60)
    
    callback = "https://httpbin.org/post"
    
    response = requests.post(
        f"{API_BASE}/process/async",
        json=TEST_INPUT,
        params={"callback_url": callback},
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Accepted: {result['status']}")
        print(f"   Request ID: {result['request_id']}")
        print(f"   Message: {result['message']}")
        print(f"   (Processing in background, results sent to callback)")
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        return None


def main():
    print("🧪 FastAPI Integration Test")
    print("=" * 60)
    
    # Check if server is running
    if not test_health():
        print("\n❌ Server not running! Start it with:")
        print("   uvicorn app.main:app --reload --port 8000")
        return
    
    # Test sync processing
    test_process_sync()
    
    # Uncomment to test callback/async:
    # test_process_with_callback()
    # test_process_async()


if __name__ == "__main__":
    main()
