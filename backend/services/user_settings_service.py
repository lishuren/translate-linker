
import os
import json
from typing import Dict, Any, Optional

class UserSettingsService:
    """Service for managing user-specific settings"""
    
    def __init__(self):
        self.settings_enabled = os.getenv("USER_SETTINGS_ENABLED", "false").lower() == "true"
        self.settings_file = os.getenv("USER_SETTINGS_FILE", "./user_settings.json")
        self.settings_cache = {}
        self.default_settings = {
            "llm_provider": os.getenv("DEFAULT_LLM_MODEL", "openai"),
            "allow_model_selection": os.getenv("ALLOW_USER_MODEL_SELECTION", "true").lower() == "true",
            "web_translation_service": os.getenv("WEB_TRANSLATION_SERVICE", "none")
        }
        
        # Load settings on initialization if enabled
        if self.settings_enabled and os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, 'r') as f:
                    self.settings_cache = json.load(f)
            except Exception as e:
                print(f"Error loading user settings: {e}")
    
    def get_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Get settings for a specific user"""
        if not self.settings_enabled:
            return self.default_settings
            
        if user_id in self.settings_cache:
            return self.settings_cache[user_id]
        
        return self.default_settings
    
    def get_user_llm_provider(self, user_id: str) -> str:
        """Get the configured LLM provider for a user"""
        settings = self.get_user_settings(user_id)
        return settings.get("llm_provider", self.default_settings["llm_provider"])
    
    def is_model_selection_allowed(self, user_id: str) -> bool:
        """Check if a user is allowed to select LLM models"""
        settings = self.get_user_settings(user_id)
        return settings.get("allow_model_selection", self.default_settings["allow_model_selection"])
    
    def get_web_translation_service(self, user_id: str) -> str:
        """Get the configured web translation service for a user"""
        settings = self.get_user_settings(user_id)
        return settings.get("web_translation_service", self.default_settings["web_translation_service"])
    
    def update_user_settings(self, user_id: str, settings: Dict[str, Any]) -> None:
        """Update settings for a specific user"""
        if not self.settings_enabled:
            return
            
        # Merge with existing settings if any
        current_settings = self.settings_cache.get(user_id, {})
        current_settings.update(settings)
        self.settings_cache[user_id] = current_settings
        
        # Save to file
        try:
            with open(self.settings_file, 'w') as f:
                json.dump(self.settings_cache, f, indent=2)
        except Exception as e:
            print(f"Error saving user settings: {e}")
