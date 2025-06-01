
import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any

# Import googletrans for fallback translation
try:
    from googletrans import Translator
    GOOGLETRANS_AVAILABLE = True
except ImportError:
    GOOGLETRANS_AVAILABLE = False
    Translator = None

class WebTranslationService:
    """Service for integrating with web-based translation services"""
    
    def __init__(self):
        self.default_service = os.getenv("WEB_TRANSLATION_SERVICE", "googletrans")
        
        # API keys for different services
        self.google_api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
        self.microsoft_api_key = os.getenv("MICROSOFT_TRANSLATOR_API_KEY", "")
        self.microsoft_region = os.getenv("MICROSOFT_TRANSLATOR_REGION", "global")
        self.deepl_api_key = os.getenv("DEEPL_API_KEY", "")
        
        # Generic API key (for backward compatibility)
        self.fallback_api_key = os.getenv("TRANSLATION_API_KEY", "")
        
        # Initialize googletrans translator if available
        self.googletrans_translator = Translator() if GOOGLETRANS_AVAILABLE else None
    
    async def translate_text(self, text: str, source_language: str, target_language: str, service: Optional[str] = None) -> str:
        """
        Translate text using the specified or default web translation service
        
        Args:
            text: The text to translate
            source_language: Source language code (e.g., 'en', 'fr')
            target_language: Target language code (e.g., 'es', 'de')
            service: Translation service to use (google, microsoft, deepl, googletrans, or none)
            
        Returns:
            The translated text
        """
        service = service or self.default_service
        
        if service == "none":
            print("Web translation service is disabled")
            return text
            
        if service == "googletrans":
            return await self._translate_with_googletrans(text, source_language, target_language)
        elif service == "google":
            return await self._translate_with_google(text, source_language, target_language)
        elif service == "microsoft":
            return await self._translate_with_microsoft(text, source_language, target_language)
        elif service == "deepl":
            return await self._translate_with_deepl(text, source_language, target_language)
        else:
            print(f"Unknown translation service: {service}, falling back to googletrans")
            return await self._translate_with_googletrans(text, source_language, target_language)
    
    async def _translate_with_googletrans(self, text: str, source_language: str, target_language: str) -> str:
        """Translate text using googletrans library (free Google Translate)"""
        if not GOOGLETRANS_AVAILABLE or not self.googletrans_translator:
            print("Googletrans library not available")
            return text
            
        try:
            # Run the translation in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            
            def translate_sync():
                # Normalize language codes for googletrans
                src_lang = self._normalize_language_code(source_language, "googletrans")
                dest_lang = self._normalize_language_code(target_language, "googletrans")
                
                result = self.googletrans_translator.translate(text, src=src_lang, dest=dest_lang)
                return result.text
            
            translated_text = await loop.run_in_executor(None, translate_sync)
            print(f"Googletrans translation successful: {len(translated_text)} characters")
            return translated_text
            
        except Exception as e:
            print(f"Error using googletrans: {e}")
            return text
    
    async def _translate_with_google(self, text: str, source_language: str, target_language: str) -> str:
        """Translate text using Google Translate API"""
        # ... keep existing code (Google Translate API implementation)
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
        # ... keep existing code (Microsoft Translator implementation)
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
        # ... keep existing code (DeepL implementation)
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
        """
        # Convert to lowercase for consistency
        code = language_code.lower()
        
        # Special case mappings
        mappings = {
            "googletrans": {
                "chinese": "zh",
                "chinese_traditional": "zh-tw",
                "chinese_simplified": "zh-cn",
                "english": "en",
                "spanish": "es",
                "french": "fr",
                "german": "de",
                "japanese": "ja",
                "korean": "ko",
                "russian": "ru",
                "portuguese": "pt",
                "italian": "it",
                "dutch": "nl",
                "arabic": "ar",
                "hindi": "hi",
                "bengali": "bn",
                "turkish": "tr",
                "vietnamese": "vi",
                "thai": "th",
                "indonesian": "id",
                "greek": "el",
                "polish": "pl"
            },
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
    
    def get_available_services(self) -> List[str]:
        """Get list of available translation services"""
        services = ["none"]
        
        if GOOGLETRANS_AVAILABLE:
            services.append("googletrans")
            
        if self.google_api_key or self.fallback_api_key:
            services.append("google")
            
        if self.microsoft_api_key or self.fallback_api_key:
            services.append("microsoft")
            
        if self.deepl_api_key or self.fallback_api_key:
            services.append("deepl")
            
        return services
