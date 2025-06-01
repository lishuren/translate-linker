
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
        
        # Always prioritize environment variables over config file
        self._update_from_env()
        
    def _update_from_env(self):
        """Update config by prioritizing environment variables over config file"""
        # LLM settings - prioritize .env over config file
        self.config.setdefault("llm_settings", {})
        
        # Use environment variable first, then config file, then default
        env_default_provider = os.getenv("DEFAULT_LLM_MODEL")
        if env_default_provider:
            self.config["llm_settings"]["default_provider"] = env_default_provider
        elif "default_provider" not in self.config["llm_settings"]:
            self.config["llm_settings"]["default_provider"] = "siliconflow"
            
        env_temperature = os.getenv("LLM_TEMPERATURE")
        if env_temperature:
            self.config["llm_settings"]["temperature"] = float(env_temperature)
        elif "temperature" not in self.config["llm_settings"]:
            self.config["llm_settings"]["temperature"] = 0.1
        
        # Provider models - prioritize environment variables
        self.config["llm_settings"].setdefault("providers", {})
        
        providers = {
            "openai": {"model": os.getenv("OPENAI_MODEL_NAME", self.config["llm_settings"]["providers"].get("openai", {}).get("model", "gpt-4o"))},
            "anthropic": {"model": os.getenv("ANTHROPIC_MODEL_NAME", self.config["llm_settings"]["providers"].get("anthropic", {}).get("model", "claude-3-sonnet-20240229"))},
            "google": {"model": os.getenv("GOOGLE_MODEL_NAME", self.config["llm_settings"]["providers"].get("google", {}).get("model", "gemini-pro"))},
            "groq": {"model": os.getenv("GROQ_MODEL_NAME", self.config["llm_settings"]["providers"].get("groq", {}).get("model", "llama-3-70b-8192"))},
            "cohere": {"model": os.getenv("COHERE_MODEL_NAME", self.config["llm_settings"]["providers"].get("cohere", {}).get("model", "command"))},
            "huggingface": {"model": os.getenv("HUGGINGFACE_MODEL_ID", self.config["llm_settings"]["providers"].get("huggingface", {}).get("model", "mistralai/Mistral-7B-Instruct-v0.2"))},
            "deepseek": {"model": os.getenv("DEEPSEEK_MODEL_NAME", self.config["llm_settings"]["providers"].get("deepseek", {}).get("model", "deepseek-chat"))},
            "siliconflow": {"model": os.getenv("SILICONFLOW_MODEL_NAME", self.config["llm_settings"]["providers"].get("siliconflow", {}).get("model", "Pro/deepseek-ai/DeepSeek-V3"))}
        }
        
        for provider, settings in providers.items():
            self.config["llm_settings"]["providers"][provider] = settings
        
        # Translation settings - prioritize environment variables
        self.config.setdefault("translation_settings", {})
        
        env_translation_service = os.getenv("WEB_TRANSLATION_SERVICE")
        if env_translation_service:
            self.config["translation_settings"]["default_service"] = env_translation_service
        elif "default_service" not in self.config["translation_settings"]:
            self.config["translation_settings"]["default_service"] = "none"
            
        env_chunk_size = os.getenv("CHUNK_SIZE")
        if env_chunk_size:
            self.config["translation_settings"]["chunk_size"] = int(env_chunk_size)
        elif "chunk_size" not in self.config["translation_settings"]:
            self.config["translation_settings"]["chunk_size"] = 1000
            
        env_chunk_overlap = os.getenv("CHUNK_OVERLAP")
        if env_chunk_overlap:
            self.config["translation_settings"]["chunk_overlap"] = int(env_chunk_overlap)
        elif "chunk_overlap" not in self.config["translation_settings"]:
            self.config["translation_settings"]["chunk_overlap"] = 200
            
        env_max_file_size = os.getenv("MAX_FILE_SIZE_MB")
        if env_max_file_size:
            self.config["translation_settings"]["max_file_size_mb"] = int(env_max_file_size)
        elif "max_file_size_mb" not in self.config["translation_settings"]:
            self.config["translation_settings"]["max_file_size_mb"] = 20
            
        env_rag_enabled = os.getenv("RAG_ENABLED")
        if env_rag_enabled:
            self.config["translation_settings"]["rag_enabled"] = env_rag_enabled.lower() == "true"
        elif "rag_enabled" not in self.config["translation_settings"]:
            self.config["translation_settings"]["rag_enabled"] = True
        
        # Database settings - prioritize environment variables
        self.config.setdefault("database_settings", {})
        
        env_use_database = os.getenv("USE_DATABASE")
        if env_use_database:
            self.config["database_settings"]["use_database"] = env_use_database.lower() == "true"
        elif "use_database" not in self.config["database_settings"]:
            self.config["database_settings"]["use_database"] = False
            
        env_db_url = os.getenv("DATABASE_URL")
        if env_db_url:
            self.config["database_settings"]["db_url"] = env_db_url
        elif "db_url" not in self.config["database_settings"]:
            self.config["database_settings"]["db_url"] = "sqlite:///translations.db"
        
        print(f"[GLOBAL_CONFIG] Loaded config with default provider: {self.config['llm_settings']['default_provider']}")
        
    # ... keep existing code (remaining methods)
