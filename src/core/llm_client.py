"""
LLM clients for Fireworks AI and other providers.
"""
import httpx
import json
from typing import Optional, List, Dict

from src.core.config import settings


class FireworksClient:
    """Client for Fireworks AI API."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.fireworks_api_key
        self.base_url = settings.fireworks_base_url
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    async def chat_completion(
        self,
        messages: List[Dict],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        model: Optional[str] = None,
        response_format: Optional[dict] = None
    ) -> dict:
        """
        Make a chat completion request to Fireworks AI.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Override default max tokens
            temperature: Override default temperature
            model: Override default model
            response_format: Optional JSON schema for structured output
            
        Returns:
            The API response as a dict
        """
        payload = {
            "model": model or settings.fireworks_model,
            "max_tokens": max_tokens or settings.max_tokens,
            "temperature": temperature or settings.temperature,
            "messages": messages
        }
        
        if response_format:
            payload["response_format"] = response_format
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self.base_url,
                headers=self.headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_text = response.text
                print(f"❌ Fireworks API Error: {response.status_code}")
                print(f"   Response: {error_text}")
                response.raise_for_status()
            
            return response.json()
    
    def extract_content(self, response: dict) -> str:
        """Extract the content from a chat completion response."""
        return response["choices"][0]["message"]["content"]
    
    def parse_json_response(self, response: dict) -> dict:
        """Extract and parse JSON content from a response."""
        content = self.extract_content(response)
        # Handle potential markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        try:
            return json.loads(content.strip())
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parse error: {e}")
            print(f"   Raw content: {content[:500]}...")
            # Return a default structure to prevent crashes
            return {
                "answer": "Unable to parse response",
                "confidence": "low",
                "confidence_score": 0.1,
                "citations": [],
                "reasoning": f"JSON parse error: {str(e)}"
            }


# Singleton instance
fireworks_client = FireworksClient()

