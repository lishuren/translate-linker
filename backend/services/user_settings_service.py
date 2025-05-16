
import os
import json
from typing import Dict, Any, Optional
from datetime import datetime

class UserSettingsService:
    """Service for managing user-specific settings"""
    
    def __init__(self):
        self.settings_enabled = os.getenv("USER_SETTINGS_ENABLED", "true").lower() == "true"
        self.settings_file = os.getenv("USER_SETTINGS_FILE", "./user_settings.json")
        self.settings_cache = {}
        self.default_settings = {
            "llm_provider": os.getenv("DEFAULT_LLM_MODEL", "openai"),
            "allow_model_selection": os.getenv("ALLOW_USER_MODEL_SELECTION", "true").lower() == "true",
            "web_translation_service": os.getenv("WEB_TRANSLATION_SERVICE", "none"),
            "last_updated": datetime.now().isoformat()
        }
        
        self.debug_mode = os.getenv("DEBUG", "False").lower() == "true"
        
        # Load settings on initialization if enabled
        if self.settings_enabled:
            self.load_settings()
    
    def load_settings(self):
        """Load settings from file"""
        try:
            if os.path.exists(self.settings_file):
                with open(self.settings_file, 'r') as f:
                    self.settings_cache = json.load(f)
                if self.debug_mode:
                    print(f"[USER_SETTINGS] Loaded settings for {len(self.settings_cache)} users")
            else:
                # Create default settings file if it doesn't exist
                self.create_sample_settings()
                if self.debug_mode:
                    print(f"[USER_SETTINGS] Created sample settings file")
        except Exception as e:
            if self.debug_mode:
                print(f"[USER_SETTINGS_ERROR] Error loading user settings: {e}")
    
    def create_sample_settings(self):
        """Create a sample settings file"""
        try:
            sample_settings = {
                "sample_user_1": {
                    "llm_provider": "openai",
                    "allow_model_selection": True,
                    "web_translation_service": "google",
                    "preferred_languages": ["en", "es", "fr"],
                    "last_updated": datetime.now().isoformat()
                },
                "sample_user_2": {
                    "llm_provider": "anthropic",
                    "allow_model_selection": False,
                    "web_translation_service": "none",
                    "preferred_languages": ["en", "ja", "zh"],
                    "last_updated": datetime.now().isoformat()
                },
                "admin": {
                    "llm_provider": "siliconflow",
                    "allow_model_selection": True,
                    "web_translation_service": "none",
                    "preferred_languages": ["en", "zh", "ko", "ru"],
                    "admin_privileges": True,
                    "last_updated": datetime.now().isoformat()
                }
            }
            
            with open(self.settings_file, 'w') as f:
                json.dump(sample_settings, f, indent=2)
            
            self.settings_cache = sample_settings
            return sample_settings
        except Exception as e:
            if self.debug_mode:
                print(f"[USER_SETTINGS_ERROR] Failed to create sample settings: {e}")
            return {}
    
    def get_user_settings(self, user_id: str) -> Dict[str, Any]:
        """Get settings for a specific user"""
        if not self.settings_enabled:
            return self.default_settings
            
        if not user_id:
            return self.default_settings
            
        if user_id in self.settings_cache:
            if self.debug_mode:
                print(f"[USER_SETTINGS] Retrieved settings for user {user_id}")
            return self.settings_cache[user_id]
        
        # If user settings don't exist, create default for this user
        if self.debug_mode:
            print(f"[USER_SETTINGS] Creating default settings for new user {user_id}")
            
        new_user_settings = self.default_settings.copy()
        self.settings_cache[user_id] = new_user_settings
        
        # Save the updated settings to file
        self.save_settings()
        
        return new_user_settings
    
    def save_settings(self):
        """Save all settings to file"""
        if not self.settings_enabled:
            return
        
        try:
            with open(self.settings_file, 'w') as f:
                json.dump(self.settings_cache, f, indent=2)
                
            if self.debug_mode:
                print(f"[USER_SETTINGS] Saved settings for {len(self.settings_cache)} users")
        except Exception as e:
            if self.debug_mode:
                print(f"[USER_SETTINGS_ERROR] Error saving user settings: {e}")
    
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
        current_settings["last_updated"] = datetime.now().isoformat()
        self.settings_cache[user_id] = current_settings
        
        # Save to file
        self.save_settings()
        
        if self.debug_mode:
            print(f"[USER_SETTINGS] Updated settings for user {user_id}")
