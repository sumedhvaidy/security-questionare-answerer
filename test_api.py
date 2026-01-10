"""
Test script to verify the API works correctly.
Run with: python test_api.py
"""
import httpx
import json
import asyncio

from app.dummy_data import get_dummy_input, get_minimal_test_input


API_BASE = "http://localhost:8000"


async def test_health():
    """Test the health endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE}/health")
        print("Health Check:", response.json())
        return response.status_code == 200


async def test_process_questionnaire(use_minimal: bool = True):
    """Test the main processing endpoint."""
    input_data = get_minimal_test_input() if use_minimal else get_dummy_input()
    
    print(f"\n{'='*60}")
    print("Testing /process endpoint")
    print(f"Questions: {len(input_data['questions'])}")
    print(f"Context Documents: {len(input_data['context_documents'])}")
    print(f"{'='*60}\n")
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{API_BASE}/process",
            json=input_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"\nRequest ID: {result['request_id']}")
            print(f"Total Questions: {result['total_questions']}")
            print(f"Total Batches: {result['total_batches']}")
            print(f"Status: {result['status']}")
            
            for batch in result['batches']:
                print(f"\n--- Batch {batch['batch_number']} ---")
                for answer in batch['answers']:
                    print(f"\nQ: {answer['question_text']}")
                    print(f"A: {answer['answer'][:200]}..." if len(answer['answer']) > 200 else f"A: {answer['answer']}")
                    print(f"Confidence: {answer['confidence']} ({answer['confidence_score']})")
                    print(f"Citations: {len(answer['citations'])}")
                    if answer['reasoning']:
                        print(f"Reasoning: {answer['reasoning']}")
            
            # Save full result to file
            with open("test_output.json", "w") as f:
                json.dump(result, f, indent=2)
            print("\n\n📄 Full output saved to test_output.json")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False


async def main():
    """Run all tests."""
    print("🧪 Testing Security Questionnaire API\n")
    
    # Test health
    health_ok = await test_health()
    if not health_ok:
        print("❌ Health check failed. Is the server running?")
        return
    
    # Test processing (use minimal=False for full test)
    await test_process_questionnaire(use_minimal=True)


if __name__ == "__main__":
    asyncio.run(main())
