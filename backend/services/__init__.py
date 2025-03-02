
"""
Backend Services Package

This package contains the core services for the document translation backend:

1. TranslationService - Main service that orchestrates the document translation process
   using Langchain, DeepSeek LLM, RAG, and third-party translation API

2. FileService - Handles file operations such as saving uploads, extracting text,
   and saving translated documents

3. ThirdPartyTranslationService - Integrates with external translation APIs
   for additional verification or enhancement of translations

Usage:
    from services.translation_service import TranslationService
    from services.file_service import FileService
    
    translation_service = TranslationService()
    file_service = FileService()
"""

# Package initialization
# Individual services are imported directly from their modules
