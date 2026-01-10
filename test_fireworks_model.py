"""Test script to find working Fireworks AI model"""
import asyncio
import httpx
import json

API_KEY = "fw_LvS1WYi7mG6cU8k1p9BPuH"
BASE_URL = "https://api.fireworks.ai/inference/v1"

# Model names to test
MODELS = [
    "accounts/fireworks/models/llama-v3-70b-instruct",
    "fireworks/llama-v3-70b-instruct",
    "meta-llama/Llama-3-70b-instruct",
    "fireworks/llama-v2-70b-chat",
    "accounts/fireworks/models/llama-v2-70b-chat",
    "fireworks/llama-v2-70b-code-instruct",
]

async def test_model(model_name):
    """Test a single model"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "user", "content": "Say 'test' in JSON format: {\"result\": \"test\"}"}
                    ],
                    "max_tokens": 20,
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            if response.status_code == 200:
                data = response.json()
                return True, model_name, data.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                error_data = response.json() if response.text else {}
                return False, model_name, f"Status {response.status_code}: {error_data.get('error', {}).get('message', response.text[:100])}"
    except Exception as e:
        return False, model_name, str(e)[:100]

async def main():
    print("Testing Fireworks AI models...\n")
    working_models = []
    
    for model in MODELS:
        print(f"Testing: {model}...", end=" ")
        success, model_name, result = await test_model(model)
        if success:
            print(f"✅ WORKING!")
            print(f"   Response: {result[:100]}")
            working_models.append(model_name)
        else:
            print(f"❌ FAILED")
            print(f"   Error: {result}")
        print()
    
    print("=" * 60)
    if working_models:
        print(f"✅ Working models found: {', '.join(working_models)}")
        print(f"   Recommended: {working_models[0]}")
    else:
        print("❌ No working models found. Check API key and model availability.")

if __name__ == "__main__":
    asyncio.run(main())
