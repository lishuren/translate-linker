
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
from services.file_service import FileService
from services.third_party_translation_service import ThirdPartyTranslationService

# Status and metadata storage (would be a database in production)
translations_db = {}
progress_tracker = {}

class TranslationService:
    """Service for handling document translations using LangChain with multiple LLM providers"""
    
    def __init__(self):
        self.file_service = FileService()
        self.third_party_service = ThirdPartyTranslationService()
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 1000))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 200))
        self.vector_store_path = os.getenv("VECTOR_STORE_PATH", "./vector_stores")
        self.default_model = os.getenv("DEFAULT_LLM_MODEL", "openai")
        os.makedirs(self.vector_store_path, exist_ok=True)
    
    def get_llm(self, provider: str = None):
        """
        Get LLM instance based on provider
        Supports: openai, anthropic, google, groq, cohere, huggingface, deepseek
        """
        provider = provider or self.default_model
        provider = provider.lower()
        
        if provider == "openai" or provider == "chatgpt":
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "anthropic" or provider == "claude":
            return ChatAnthropic(
                model_name=os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-sonnet-20240229"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "google" or provider == "vertex" or provider == "grok":
            return ChatVertexAI(
                model_name=os.getenv("GOOGLE_MODEL_NAME", "gemini-pro"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "groq":
            return ChatGroq(
                model_name=os.getenv("GROQ_MODEL_NAME", "llama-3-70b-8192"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "cohere":
            return ChatCohere(
                model=os.getenv("COHERE_MODEL_NAME", "command"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "huggingface":
            return ChatHuggingFace(
                model_id=os.getenv("HUGGINGFACE_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
        elif provider == "deepseek":
            # Using LangChain's OpenAI interface with DeepSeek endpoint
            return ChatOpenAI(
                model=os.getenv("DEEPSEEK_MODEL_NAME", "deepseek-chat"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1)),
                openai_api_base=os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
                openai_api_key=os.getenv("DEEPSEEK_API_KEY")
            )
        else:
            # Default to OpenAI
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.1))
            )
    
    async def process_translation(
        self, 
        translation_id: str, 
        file_path: str, 
        target_language: str,
        original_filename: str,
        llm_provider: str = None
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
            
            # 5. Set up the translation agent with the selected LLM
            await self._update_progress(translation_id, 0.6)  # 60%
            llm = self.get_llm(llm_provider)
            translation_agent = await self._setup_translation_agent(
                source_language, 
                target_language,
                vector_store,
                llm
            )
            
            # 6. Process translation
            await self._update_progress(translation_id, 0.7)  # 70%
            translated_chunks = await self._translate_with_agent(
                translation_agent, 
                docs, 
                source_language,
                target_language
            )
            
            # 7. Call third-party API for verification/improvement
            await self._update_progress(translation_id, 0.8)  # 80%
            final_translation = await self.third_party_service.enhance_translation(
                "\n\n".join(translated_chunks),
                source_language,
                target_language
            )
            
            # 8. Save the translated document
            await self._update_progress(translation_id, 0.9)  # 90%
            output_path = await self.file_service.save_translation(
                translation_id, 
                final_translation,
                original_filename
            )
            
            # 9. Calculate processing stats
            processing_time = time.time() - start_time
            token_estimate = len(document_text) / 4  # Rough estimate
            confidence_score = self._calculate_confidence_score(
                source_language, 
                target_language, 
                len(docs)
            )
            
            # 10. Update translation record
            processing_details = ProcessingDetails(
                engine="langchain",
                model=llm_provider or self.default_model,
                vectorStore="faiss",
                documentChunks=len(docs),
                ragEnabled=True,
                processingTime=processing_time,
                totalTokens=int(token_estimate),
                translationProvider="third-party-api",
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
    
    # ... keep existing code (methods like _update_progress, _detect_language, etc.)
    
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
    
    # ... keep existing code (all other existing methods)
