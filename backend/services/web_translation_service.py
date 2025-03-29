
import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any

class WebTranslationService:
    """Service for integrating with web-based translation services"""
    
    def __init__(self):
        self.default_service = os.getenv("WEB_TRANSLATION_SERVICE", "none")
        
        # API keys for different services
        self.google_api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
        self.microsoft_api_key = os.getenv("MICROSOFT_TRANSLATOR_API_KEY", "")
        self.microsoft_region = os.getenv("MICROSOFT_TRANSLATOR_REGION", "global")
        self.deepl_api_key = os.getenv("DEEPL_API_KEY", "")
        
        # Generic API key (for backward compatibility)
        self.fallback_api_key = os.getenv("TRANSLATION_API_KEY", "")
    
    async def translate_text(self, text: str, source_language: str, target_language: str, service: Optional[str] = None) -> str:
        """
        Translate text using the specified or default web translation service
        
        Args:
            text: The text to translate
            source_language: Source language code (e.g., 'en', 'fr')
            target_language: Target language code (e.g., 'es', 'de')
            service: Translation service to use (google, microsoft, deepl, or none)
            
        Returns:
            The translated text
        """
        service = service or self.default_service
        
        if service == "none":
            print("Web translation service is disabled")
            return text
            
        if service == "google":
            return await self._translate_with_google(text, source_language, target_language)
        elif service == "microsoft":
            return await self._translate_with_microsoft(text, source_language, target_language)
        elif service == "deepl":
            return await self._translate_with_deepl(text, source_language, target_language)
        else:
            print(f"Unknown translation service: {service}, using text as is")
            return text
    
    async def _translate_with_google(self, text: str, source_language: str, target_language: str) -> str:
        """Translate text using Google Translate API"""
        api_key = self.google_api_key or self.fallback_api_key
        
        if not api_key:
            print("Google Translate API key not configured")
            return text
            
        try:
            url = f"https://translation.googleapis.com/language/translate/v2?key={api_key}"
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "q": text,
                    "source": self._normalize_language_code(source_language, "google"),
                    "target": self._normalize_language_code(target_language, "google"),
                    "format": "text"
                }
                
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        translations = data.get("data", {}).get("translations", [])
                        if translations:
                            return translations[0].get("translatedText", text)
                    else:
                        error_text = await response.text()
                        print(f"Google Translate API error ({response.status}): {error_text}")
                        
            return text
        except Exception as e:
            print(f"Error using Google Translate API: {e}")
            return text
    
    async def _translate_with_microsoft(self, text: str, source_language: str, target_language: str) -> str:
        """Translate text using Microsoft Translator API"""
        api_key = self.microsoft_api_key or self.fallback_api_key
        
        if not api_key:
            print("Microsoft Translator API key not configured")
            return text
            
        try:
            endpoint = f"https://api.cognitive.microsofttranslator.com/translate"
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Ocp-Apim-Subscription-Key": api_key,
                    "Ocp-Apim-Subscription-Region": self.microsoft_region,
                    "Content-type": "application/json"
                }
                
                params = {
                    "api-version": "3.0",
                    "from": self._normalize_language_code(source_language, "microsoft"),
                    "to": self._normalize_language_code(target_language, "microsoft")
                }
                
                body = [{"text": text}]
                
                async with session.post(endpoint, params=params, headers=headers, json=body) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            translations = data[0].get("translations", [])
                            if translations and len(translations) > 0:
                                return translations[0].get("text", text)
                    else:
                        error_text = await response.text()
                        print(f"Microsoft Translator API error ({response.status}): {error_text}")
                        
            return text
        except Exception as e:
            print(f"Error using Microsoft Translator API: {e}")
            return text
    
    async def _translate_with_deepl(self, text: str, source_language: str, target_language: str) -> str:
        """Translate text using DeepL API"""
        api_key = self.deepl_api_key or self.fallback_api_key
        
        if not api_key:
            print("DeepL API key not configured")
            return text
            
        try:
            url = "https://api.deepl.com/v2/translate"
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"DeepL-Auth-Key {api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "text": [text],
                    "source_lang": self._normalize_language_code(source_language, "deepl"),
                    "target_lang": self._normalize_language_code(target_language, "deepl")
                }
                
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        translations = data.get("translations", [])
                        if translations and len(translations) > 0:
                            return translations[0].get("text", text)
                    else:
                        error_text = await response.text()
                        print(f"DeepL API error ({response.status}): {error_text}")
                        
            return text
        except Exception as e:
            print(f"Error using DeepL API: {e}")
            return text
    
    def _normalize_language_code(self, language_code: str, service: str) -> str:
        """
        Normalize language codes for different translation services
        
        For example:
        - Google uses 'en', 'zh-CN'
        - Microsoft uses 'en', 'zh-Hans'
        - DeepL uses 'EN', 'ZH'
        """
        # Convert to lowercase for consistency
        code = language_code.lower()
        
        # Special case mappings
        mappings = {
            "google": {
                "chinese": "zh-CN",
                "chinese_traditional": "zh-TW",
                "chinese_simplified": "zh-CN"
            },
            "microsoft": {
                "chinese": "zh-Hans",
                "chinese_traditional": "zh-Hant",
                "chinese_simplified": "zh-Hans"
            },
            "deepl": {
                "chinese": "ZH",
                "english": "EN",
                "german": "DE",
                "french": "FR",
                "spanish": "ES",
                "portuguese": "PT",
                "italian": "IT",
                "dutch": "NL",
                "polish": "PL",
                "russian": "RU",
                "japanese": "JA"
            }
        }
        
        # Apply service-specific mappings
        if service in mappings and code in mappings[service]:
            return mappings[service][code]
            
        # DeepL uses uppercase language codes
        if service == "deepl":
            return code.upper()
            
        return code
