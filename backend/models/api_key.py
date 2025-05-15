
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
        # Explicitly load the default provider from environment
        default_provider = os.getenv("DEFAULT_LLM_MODEL", "openai").lower()
        
        # Print detailed debug information
        print(f"[API KEYS] Loading API key settings with default provider: {default_provider}")
        
        # Check if we have the API key for SiliconFlow
        siliconflow_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[API KEYS] SiliconFlow API key configured: {bool(siliconflow_key)}")
        print(f"[API KEYS] SiliconFlow API base: {os.getenv('SILICONFLOW_API_BASE', 'Not set')}")
        
        return cls(
            openai_key=os.getenv("OPENAI_API_KEY"),
            anthropic_key=os.getenv("ANTHROPIC_API_KEY"),
            google_key=os.getenv("GOOGLE_API_KEY"),
            groq_key=os.getenv("GROQ_API_KEY"),
            cohere_key=os.getenv("COHERE_API_KEY"),
            huggingface_key=os.getenv("HUGGINGFACE_API_KEY"),
            deepseek_key=os.getenv("DEEPSEEK_API_KEY"),
            siliconflow_key=siliconflow_key,
            default_provider=default_provider,
        )
    
    def get_key_for_provider(self, provider: str) -> Optional[str]:
        """Get the API key for the specified provider"""
        provider = provider.lower() if provider else self.default_provider
        
        # Print debug info for troubleshooting
        print(f"[API KEYS] Getting API key for provider: {provider}, default provider is: {self.default_provider}")
        
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
            if self.siliconflow_key:
                return self.siliconflow_key
            else:
                print(f"Warning: No API key for provider {provider}. Using default provider.")
                if provider == self.default_provider:
                    # If the requested provider is the default provider but has no key,
                    # try to find any available provider with a key
                    for p in ["openai", "anthropic", "google", "groq", "cohere", "huggingface", "deepseek"]:
                        key = self.get_key_for_provider(p)
                        if key:
                            print(f"[API KEYS] Falling back to provider: {p} since default provider has no key")
                            return key
                return self.get_key_for_provider(self.default_provider)
        else:
            # Fall back to default provider
            print(f"[API KEYS] Unknown provider '{provider}', falling back to default provider: {self.default_provider}")
            return self.get_key_for_provider(self.default_provider)
    
    def has_key_for_provider(self, provider: str) -> bool:
        """Check if we have an API key for the specified provider"""
        key = self.get_key_for_provider(provider)
        has_key = key is not None and len(key) > 0
        
        # Print debug info
        print(f"[API KEYS] Provider '{provider}' has key: {has_key}")
        
        return has_key
    
    def get_all_providers_status(self) -> Dict[str, bool]:
        """Get status of all providers"""
        return {
            "openai": self.has_key_for_provider("openai"),
            "anthropic": self.has_key_for_provider("anthropic"),
            "google": self.has_key_for_provider("google"),
            "groq": self.has_key_for_provider("groq"),
            "cohere": self.has_key_for_provider("cohere"),
            "huggingface": self.has_key_for_provider("huggingface"),
            "deepseek": self.has_key_for_provider("deepseek"),
            "siliconflow": self.has_key_for_provider("siliconflow"),
            "default_provider": self.default_provider,
            "configured_providers_count": sum(1 for p in ["openai", "anthropic", "google", "groq", "cohere", "huggingface", "deepseek", "siliconflow"] if self.has_key_for_provider(p))
        }
