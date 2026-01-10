"""
Configuration settings for the application.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Fireworks AI Configuration
    fireworks_api_key: str = "fw_9uVgLprHZxyLmY2f8K63xx"
    fireworks_base_url: str = "https://api.fireworks.ai/inference/v1/chat/completions"
    fireworks_model: str = "accounts/fireworks/models/deepseek-v3p2"
    
    # Model Parameters
    max_tokens: int = 4096
    temperature: float = 0.6
    top_p: float = 1.0
    
    # Batch Configuration
    batch_size: int = 5
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
