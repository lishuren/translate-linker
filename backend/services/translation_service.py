import os
import json
import time
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_vertexai import ChatVertexAI
from langchain_groq import ChatGroq
from langchain_cohere import ChatCohere
from langchain_huggingface import ChatHuggingFace
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.chains import LLMChain
from langchain.agents import initialize_agent, Tool, AgentType

# Local imports
from models.translation import Translation, TranslationStatus, ProcessingDetails
from models.api_key import APIKeySettings
from services.file_service import FileService
from services.third_party_translation_service import ThirdPartyTranslationService
from services.user_settings_service import UserSettingsService
from services.web_translation_service import WebTranslationService

# Status and metadata storage (would be a database in production)
translations_db = {}
progress_tracker = {}

class TranslationService:
    """Service for handling document translations using LangChain with multiple LLM providers"""
    
    def __init__(self):
        self.file_service = FileService()
        self.third_party_service = ThirdPartyTranslationService()
        self.user_settings_service = UserSettingsService()
        self.web_translation_service = WebTranslationService()
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 1000))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 200))
        self.vector_store_path = os.getenv("VECTOR_STORE_PATH", "./vector_stores")
        self.default_model = os.getenv("DEFAULT_LLM_MODEL", "openai")
        self.allow_user_model_selection = os.getenv("ALLOW_USER_MODEL_SELECTION", "true").lower() == "true"
        self.api_keys = APIKeySettings.from_env()
        os.makedirs(self.vector_store_path, exist_ok=True)
    
    def get_llm(self, provider: str = None, user_id: Optional[str] = None):
        """
        Get LLM instance based on provider and user settings
        Supports: openai, anthropic, google, groq, cohere, huggingface, deepseek, siliconflow
        """
        # If user_id is provided and model selection is controlled by backend, 
        # override the provided provider with the user's configured provider
        if user_id and not self.user_settings_service.is_model_selection_allowed(user_id):
            provider = self.user_settings_service.get_user_llm_provider(user_id)
        
        # If no provider specified, use default
        provider = provider or self.default_model
        provider = provider.lower()
        
        # Get API key for the selected provider
        api_key = self.api_keys.get_key_for_provider(provider)
        
        # If we don't have an API key for the provider, default to a provider we do have
        if not api_key:
            print(f"Warning: No API key for provider {provider}. Using default provider.")
            provider = self.default_model
            api_key = self.api_keys.get_key_for_provider(provider)
            
            # If we still don't have a key, try each provider in turn
            if not api_key:
                for test_provider in ["openai", "anthropic", "google", "groq", "cohere", "huggingface", "deepseek", "siliconflow"]:
                    test_key = self.api_keys.get_key_for_provider(test_provider)
                    if test_key:
                        provider = test_provider
                        api_key = test_key
                        print(f"Using {provider} as fallback provider with available API key")
                        break
        
        if not api_key:
            raise ValueError(f"No API keys configured for any provider. Please configure at least one LLM provider API key.")
        
        try:
            if provider == "openai" or provider == "chatgpt":
                return ChatOpenAI(
                    model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    openai_api_key=api_key
                )
            elif provider == "anthropic" or provider == "claude":
                return ChatAnthropic(
                    model_name=os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-sonnet-20240229"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    anthropic_api_key=api_key
                )
            elif provider == "google" or provider == "vertex" or provider == "grok":
                return ChatVertexAI(
                    model_name=os.getenv("GOOGLE_MODEL_NAME", "gemini-pro"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    google_api_key=api_key
                )
            elif provider == "groq":
                return ChatGroq(
                    model_name=os.getenv("GROQ_MODEL_NAME", "llama-3-70b-8192"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    groq_api_key=api_key
                )
            elif provider == "cohere":
                return ChatCohere(
                    model=os.getenv("COHERE_MODEL_NAME", "command"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    cohere_api_key=api_key
                )
            elif provider == "huggingface":
                return ChatHuggingFace(
                    model_id=os.getenv("HUGGINGFACE_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    huggingfacehub_api_token=api_key
                )
            elif provider == "deepseek":
                # Using LangChain's OpenAI interface with DeepSeek endpoint
                return ChatOpenAI(
                    model=os.getenv("DEEPSEEK_MODEL_NAME", "deepseek-chat"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    openai_api_base=os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
                    openai_api_key=api_key
                )
            elif provider == "siliconflow":
                # Using OpenAI interface with SiliconFlow endpoint
                return ChatOpenAI(
                    model=os.getenv("SILICONFLOW_MODEL_NAME", "siliconflow-1"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    openai_api_base=os.getenv("SILICONFLOW_API_BASE", "https://api.siliconflow.net/v1"),
                    openai_api_key=api_key
                )
            else:
                # Default to OpenAI
                return ChatOpenAI(
                    model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o"),
                    temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                    openai_api_key=self.api_keys.get_key_for_provider("openai")
                )
        except Exception as e:
            print(f"Error initializing {provider} LLM: {str(e)}")
            raise ValueError(f"Failed to initialize {provider} LLM: {str(e)}")
    
    async def process_translation(
        self, 
        translation_id: str, 
        file_path: str, 
        target_language: str,
        original_filename: str,
        llm_provider: str = None,
        user_id: str = None
    ) -> None:
        """Process a document translation using LangChain and selected LLM provider"""
        start_time = time.time()
        
        try:
            # Update status to processing
            translations_db[translation_id] = Translation(
                id=translation_id,
                originalFileName=original_filename,
                targetLanguage=target_language,
                status=TranslationStatus.PROCESSING,
                createdAt=datetime.now().isoformat()
            )
            
            # Initialize progress
            progress_tracker[translation_id] = 0.1  # Start at 10%
            
            # 1. Extract text from file
            await self._update_progress(translation_id, 0.2)  # 20%
            document_text = await self.file_service.extract_text(file_path)
            
            # 2. Detect source language (normally would use a real detection service)
            await self._update_progress(translation_id, 0.3)  # 30%
            source_language = self._detect_language(document_text)
            
            # 3. Split text into chunks
            await self._update_progress(translation_id, 0.4)  # 40%
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
            docs = text_splitter.create_documents([document_text])
            
            # 4. Create vector embeddings and store
            await self._update_progress(translation_id, 0.5)  # 50%
            store_dir = os.path.join(self.vector_store_path, translation_id)
            vector_store = await self._create_vector_store(docs, store_dir)
            
            # 5. Set up the translation agent with the selected LLM, respecting user settings
            await self._update_progress(translation_id, 0.6)  # 60%
            
            try:
                llm = self.get_llm(llm_provider, user_id)
                translation_agent = await self._setup_translation_agent(
                    source_language, 
                    target_language,
                    vector_store,
                    llm
                )
            except Exception as llm_error:
                # Log the error and set failed status
                error_message = f"LLM initialization failed: {str(llm_error)}"
                print(error_message)
                
                # Update the translation status in the database
                translations_db[translation_id] = Translation(
                    id=translation_id,
                    originalFileName=original_filename,
                    targetLanguage=target_language,
                    status=TranslationStatus.FAILED,
                    createdAt=translations_db[translation_id].createdAt,
                    errorMessage=error_message
                )
                
                # Save error metadata
                await self.file_service.save_metadata(translation_id, {
                    "translation_id": translation_id,
                    "status": "failed",
                    "error": error_message,
                    "llm_provider": llm_provider or self.default_model,
                    "timestamp": datetime.now().isoformat()
                })
                
                return
            
            # 6. Process translation
            await self._update_progress(translation_id, 0.7)  # 70%
            translated_chunks = await self._translate_with_agent(
                translation_agent, 
                docs, 
                source_language,
                target_language
            )
            
            # 7. Get web translation service based on user settings
            web_translation_service = None
            if user_id:
                web_translation_service = self.user_settings_service.get_web_translation_service(user_id)
            
            # 8. Call third-party API for verification/improvement, using web translation if configured
            await self._update_progress(translation_id, 0.8)  # 80%
            final_translation = await self.third_party_service.enhance_translation(
                "\n\n".join(translated_chunks),
                source_language,
                target_language,
                web_translation_service
            )
            
            # 9. Save the translated document
            await self._update_progress(translation_id, 0.9)  # 90%
            output_path = await self.file_service.save_translation(
                translation_id, 
                final_translation,
                original_filename
            )
            
            # 10. Calculate processing stats
            processing_time = time.time() - start_time
            token_estimate = len(document_text) / 4  # Rough estimate
            confidence_score = self._calculate_confidence_score(
                source_language, 
                target_language, 
                len(docs)
            )
            
            # Determine which translation provider was used
            translation_provider = "third-party-api"
            if web_translation_service and web_translation_service != "none":
                translation_provider = web_translation_service
            
            # 11. Update translation record
            processing_details = ProcessingDetails(
                engine="langchain",
                model=llm_provider or self.default_model,
                vectorStore="faiss",
                documentChunks=len(docs),
                ragEnabled=True,
                processingTime=processing_time,
                totalTokens=int(token_estimate),
                translationProvider=translation_provider,
                agentEnabled=True,
                confidenceScore=confidence_score
            )
            
            # Update status to completed
            translations_db[translation_id] = Translation(
                id=translation_id,
                originalFileName=original_filename,
                targetLanguage=target_language,
                status=TranslationStatus.COMPLETED,
                downloadUrl=f"/api/translation/download/{translation_id}",
                createdAt=translations_db[translation_id].createdAt,
                processingDetails=processing_details
            )
            
            # Final progress update
            await self._update_progress(translation_id, 1.0)  # 100%
            
            # Save metadata for future reference
            await self.file_service.save_metadata(translation_id, {
                "translation_id": translation_id,
                "source_language": source_language,
                "target_language": target_language,
                "original_filename": original_filename,
                "llm_provider": llm_provider or self.default_model,
                "web_translation_service": web_translation_service,
                "chunk_count": len(docs),
                "processing_time": processing_time,
                "confidence_score": confidence_score,
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            # Update status to failed
            error_message = str(e)
            translations_db[translation_id] = Translation(
                id=translation_id,
                originalFileName=original_filename,
                targetLanguage=target_language,
                status=TranslationStatus.FAILED,
                createdAt=translations_db[translation_id].createdAt if translation_id in translations_db else datetime.now().isoformat(),
                errorMessage=error_message
            )
            
            # Save error metadata
            await self.file_service.save_metadata(translation_id, {
                "translation_id": translation_id,
                "status": "failed",
                "error": error_message,
                "timestamp": datetime.now().isoformat()
            })
    
    async def _update_progress(self, translation_id: str, progress: float) -> None:
        """Update the progress of a translation task"""
        progress_tracker[translation_id] = progress
        # In a real implementation, this might send updates to clients via websockets
    
    async def _update_translation_status(
        self, 
        translation_id: str, 
        status: TranslationStatus, 
        download_url: str = None,
        error_message: str = None,
        processing_details: ProcessingDetails = None
    ) -> None:
        """Update the status of a translation"""
        if translation_id not in translations_db:
            # Initialize translation if it doesn't exist
            translations_db[translation_id] = Translation(
                id=translation_id,
                originalFileName="unknown",
                targetLanguage="unknown",
                status=status,
                createdAt=datetime.now().isoformat()
            )
        
        # Update existing translation
        translation = translations_db[translation_id]
        
        # Create updated translation with new status
        translations_db[translation_id] = Translation(
            id=translation_id,
            originalFileName=translation.originalFileName,
            targetLanguage=translation.targetLanguage,
            status=status,
            downloadUrl=download_url,
            createdAt=translation.createdAt,
            errorMessage=error_message,
            processingDetails=processing_details
        )
    
    def _detect_language(self, text: str) -> str:
        """
        Detect the language of the text
        This is a placeholder for real language detection
        """
        # Simple language detection logic for demo
        # In a real implementation, would use langdetect or similar
        
        word_count = len(text.split())
        if word_count < 10:
            return "en"  # Default to English for very short texts
        
        # Count common words in different languages to guess
        en_words = ["the", "and", "to", "of", "in", "is", "that"]
        es_words = ["el", "la", "de", "en", "y", "es", "que"]
        fr_words = ["le", "la", "de", "et", "en", "est", "que"]
        
        en_count = sum(1 for word in text.lower().split() if word in en_words)
        es_count = sum(1 for word in text.lower().split() if word in es_words)
        fr_count = sum(1 for word in text.lower().split() if word in fr_words)
        
        if en_count > es_count and en_count > fr_count:
            return "en"
        elif es_count > en_count and es_count > fr_count:
            return "es"
        elif fr_count > en_count and fr_count > es_count:
            return "fr"
        else:
            return "en"  # Default to English if unsure
    
    async def _create_vector_store(self, docs: List[Document], store_dir: str) -> Any:
        """Create a vector store from documents for RAG"""
        os.makedirs(store_dir, exist_ok=True)
        
        # Use HuggingFace embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
        # Create vector store
        vector_store = FAISS.from_documents(docs, embeddings)
        
        # Save the vector store for future use
        vector_store.save_local(store_dir)
        
        return vector_store
    
    async def _translate_with_agent(
        self, 
        agent: Any, 
        docs: List[Document],
        source_language: str,
        target_language: str
    ) -> List[str]:
        """Translate document chunks using the translation agent"""
        translated_chunks = []
        
        for chunk in docs:
            # Create a prompt for the agent
            prompt = f"""
            Translate the following text from {source_language} to {target_language}.
            Maintain the original formatting as much as possible.
            Text to translate: {chunk.page_content}
            """
            
            # Use the agent to translate
            result = await asyncio.to_thread(
                agent.run,
                prompt
            )
            
            translated_chunks.append(result)
        
        return translated_chunks
    
    def _calculate_confidence_score(self, source_language: str, target_language: str, chunk_count: int) -> float:
        """Calculate a confidence score for the translation"""
        # Simple confidence score calculation for demo
        # In a real implementation, would use more sophisticated metrics
        
        base_score = 0.85  # Start with a base confidence
        
        # Adjust based on language pair
        common_pairs = [("en", "es"), ("en", "fr"), ("en", "de"), ("en", "it")]
        if (source_language, target_language) in common_pairs or (target_language, source_language) in common_pairs:
            base_score += 0.05
        
        # Adjust based on document size
        if chunk_count < 5:
            base_score += 0.05
        elif chunk_count > 20:
            base_score -= 0.05
        
        return min(0.99, max(0.5, base_score))  # Keep between 0.5 and 0.99
    
    async def get_translation_status(self, translation_id: str) -> Dict[str, Any]:
        """Get the status of a translation task"""
        if translation_id in translations_db:
            translation = translations_db[translation_id]
            progress = progress_tracker.get(translation_id, 0)
            
            return {
                "translation": translation.dict(),
                "progress": progress
            }
        return None
    
    async def get_translation_file(self, translation_id: str) -> Optional[str]:
        """Get the path to the translated file"""
        # Check if translation exists and is completed
        if (translation_id in translations_db and 
            translations_db[translation_id].status == TranslationStatus.COMPLETED):
            
            # Get the original filename
            original_filename = translations_db[translation_id].originalFileName
            
            # Build the path to the translated file
            return os.path.join("translations", f"{translation_id}_{original_filename}")
        
        return None
    
    async def get_all_translations(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all translations, optionally filtered by user ID"""
        all_translations = []
        
        for t_id, translation in translations_db.items():
            # In a real implementation, would filter by user_id in database query
            all_translations.append(translation.dict())
        
        # Sort by creation date, newest first
        all_translations.sort(key=lambda t: t.get('createdAt', ''), reverse=True)
        
        return all_translations
    
    async def is_model_selection_allowed(self, user_id: Optional[str] = None) -> bool:
        """Check if the user is allowed to select LLM models"""
        if user_id:
            return self.user_settings_service.is_model_selection_allowed(user_id)
        return self.allow_user_model_selection
    
    async def get_available_web_translation_services(self) -> List[str]:
        """Get a list of available web translation services"""
        services = ["none"]
        
        if os.getenv("GOOGLE_TRANSLATE_API_KEY"):
            services.append("google")
            
        if os.getenv("MICROSOFT_TRANSLATOR_API_KEY"):
            services.append("microsoft")
            
        if os.getenv("DEEPL_API_KEY"):
            services.append("deepl")
            
        return services

    async def _setup_translation_agent(self, source_language: str, target_language: str, vector_store: Any, llm: Any) -> Any:
        """Set up the LangChain agent for translation using the provided LLM"""
        # Create a translation chain
        translation_prompt = ChatPromptTemplate.from_template(
            """You are a professional translator who specializes in translating from {source_language} to {target_language}.
            
            Text to translate:
            {text}
            
            Translate the above text maintaining the original formatting and meaning as closely as possible.
            If there are any domain-specific terms, translate them accurately using the appropriate terminology in {target_language}.
            """
        )
        
        translation_chain = LLMChain(
            llm=llm,
            prompt=translation_prompt,
            output_parser=StrOutputParser()
        )
        
        # Create tools for the agent
        tools = [
            Tool(
                name="Similarity Search",
                func=lambda query: vector_store.similarity_search(query, k=3),
                description=f"Search for similar content to provide context for translation from {source_language} to {target_language}"
            ),
            Tool(
                name="Translate Text",
                func=lambda text: translation_chain.invoke({"source_language": source_language, "target_language": target_language, "text": text}),
                description=f"Translate text from {source_language} to {target_language}"
            )
        ]
        
        # Initialize agent
        agent = initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True
        )
        
        return agent
