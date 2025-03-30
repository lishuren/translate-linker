
import os
import json
import time
from typing import Dict, Optional, Any
from pathlib import Path

class GlobalConfigService:
    """Service for managing global system configuration"""
    
    def __init__(self, config_file: str = None):
        self.config_file = config_file or os.getenv("GLOBAL_CONFIG_FILE", "./global_config.json")
        self.config = self._load_config()
        self.last_loaded = time.time()
        self.reload_interval = 60  # Reload config if older than 60 seconds
        
        # Set defaults from environment if config is empty
        if not self.config:
            self.config = {
                "llm_settings": {
                    "default_provider": os.getenv("DEFAULT_LLM_MODEL", "openai"),
                    "temperature": float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    "providers": {
                        "openai": {"model": os.getenv("OPENAI_MODEL_NAME", "gpt-4o")},
                        "anthropic": {"model": os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-sonnet-20240229")},
                        "google": {"model": os.getenv("GOOGLE_MODEL_NAME", "gemini-pro")},
                        "groq": {"model": os.getenv("GROQ_MODEL_NAME", "llama-3-70b-8192")},
                        "cohere": {"model": os.getenv("COHERE_MODEL_NAME", "command")},
                        "huggingface": {"model": os.getenv("HUGGINGFACE_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")},
                        "deepseek": {"model": os.getenv("DEEPSEEK_MODEL_NAME", "deepseek-chat")},
                        "siliconflow": {"model": os.getenv("SILICONFLOW_MODEL_NAME", "siliconflow-1")}
                    }
                },
                "translation_settings": {
                    "default_service": os.getenv("WEB_TRANSLATION_SERVICE", "none"),
                    "chunk_size": int(os.getenv("CHUNK_SIZE", 1000)),
                    "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", 200)),
                    "max_file_size_mb": int(os.getenv("MAX_FILE_SIZE_MB", 20)),
                    "rag_enabled": True
                },
                "database_settings": {
                    "use_database": os.getenv("USE_DATABASE", "false").lower() == "true",
                    "db_url": os.getenv("DATABASE_URL", "sqlite:///translations.db"),
                }
            }
            self._save_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        try:
            if Path(self.config_file).exists():
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            else:
                # Create directory if it doesn't exist
                Path(self.config_file).parent.mkdir(parents=True, exist_ok=True)
                return {}
        except Exception as e:
            print(f"Error loading global config: {e}")
            return {}
    
    def _save_config(self) -> None:
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"Error saving global config: {e}")
    
    def get_config(self, reload: bool = False) -> Dict[str, Any]:
        """Get the current configuration, optionally reloading from disk"""
        if reload or (time.time() - self.last_loaded) > self.reload_interval:
            self.config = self._load_config()
            self.last_loaded = time.time()
        return self.config
    
    def update_config(self, updates: Dict[str, Any]) -> None:
        """Update configuration with new values"""
        if not updates:
            return
            
        # Deep merge the updates into current config
        self._deep_update(self.config, updates)
        self._save_config()
    
    def _deep_update(self, d: Dict[str, Any], u: Dict[str, Any]) -> None:
        """Recursively update a dictionary"""
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                self._deep_update(d[k], v)
            else:
                d[k] = v
    
    # Convenience methods for common config operations
    def get_default_llm_provider(self) -> str:
        """Get the default LLM provider"""
        return self.get_config().get("llm_settings", {}).get("default_provider", "openai")
    
    def get_llm_settings(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get settings for a specific LLM provider or the default provider"""
        config = self.get_config()
        provider = provider or config.get("llm_settings", {}).get("default_provider", "openai")
        
        # Get provider-specific settings
        provider_settings = config.get("llm_settings", {}).get("providers", {}).get(provider, {})
        
        # Merge with global LLM settings
        return {
            "provider": provider,
            "temperature": config.get("llm_settings", {}).get("temperature", 0.1),
            "model": provider_settings.get("model", ""),
            **provider_settings
        }
    
    def get_translation_settings(self) -> Dict[str, Any]:
        """Get translation service settings"""
        return self.get_config().get("translation_settings", {})
    
    def get_database_settings(self) -> Dict[str, Any]:
        """Get database settings"""
        return self.get_config().get("database_settings", {})
