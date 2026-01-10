"""
Unified configuration settings for the application.
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB Configuration
    mongodb_uri: str = ""
    mongodb_db_name: str = "security_questionnaire"
    
    # VoyageAI Configuration (for embeddings)
    voyage_api_key: str = ""
    voyage_model: str = "voyage-3-large"
    
    # Anthropic Configuration (for Knowledge Agent)
    anthropic_api_key: str = ""
    
    # Fireworks AI Configuration (for Citation/Drafting/Escalation)
    fireworks_api_key: str = ""
    fireworks_base_url: str = "https://api.fireworks.ai/inference/v1/chat/completions"
    fireworks_model: str = "accounts/fireworks/models/deepseek-v3p2"
    
    # Model Parameters
    max_tokens: int = 4096
    temperature: float = 0.6
    
    # Agent Configuration
    confidence_threshold: float = 0.7
    batch_size: int = 5
    answerability_penalty: float = 0.5
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

