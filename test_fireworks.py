"""
Test script to verify Fireworks AI API connection.
Run with: python test_fireworks.py
"""
import requests
import json

url = "https://api.fireworks.ai/inference/v1/chat/completions"

payload = {
    "model": "accounts/fireworks/models/deepseek-v3p2",
    "max_tokens": 1024,
    "top_p": 1,
    "top_k": 40,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "temperature": 0.6,
    "messages": [
        {
            "role": "user",
            "content": "Hello! Can you briefly describe what a security questionnaire is in 2-3 sentences?"
        }
    ]
}

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Bearer fw_9uVgLprHZxyLmY2f8K63xx"
}

print("🔥 Calling Fireworks AI API...")
print(f"Model: {payload['model']}")
print(f"Prompt: {payload['messages'][0]['content']}")
print("-" * 50)

response = requests.post(url, headers=headers, json=payload)

# Save full response to file
with open("test_response.json", "w") as f:
    json.dump(response.json(), f, indent=2)

print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    content = result["choices"][0]["message"]["content"]
    print(f"\n✅ Response:\n{content}")
    print(f"\n📄 Full response saved to test_response.json")
else:
    print(f"❌ Error: {response.text}")
