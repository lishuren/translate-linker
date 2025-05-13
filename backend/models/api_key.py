
from typing import Dict, Optional
import os
from pydantic import BaseModel

class APIKeySettings(BaseModel):
    """Model for API key settings"""
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    google_key: Optional[str] = None
    groq_key: Optional[str] = None
    cohere_key: Optional[str] = None
    huggingface_key: Optional[str] = None
    deepseek_key: Optional[str] = None
    siliconflow_key: Optional[str] = None
    default_provider: str = "openai"

    @classmethod
    def from_env(cls) -> "APIKeySettings":
        """Create settings from environment variables"""
        return cls(
            openai_key=os.getenv("OPENAI_API_KEY"),
            anthropic_key=os.getenv("ANTHROPIC_API_KEY"),
            google_key=os.getenv("GOOGLE_API_KEY"),
            groq_key=os.getenv("GROQ_API_KEY"),
            cohere_key=os.getenv("COHERE_API_KEY"),
            huggingface_key=os.getenv("HUGGINGFACE_API_KEY"),
            deepseek_key=os.getenv("DEEPSEEK_API_KEY"),
            siliconflow_key=os.getenv("SILICONFLOW_API_KEY"),
            default_provider=os.getenv("DEFAULT_LLM_MODEL", "openai"),
        )
    
    def get_key_for_provider(self, provider: str) -> Optional[str]:
        """Get the API key for the specified provider"""
        provider = provider.lower() if provider else self.default_provider
        
        if provider in ["openai", "chatgpt"]:
            return self.openai_key
        elif provider in ["anthropic", "claude"]:
            return self.anthropic_key
        elif provider in ["google", "vertex", "grok"]:
            return self.google_key
        elif provider == "groq":
            return self.groq_key
        elif provider == "cohere":
            return self.cohere_key
        elif provider == "huggingface":
            return self.huggingface_key
        elif provider == "deepseek":
            return self.deepseek_key
        elif provider == "siliconflow":
            return self.siliconflow_key
        else:
            # Default to OpenAI
            return self.openai_key
    
    def has_key_for_provider(self, provider: str) -> bool:
        """Check if we have an API key for the specified provider"""
        key = self.get_key_for_provider(provider)
        return key is not None and len(key) > 0
