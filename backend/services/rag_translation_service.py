
import os
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.agents import initialize_agent, Tool, AgentType

from services.translation_service import TranslationService, translations_db, progress_tracker
from services.file_service import FileService
from services.chroma_service import chroma_service
from services.tmx_service import TMXService
from models.translation import Translation, TranslationStatus, ProcessingDetails

class RAGTranslationService:
    """Service for processing translations with RAG capabilities"""
    
    def __init__(self):
        self.translation_service = TranslationService()
        self.file_service = FileService()
        self.tmx_service = TMXService()
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 1000))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 200))
    
    async def process_translation_with_rag(
        self, 
        translation_id: str, 
        file_path: str, 
        target_language: str,
        original_filename: str,
        llm_provider: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """Process a document translation using RAG"""
        start_time = time.time()
        
        try:
            # Update status and progress
            progress_tracker[translation_id] = 0.1
            
            # Create initial translation record if it doesn't exist
            if translation_id not in translations_db:
                translations_db[translation_id] = Translation(
                    id=translation_id,
                    originalFileName=original_filename,
                    targetLanguage=target_language,
                    status=TranslationStatus.PROCESSING,
                    createdAt=datetime.now().isoformat()
                )
            
            # 1. Extract text from file
            progress_tracker[translation_id] = 0.2
            document_text = await self.file_service.extract_text(file_path)
            
            # 2. Detect source language
            progress_tracker[translation_id] = 0.3
            source_language = self.translation_service._detect_language(document_text)
            
            # 3. Split text into chunks
            progress_tracker[translation_id] = 0.4
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
            docs = text_splitter.create_documents([document_text])
            
            # 4. Get LLM
            llm = self.translation_service.get_llm(llm_provider, user_id)
            
            # 5. Set up ChromaDB for RAG
            progress_tracker[translation_id] = 0.5
            
            # Get user's Chroma collection
            user_chroma_id = user_id if user_id else "default"
            chroma_db = chroma_service.create_or_get_collection(user_chroma_id)
            
            # 6. Get relevant translation memory from ChromaDB
            progress_tracker[translation_id] = 0.6
            
            # 7. Create translation tool with RAG augmentation
            translation_tool = self._create_rag_translation_tool(
                source_language, 
                target_language,
                llm,
                user_chroma_id
            )
            
            # 8. Process translation
            progress_tracker[translation_id] = 0.7
            translated_chunks = []
            
            for i, doc in enumerate(docs):
                # Get similar translations from RAG
                similar_translations = chroma_service.search_similar_translations(
                    user_chroma_id,
                    doc.page_content,
                    source_language,
                    target_language,
                    k=3
                )
                
                # Create context from similar translations
                context = ""
                if similar_translations:
                    context = "Reference translations:\n"
                    for j, trans in enumerate(similar_translations):
                        context += f"{j+1}. {trans['content']}\n"
                
                # Translate with RAG context
                translated_chunk = translation_tool({
                    "text": doc.page_content,
                    "context": context
                })
                
                translated_chunks.append(translated_chunk)
                
                # Update progress for each chunk
                progress = 0.7 + (0.2 * ((i + 1) / len(docs)))
                progress_tracker[translation_id] = progress
            
            # 9. Combine translated chunks
            final_translation = "\n\n".join(translated_chunks)
            
            # 10. Save the translated document
            output_path = await self.file_service.save_translation(
                translation_id, 
                final_translation,
                original_filename
            )
            
            # 11. Store translations in RAG
            # Save the chunks in ChromaDB for future use
            source_chunks = [doc.page_content for doc in docs]
            chroma_service.add_translations_to_rag(
                user_chroma_id,
                source_chunks,
                translated_chunks,
                source_language,
                target_language,
                [{"translation_id": translation_id} for _ in docs]
            )
            
            # 12. Calculate processing stats
            processing_time = time.time() - start_time
            confidence_score = self.translation_service._calculate_confidence_score(
                source_language,
                target_language,
                len(docs)
            )
            
            # 13. Save translation memory as TMX
            tmx_path = os.path.join("tmx_files", f"{translation_id}.tmx")
            if len(source_chunks) > 0:
                self.tmx_service.create_tmx_file(
                    source_chunks,
                    translated_chunks,
                    source_language,
                    target_language,
                    original_filename,
                    tmx_path
                )
            
            # 14. Update translation record
            processing_details = ProcessingDetails(
                engine="langchain",
                model=llm_provider or self.translation_service.default_model,
                vectorStore="chroma",
                documentChunks=len(docs),
                ragEnabled=True,
                processingTime=processing_time,
                totalTokens=int(len(document_text) / 4),  # Rough estimate
                translationProvider="rag",
                agentEnabled=True,
                confidenceScore=confidence_score
            )
            
            # Update the translation status in the database
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
            progress_tracker[translation_id] = 1.0
            
            # Save metadata
            await self.file_service.save_metadata(translation_id, {
                "translation_id": translation_id,
                "source_language": source_language,
                "target_language": target_language,
                "user_id": user_id,
                "rag_enabled": True,
                "chunk_count": len(docs),
                "processing_time": processing_time,
                "tmx_path": tmx_path,
                "vector_store": "chroma",
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
    
    def _create_rag_translation_tool(
        self,
        source_language: str,
        target_language: str,
        llm: Any,
        user_id: str
    ):
        """Create a translation tool enhanced with RAG"""
        # Create prompt template with RAG context
        rag_translation_prompt = ChatPromptTemplate.from_template("""
        You are a professional translator specializing in {source_language} to {target_language} translations.

        {context}

        Source text to translate:
        {text}

        Translate the source text from {source_language} to {target_language}.
        Maintain the original formatting and meaning as closely as possible.
        If there are domain-specific terms, translate them accurately using the appropriate terminology.
        Use the reference translations only as a guide for terminology and style consistency.
        """)
        
        # Create chain
        translation_chain = LLMChain(
            llm=llm,
            prompt=rag_translation_prompt,
            output_parser=StrOutputParser()
        )
        
        # Define function to handle translation with RAG
        def translate_with_rag(input_dict):
            text = input_dict.get("text", "")
            context = input_dict.get("context", "")
            
            result = translation_chain.invoke({
                "source_language": source_language,
                "target_language": target_language,
                "text": text,
                "context": context
            })
            
            return result
        
        return translate_with_rag

# Global RAG translation service instance
rag_translation_service = RAGTranslationService()
