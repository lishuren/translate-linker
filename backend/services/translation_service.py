
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
from langchain_openai import ChatOpenAI  # For DeepSeek LLM
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
    """Service for handling document translations using LangChain"""
    
    def __init__(self):
        self.file_service = FileService()
        self.third_party_service = ThirdPartyTranslationService()
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 1000))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 200))
        self.vector_store_path = os.getenv("VECTOR_STORE_PATH", "./vector_stores")
        os.makedirs(self.vector_store_path, exist_ok=True)
    
    async def process_translation(
        self, 
        translation_id: str, 
        file_path: str, 
        target_language: str,
        original_filename: str
    ) -> None:
        """Process a document translation using LangChain and DeepSeek LLM"""
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
            
            # 5. Set up the translation agent with DeepSeek LLM
            await self._update_progress(translation_id, 0.6)  # 60%
            translation_agent = await self._setup_translation_agent(
                source_language, 
                target_language,
                vector_store
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
                model="deepseek-coder",
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
        """Update the progress of a translation job"""
        progress_tracker[translation_id] = progress
    
    def _detect_language(self, text: str) -> str:
        """Detect the language of the input text (mock implementation)"""
        # This would be replaced with a real language detection service
        # For now, we'll just assume it's English
        return "english"
    
    async def _create_vector_store(self, docs: List[Document], store_dir: str) -> Any:
        """Create a vector store from documents"""
        # In a real implementation, this would use the actual DeepSeek embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Create FAISS vector store
        vector_store = FAISS.from_documents(docs, embeddings)
        
        # Save vector store for future use
        vector_store.save_local(store_dir)
        
        return vector_store
    
    async def _setup_translation_agent(self, source_language: str, target_language: str, vector_store: Any) -> Any:
        """Set up the LangChain agent for translation"""
        # In a real implementation, this would use the actual DeepSeek API
        llm = ChatOpenAI(
            model="gpt-3.5-turbo",  # Replace with DeepSeek model in production
            temperature=0.1
        )
        
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
    
    async def _translate_with_agent(
        self, 
        agent: Any, 
        docs: List[Document], 
        source_language: str,
        target_language: str
    ) -> List[str]:
        """Translate document chunks using the agent"""
        translated_chunks = []
        
        for i, doc in enumerate(docs):
            # In a real implementation, we would use the agent to translate each chunk
            # For this demo, we'll simulate the translation
            try:
                # This would be replaced with actual agent calls
                # translated_chunk = agent.run(f"Translate this text from {source_language} to {target_language}: {doc.page_content}")
                
                # Simulate translation for now
                translated_chunk = f"[Translated content {i+1} in {target_language}]: {doc.page_content[:50]}..."
                translated_chunks.append(translated_chunk)
                
                # Update progress proportionally
                progress = 0.7 + (0.1 * (i / len(docs)))
                await self._update_progress(docs[0].metadata.get('translation_id', 'unknown'), progress)
                
            except Exception as e:
                print(f"Error translating chunk {i}: {str(e)}")
                # Add a placeholder for the failed chunk
                translated_chunks.append(f"[Translation error for chunk {i+1}]")
        
        return translated_chunks
    
    def _calculate_confidence_score(self, source_language: str, target_language: str, chunk_count: int) -> float:
        """Calculate a confidence score for the translation"""
        # Base score
        score = 0.85
        
        # Adjust for language complexity
        complex_pairs = [
            ('japanese', 'english'),
            ('chinese', 'english'),
            ('arabic', 'english'),
            ('english', 'japanese'),
            ('english', 'chinese'),
            ('english', 'arabic')
        ]
        
        lang_pair = (source_language.lower(), target_language.lower())
        if lang_pair in complex_pairs:
            score -= 0.1  # Reduce score for complex language pairs
        
        # Adjust for document length
        if chunk_count > 20:
            score -= 0.05  # Longer documents have more room for error
        
        return max(0.0, min(1.0, score))  # Ensure score is between 0 and 1
    
    async def get_translation_status(self, translation_id: str) -> Optional[Dict]:
        """Get the status of a translation job"""
        if translation_id not in translations_db:
            return None
        
        translation = translations_db[translation_id]
        progress = progress_tracker.get(translation_id, 0.0)
        
        return {
            "id": translation.id,
            "status": translation.status,
            "progress": progress,
            "downloadUrl": translation.downloadUrl,
            "errorMessage": translation.errorMessage
        }
    
    async def get_translation_file(self, translation_id: str) -> Optional[str]:
        """Get the path to a translated file"""
        if translation_id not in translations_db:
            return None
        
        translation = translations_db[translation_id]
        if translation.status != TranslationStatus.COMPLETED:
            return None
        
        # Find the translation file
        for filename in os.listdir(FileService.TRANSLATIONS_DIR):
            if filename.startswith(f"{translation_id}_"):
                return os.path.join(FileService.TRANSLATIONS_DIR, filename)
        
        return None
    
    async def get_all_translations(self) -> List[Dict]:
        """Get all translations"""
        return [translation.dict() for translation in translations_db.values()]
