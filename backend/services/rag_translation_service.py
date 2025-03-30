
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
from langchain_core.retrievers import BaseRetriever

# Local imports
from models.translation import Translation, TranslationStatus, ProcessingDetails
from services.file_service import FileService
from services.third_party_translation_service import ThirdPartyTranslationService
from services.user_settings_service import UserSettingsService
from services.web_translation_service import WebTranslationService
from services.tmx_service import TMXService
from services.global_config_service import GlobalConfigService
from services.siliconflow_service import SiliconFlowService

class RAGTranslationService:
    """
    Enhanced Translation Service with RAG and TMX support
    """
    
    def __init__(self):
        self.file_service = FileService()
        self.third_party_service = ThirdPartyTranslationService()
        self.user_settings_service = UserSettingsService()
        self.web_translation_service = WebTranslationService()
        self.tmx_service = TMXService()
        self.global_config = GlobalConfigService()
        
        # Load settings from global config
        config = self.global_config.get_config()
        translation_settings = config.get("translation_settings", {})
        
        self.chunk_size = translation_settings.get("chunk_size", 1000)
        self.chunk_overlap = translation_settings.get("chunk_overlap", 200)
        self.vector_store_path = os.getenv("VECTOR_STORE_PATH", "./vector_stores")
        self.default_model = config.get("llm_settings", {}).get("default_provider", "openai")
        self.allow_user_model_selection = os.getenv("ALLOW_USER_MODEL_SELECTION", "true").lower() == "true"
        self.rag_enabled = translation_settings.get("rag_enabled", True)
        
        os.makedirs(self.vector_store_path, exist_ok=True)
        
        # Initialize database if enabled
        if config.get("database_settings", {}).get("use_database", False):
            from models.database import init_db
            init_db()
    
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
        
        # Get provider-specific settings from global config
        llm_settings = self.global_config.get_llm_settings(provider)
        temperature = llm_settings.get("temperature", 0.1)
        
        if provider == "openai" or provider == "chatgpt":
            return ChatOpenAI(
                model=llm_settings.get("model", "gpt-4o"),
                temperature=temperature
            )
        elif provider == "anthropic" or provider == "claude":
            return ChatAnthropic(
                model_name=llm_settings.get("model", "claude-3-sonnet-20240229"),
                temperature=temperature
            )
        elif provider == "google" or provider == "vertex" or provider == "grok":
            return ChatVertexAI(
                model_name=llm_settings.get("model", "gemini-pro"),
                temperature=temperature
            )
        elif provider == "groq":
            return ChatGroq(
                model_name=llm_settings.get("model", "llama-3-70b-8192"),
                temperature=temperature
            )
        elif provider == "cohere":
            return ChatCohere(
                model=llm_settings.get("model", "command"),
                temperature=temperature
            )
        elif provider == "huggingface":
            return ChatHuggingFace(
                model_id=llm_settings.get("model", "mistralai/Mistral-7B-Instruct-v0.2"),
                temperature=temperature
            )
        elif provider == "deepseek":
            # Using LangChain's OpenAI interface with DeepSeek endpoint
            return ChatOpenAI(
                model=llm_settings.get("model", "deepseek-chat"),
                temperature=temperature,
                openai_api_base=os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
                openai_api_key=os.getenv("DEEPSEEK_API_KEY")
            )
        elif provider == "siliconflow":
            # For SiliconFlow, we need to use a custom wrapper since it's not directly supported by LangChain
            # Return a callable that mimics the LLM interface
            silicon_service = SiliconFlowService()
            
            class SiliconFlowWrapper:
                def invoke(self, messages):
                    # Extract the content from the messages
                    if isinstance(messages, list):
                        last_message = messages[-1]
                        if isinstance(last_message, dict):
                            content = last_message.get("content", "")
                        else:
                            content = str(last_message)
                    else:
                        content = str(messages)
                    
                    # Call SiliconFlow API
                    loop = asyncio.get_event_loop()
                    response = loop.run_until_complete(
                        silicon_service.generate_text(content)
                    )
                    return {"content": response}
            
            return SiliconFlowWrapper()
        else:
            # Default to OpenAI
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o"),
                temperature=temperature
            )
    
    async def process_translation_with_rag(
        self, 
        translation_id: str, 
        file_path: str, 
        target_language: str,
        original_filename: str,
        llm_provider: str = None,
        user_id: str = None
    ) -> None:
        """Enhanced translation processing with RAG and TMX support"""
        start_time = time.time()
        
        try:
            # Update status to processing
            self._update_translation_status(
                translation_id,
                TranslationStatus.PROCESSING,
                original_filename,
                target_language
            )
            
            # Initialize progress
            await self._update_progress(translation_id, 0.1)  # Start at 10%
            
            # 1. Extract text from file
            await self._update_progress(translation_id, 0.15)
            document_text = await self.file_service.extract_text(file_path)
            
            # 2. Detect source language
            await self._update_progress(translation_id, 0.2)
            source_language = await self._detect_language(document_text)
            
            # 3. Split text into chunks
            await self._update_progress(translation_id, 0.25)
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
            docs = text_splitter.create_documents([document_text])
            
            # 4. Check translation memory for similar content
            await self._update_progress(translation_id, 0.3)
            tm_matches = {}
            
            for i, doc in enumerate(docs):
                matches = await self.tmx_service.search_translation_memory(
                    doc.page_content,
                    source_language,
                    target_language,
                    threshold=0.7
                )
                
                if matches:
                    tm_matches[i] = matches[0]  # Store the best match
            
            # 5. Create vector embeddings and store
            await self._update_progress(translation_id, 0.4)
            store_dir = os.path.join(self.vector_store_path, translation_id)
            vector_store = await self._create_vector_store(docs, store_dir)
            
            # 6. Set up the translation agent with the selected LLM
            await self._update_progress(translation_id, 0.5)
            llm = self.get_llm(llm_provider, user_id)
            
            # 7. Process translation for each chunk
            await self._update_progress(translation_id, 0.6)
            translated_chunks = []
            
            for i, doc in enumerate(docs):
                # Check if we have a translation memory match
                if i in tm_matches:
                    match = tm_matches[i]
                    translated_text = match["target_text"]
                    
                    # Add TM metadata to the translated text
                    translated_chunks.append(f"{translated_text}\n")
                    
                    print(f"Using translation memory for chunk {i+1}/{len(docs)}, similarity: {match['similarity']:.2f}")
                    continue
                
                # Get similar documents for context
                similar_docs = []
                if self.rag_enabled and len(docs) > 1:
                    similar_docs = vector_store.similarity_search(doc.page_content, k=3)
                    
                # Create prompt with any available context
                context = "\n\n".join([d.page_content for d in similar_docs if d.page_content != doc.page_content])
                
                prompt = ChatPromptTemplate.from_template(
                    """You are a professional translator who specializes in translating from {source_language} to {target_language}.
                    
                    {context_instruction}
                    
                    Text to translate:
                    {text}
                    
                    Translate the above text maintaining the original formatting and meaning as closely as possible.
                    If there are any domain-specific terms, translate them accurately using the appropriate terminology in {target_language}.
                    """
                )
                
                context_instruction = ""
                if context:
                    context_instruction = f"""
                    Here is some related context that may help with the translation:
                    {context}
                    """
                
                # Process with LLM
                translation_chain = LLMChain(
                    llm=llm,
                    prompt=prompt,
                    output_parser=StrOutputParser()
                )
                
                translated_text = await translation_chain.ainvoke({
                    "source_language": source_language,
                    "target_language": target_language,
                    "text": doc.page_content,
                    "context_instruction": context_instruction
                })
                
                translated_chunks.append(translated_text)
                
                # Create translation memory entry
                await self.tmx_service.create_tmx_file(
                    [{
                        "source_text": doc.page_content,
                        "target_text": translated_text
                    }],
                    source_language,
                    target_language
                )
            
            # 8. Get web translation service based on user settings
            web_translation_service = None
            if user_id:
                web_translation_service = self.user_settings_service.get_web_translation_service(user_id)
            
            # 9. Call third-party API for verification/improvement, using web translation if configured
            await self._update_progress(translation_id, 0.8)
            final_translation = await self.third_party_service.enhance_translation(
                "\n\n".join(translated_chunks),
                source_language,
                target_language,
                web_translation_service
            )
            
            # 10. Save the translated document
            await self._update_progress(translation_id, 0.9)
            output_path = await self.file_service.save_translation(
                translation_id, 
                final_translation,
                original_filename
            )
            
            # 11. Update translation record with completion info
            processing_time = time.time() - start_time
            token_estimate = len(document_text) / 4  # Rough estimate
            confidence_score = self._calculate_confidence_score(
                source_language, 
                target_language, 
                len(docs),
                len(tm_matches)
            )
            
            # Determine which translation provider was used
            translation_provider = "third-party-api"
            if web_translation_service and web_translation_service != "none":
                translation_provider = web_translation_service
            
            processing_details = ProcessingDetails(
                engine="langchain-rag",
                model=llm_provider or self.default_model,
                vectorStore="faiss",
                documentChunks=len(docs),
                ragEnabled=self.rag_enabled,
                processingTime=processing_time,
                totalTokens=int(token_estimate),
                translationProvider=translation_provider,
                agentEnabled=True,
                confidenceScore=confidence_score
            )
            
            # Update status to completed
            self._update_translation_status(
                translation_id,
                TranslationStatus.COMPLETED,
                original_filename,
                target_language,
                f"/api/translation/download/{translation_id}",
                processing_details=processing_details
            )
            
            # Save metadata
            metadata = {
                "translation_id": translation_id,
                "source_language": source_language,
                "target_language": target_language,
                "original_filename": original_filename,
                "llm_provider": llm_provider or self.default_model,
                "web_translation_service": web_translation_service,
                "chunk_count": len(docs),
                "tm_match_count": len(tm_matches),
                "processing_time": processing_time,
                "confidence_score": confidence_score,
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            }
            
            await self.file_service.save_metadata(translation_id, metadata)
            
            # Final progress update
            await self._update_progress(translation_id, 1.0)
            
        except Exception as e:
            # Update status to failed
            error_message = str(e)
            self._update_translation_status(
                translation_id,
                TranslationStatus.FAILED,
                original_filename,
                target_language,
                error_message=error_message
            )
            
            # Save error metadata
            await self.file_service.save_metadata(translation_id, {
                "translation_id": translation_id,
                "status": "failed",
                "error": error_message,
                "timestamp": datetime.now().isoformat()
            })
    
    # Helper methods
    async def _update_progress(self, translation_id: str, progress: float) -> None:
        """Update the progress of a translation job"""
        pass  # Implement based on your storage mechanism
    
    async def _detect_language(self, text: str) -> str:
        """Detect the language of text"""
        # Use the third-party service's language detection
        result = await self.third_party_service.detect_language(text)
        return result.get("language", "english")
    
    async def _create_vector_store(self, docs: List[Document], store_dir: str) -> Any:
        """Create a vector store from documents"""
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="paraphrase-multilingual-MiniLM-L12-v2"
            )
            
            os.makedirs(store_dir, exist_ok=True)
            
            vector_store = FAISS.from_documents(docs, embeddings)
            vector_store.save_local(store_dir)
            
            return vector_store
        except Exception as e:
            print(f"Error creating vector store: {e}")
            # Fallback to simple retrieval if embeddings fail
            return None
    
    def _calculate_confidence_score(
        self, 
        source_language: str, 
        target_language: str, 
        chunk_count: int,
        tm_match_count: int = 0
    ) -> float:
        """Calculate a confidence score for the translation"""
        # Base score
        score = 0.8
        
        # Adjust for document complexity
        if chunk_count > 20:
            score -= 0.05  # Larger documents might have more translation inconsistencies
        
        # Adjust for translation memory matches
        if tm_match_count > 0:
            tm_coverage = tm_match_count / chunk_count if chunk_count > 0 else 0
            score += tm_coverage * 0.15  # Boost confidence based on TM coverage
        
        # Adjust based on language pair complexity
        complex_pairs = [
            ['japanese', 'english'],
            ['chinese', 'english'],
            ['arabic', 'english'],
            ['english', 'japanese'],
            ['english', 'chinese'],
            ['english', 'arabic']
        ]
        
        if [source_language, target_language] in complex_pairs:
            score -= 0.1
        
        # Ensure score is between 0 and 1
        return max(0, min(1, score))
    
    def _update_translation_status(
        self,
        translation_id: str,
        status: TranslationStatus,
        original_filename: str,
        target_language: str,
        download_url: str = None,
        processing_details: ProcessingDetails = None,
        error_message: str = None
    ) -> None:
        """Update translation status in database"""
        # This would update the database in a real implementation
        # For now, use an in-memory store as in the original code
        from services.translation_service import translations_db
        
        translations_db[translation_id] = Translation(
            id=translation_id,
            originalFileName=original_filename,
            targetLanguage=target_language,
            status=status,
            downloadUrl=download_url,
            createdAt=translations_db.get(translation_id, {}).get("createdAt", datetime.now().isoformat()),
            processingDetails=processing_details,
            errorMessage=error_message
        )
        
        # If database is enabled, also update it
        db_settings = self.global_config.get_database_settings()
        if db_settings.get("use_database", False):
            try:
                from models.database import get_session
                from models.database import Translation as DBTranslation
                
                with get_session() as session:
                    db_translation = session.query(DBTranslation).filter(DBTranslation.id == translation_id).first()
                    
                    if db_translation:
                        db_translation.status = status.value
                        db_translation.download_url = download_url
                        db_translation.error_message = error_message
                        
                        if status == TranslationStatus.COMPLETED:
                            db_translation.completed_at = datetime.utcnow()
                            
                            if processing_details:
                                db_translation.llm_provider = processing_details.model
                                db_translation.web_translation_service = processing_details.translationProvider
                                db_translation.processing_time = processing_details.processingTime
                                db_translation.total_tokens = processing_details.totalTokens
                                db_translation.confidence_score = processing_details.confidenceScore
                                
                                # Store additional details in metadata
                                metadata = db_translation.metadata or {}
                                metadata.update({
                                    "engine": processing_details.engine,
                                    "vectorStore": processing_details.vectorStore,
                                    "documentChunks": processing_details.documentChunks,
                                    "ragEnabled": processing_details.ragEnabled,
                                    "agentEnabled": processing_details.agentEnabled
                                })
                                db_translation.metadata = metadata
                    else:
                        # Create new record
                        new_translation = DBTranslation(
                            id=translation_id,
                            original_file_name=original_filename,
                            target_language=target_language,
                            status=status.value,
                            download_url=download_url,
                            error_message=error_message,
                            created_at=datetime.utcnow()
                        )
                        session.add(new_translation)
                        
                    session.commit()
            except Exception as e:
                print(f"Error updating database: {e}")
    
    async def get_translation_status(self, translation_id: str) -> Dict[str, Any]:
        """Get the status of a translation job"""
        # For compatibility with original implementation
        from services.translation_service import translations_db, progress_tracker
        
        translation = translations_db.get(translation_id)
        if not translation:
            return None
            
        progress = progress_tracker.get(translation_id, 0)
        
        return {
            "id": translation_id,
            "status": translation.status.value,
            "progress": progress,
            "downloadUrl": translation.downloadUrl
        }
    
    async def get_translation_file(self, translation_id: str) -> str:
        """Get the file path for a completed translation"""
        return await self.file_service.get_translation_path(translation_id)
    
    async def get_all_translations(self) -> List[Dict[str, Any]]:
        """Get all translation jobs"""
        # For compatibility with original implementation
        from services.translation_service import translations_db
        
        return [t.dict() for t in translations_db.values()]
        
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
