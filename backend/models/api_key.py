
from typing import Dict, Optional
import os
import sys
import json
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
    debug_mode: bool = False

    @classmethod
    def from_env(cls) -> "APIKeySettings":
        """Create settings from environment variables"""
        # Check if debug mode is enabled - look for any of these indicators
        debug_mode = (
            os.getenv("DEBUG", "False").lower() == "true" or 
            "--debug" in sys.argv or
            "-d" in sys.argv or
            any("--debug" in arg for arg in sys.argv)
        )
        
        # Explicitly load the default provider from environment
        default_provider = os.getenv("DEFAULT_LLM_MODEL", "openai").lower()
        
        # Print detailed debug information
        print(f"[API KEYS] Loading API key settings with default provider: {default_provider}")
        
        # Check if we have the API key for SiliconFlow
        siliconflow_key = os.getenv("SILICONFLOW_API_KEY")
        print(f"[API KEYS] SiliconFlow API key configured: {bool(siliconflow_key)}")
        
        if debug_mode:
            print(f"[API_KEYS_DEBUG] SiliconFlow API base: {os.getenv('SILICONFLOW_API_BASE', 'Not set')}")
            print(f"[API_KEYS_DEBUG] Debug mode enabled: {debug_mode}")
        
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
            debug_mode=debug_mode,
        )
    
    def log_debug(self, message: str, data=None):
        """Log debug messages only if in debug mode"""
        if self.debug_mode:
            if data:
                print(f"[API_KEYS_DEBUG] {message}: {json.dumps(data, indent=2, default=str)}")
            else:
                print(f"[API_KEYS_DEBUG] {message}")
    
    def get_key_for_provider(self, provider: str) -> Optional[str]:
        """Get the API key for the specified provider"""
        provider = provider.lower() if provider else self.default_provider
        
        # Print debug info for troubleshooting
        print(f"[API KEYS] Getting API key for provider: {provider}, default provider is: {self.default_provider}")
        
        if self.debug_mode:
            self.log_debug(f"Looking up key for provider", provider)
        
        # Dictionary to map provider names to attribute names
        provider_map = {
            "openai": "openai_key",
            "chatgpt": "openai_key",
            "anthropic": "anthropic_key",
            "claude": "anthropic_key",
            "google": "google_key",
            "vertex": "google_key",
            "grok": "google_key",
            "groq": "groq_key",
            "cohere": "cohere_key",
            "huggingface": "huggingface_key",
            "deepseek": "deepseek_key",
            "siliconflow": "siliconflow_key"
        }
        
        # Get the attribute name for this provider
        attr_name = provider_map.get(provider)
        
        if attr_name:
            key = getattr(self, attr_name)
            if key:
                return key
                
        # If we get here, either the provider is unknown or we don't have a key for it
        if provider != self.default_provider:
            print(f"[API KEYS] No key for provider '{provider}', falling back to default provider: {self.default_provider}")
            return self.get_key_for_provider(self.default_provider)
        else:
            # We're already at the default provider and don't have a key, try to find any provider with a key
            for p in ["openai", "anthropic", "google", "groq", "cohere", "huggingface", "deepseek", "siliconflow"]:
                if p != provider:  # Skip the current default provider we already checked
                    test_attr = provider_map.get(p)
                    if test_attr and getattr(self, test_attr):
                        print(f"[API KEYS] Default provider '{provider}' has no key, using alternate provider: {p}")
                        return getattr(self, test_attr)
        
        print(f"[API KEYS] Warning: No API key found for any provider")
        return None
    
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
