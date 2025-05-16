
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
        
        # Always prioritize environment variables
        self._update_from_env()
        
    def _update_from_env(self):
        """Update config by prioritizing environment variables"""
        # LLM settings
        self.config.setdefault("llm_settings", {})
        self.config["llm_settings"]["default_provider"] = os.getenv("DEFAULT_LLM_MODEL", 
                                                                  self.config["llm_settings"].get("default_provider", "openai"))
        self.config["llm_settings"]["temperature"] = float(os.getenv("LLM_TEMPERATURE", 
                                                                  self.config["llm_settings"].get("temperature", 0.1)))
        
        # Provider models
        self.config["llm_settings"].setdefault("providers", {})
        
        providers = {
            "openai": {"model": os.getenv("OPENAI_MODEL_NAME", "gpt-4o")},
            "anthropic": {"model": os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-sonnet-20240229")},
            "google": {"model": os.getenv("GOOGLE_MODEL_NAME", "gemini-pro")},
            "groq": {"model": os.getenv("GROQ_MODEL_NAME", "llama-3-70b-8192")},
            "cohere": {"model": os.getenv("COHERE_MODEL_NAME", "command")},
            "huggingface": {"model": os.getenv("HUGGINGFACE_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")},
            "deepseek": {"model": os.getenv("DEEPSEEK_MODEL_NAME", "deepseek-chat")},
            "siliconflow": {"model": os.getenv("SILICONFLOW_MODEL_NAME", "siliconflow-1")}
        }
        
        for provider, settings in providers.items():
            self.config["llm_settings"]["providers"][provider] = settings
        
        # Translation settings
        self.config.setdefault("translation_settings", {})
        self.config["translation_settings"]["default_service"] = os.getenv("WEB_TRANSLATION_SERVICE", 
                                                                        self.config["translation_settings"].get("default_service", "none"))
        self.config["translation_settings"]["chunk_size"] = int(os.getenv("CHUNK_SIZE", 
                                                                       self.config["translation_settings"].get("chunk_size", 1000)))
        self.config["translation_settings"]["chunk_overlap"] = int(os.getenv("CHUNK_OVERLAP", 
                                                                          self.config["translation_settings"].get("chunk_overlap", 200)))
        self.config["translation_settings"]["max_file_size_mb"] = int(os.getenv("MAX_FILE_SIZE_MB", 
                                                                             self.config["translation_settings"].get("max_file_size_mb", 20)))
        self.config["translation_settings"]["rag_enabled"] = os.getenv("RAG_ENABLED", "true").lower() == "true"
        
        # Database settings
        self.config.setdefault("database_settings", {})
        self.config["database_settings"]["use_database"] = os.getenv("USE_DATABASE", "false").lower() == "true"
        self.config["database_settings"]["db_url"] = os.getenv("DATABASE_URL", 
                                                            self.config["database_settings"].get("db_url", "sqlite:///translations.db"))
        
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
            self._update_from_env()  # Always prioritize environment variables
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
