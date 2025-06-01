
import os
import time
from typing import Dict, Optional, Any

class GlobalConfigService:
    """Service for managing global system configuration using environment variables only"""
    
    def __init__(self, config_file: str = None):
        # No longer using config file, only environment variables
        self.config = {}
        self.last_loaded = time.time()
        self.reload_interval = 60  # Reload config if older than 60 seconds
        
        # Load all configuration from environment variables
        self._load_from_env()
        
    def _load_from_env(self):
        """Load configuration entirely from environment variables"""
        # LLM settings
        self.config["llm_settings"] = {
            "default_provider": os.getenv("DEFAULT_LLM_MODEL", "siliconflow"),
            "temperature": float(os.getenv("LLM_TEMPERATURE", "0.1")),
            "providers": {
                "openai": {"model": os.getenv("OPENAI_MODEL_NAME", "gpt-4o")},
                "anthropic": {"model": os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-sonnet-20240229")},
                "google": {"model": os.getenv("GOOGLE_MODEL_NAME", "gemini-pro")},
                "groq": {"model": os.getenv("GROQ_MODEL_NAME", "llama-3-70b-8192")},
                "cohere": {"model": os.getenv("COHERE_MODEL_NAME", "command")},
                "huggingface": {"model": os.getenv("HUGGINGFACE_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")},
                "deepseek": {"model": os.getenv("DEEPSEEK_MODEL_NAME", "deepseek-chat")},
                "siliconflow": {"model": os.getenv("SILICONFLOW_MODEL_NAME", "Pro/deepseek-ai/DeepSeek-V3")}
            }
        }
        
        # Translation settings
        self.config["translation_settings"] = {
            "default_service": os.getenv("WEB_TRANSLATION_SERVICE", "none"),
            "chunk_size": int(os.getenv("CHUNK_SIZE", "1000")),
            "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", "200")),
            "max_file_size_mb": int(os.getenv("MAX_FILE_SIZE_MB", "20")),
            "rag_enabled": os.getenv("RAG_ENABLED", "true").lower() == "true"
        }
        
        # Database settings
        self.config["database_settings"] = {
            "use_database": os.getenv("USE_DATABASE", "false").lower() == "true",
            "db_url": os.getenv("DATABASE_URL", "sqlite:///translations.db")
        }
        
        print(f"[GLOBAL_CONFIG] Loaded config with default provider: {self.config['llm_settings']['default_provider']}")
        
    def _load_config(self):
        """Deprecated - no longer loading from JSON file"""
        return {}
        
    def _update_from_env(self):
        """Deprecated - all config is now loaded from env in _load_from_env"""
        pass
        
    def get_config(self, key: str = None) -> Any:
        """Get configuration value by key or entire config if no key provided"""
        # Check if we need to reload (every 60 seconds)
        if time.time() - self.last_loaded > self.reload_interval:
            self._load_from_env()
            self.last_loaded = time.time()
            
        if key:
            return self.config.get(key)
        return self.config
        
    def get_llm_settings(self) -> Dict[str, Any]:
        """Get LLM-specific settings"""
        return self.get_config("llm_settings")
        
    def get_translation_settings(self) -> Dict[str, Any]:
        """Get translation-specific settings"""
        return self.get_config("translation_settings")
        
    def get_database_settings(self) -> Dict[str, Any]:
        """Get database-specific settings"""
        return self.get_config("database_settings")
        
    def get_default_provider(self) -> str:
        """Get the default LLM provider"""
        return self.get_llm_settings().get("default_provider", "siliconflow")
        
    def get_provider_model(self, provider: str) -> str:
        """Get the model name for a specific provider"""
        providers = self.get_llm_settings().get("providers", {})
        return providers.get(provider, {}).get("model", "")
        
    def reload_config(self):
        """Force reload configuration from environment variables"""
        self._load_from_env()
        self.last_loaded = time.time()
        print("[GLOBAL_CONFIG] Configuration reloaded from environment variables")
