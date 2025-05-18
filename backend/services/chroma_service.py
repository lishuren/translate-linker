import os
import shutil
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter


class ChromaService:
    """Service for managing ChromaDB vector stores for translation RAG"""

    def __init__(self):
        self.base_path = os.getenv("CHROMA_DB_PATH", "backend/data/chroma")
        os.makedirs(self.base_path, exist_ok=True)

        # Initialize embeddings model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=os.getenv(
                "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
            )
        )

    def get_user_db_path(self, user_id: str) -> str:
        """Get the ChromaDB path for a specific user"""
        if not user_id:
            raise ValueError("User ID is required")

        # Create user-specific directory
        user_path = os.path.join(self.base_path, user_id)
        os.makedirs(user_path, exist_ok=True)
        return user_path

    def create_or_get_collection(
        self, user_id: str, collection_name: str = "translations"
    ) -> Chroma:
        """Create or get a ChromaDB collection for a user"""
        db_path = self.get_user_db_path(user_id)

        # Initialize Chroma client with persistent storage
        client = chromadb.PersistentClient(path=db_path)

        # Create or get collection
        try:
            client_collection = client.get_or_create_collection(name=collection_name)

            # Create LangChain Chroma wrapper
            langchain_chroma = Chroma(
                client=client,
                collection_name=collection_name,
                embedding_function=self.embeddings,
            )

            return langchain_chroma
        except Exception as e:
            raise Exception(f"Failed to create or get collection: {e}")

    def add_translations_to_rag(
        self,
        user_id: str,
        source_texts: List[str],
        target_texts: List[str],
        source_language: str,
        target_language: str,
        metadata: List[Dict[str, Any]] = None,
    ) -> None:
        """Add translation pairs to the RAG store"""
        # Get the user's collection
        collection = self.create_or_get_collection(user_id)

        # Create documents for each translation pair
        documents = []

        for i, (source, target) in enumerate(zip(source_texts, target_texts)):
            # Create document with combined source and target
            text = f"Source ({source_language}): {source}\nTarget ({target_language}): {target}"

            # Set up metadata
            doc_metadata = {
                "source_language": source_language,
                "target_language": target_language,
                "source_text": source,
                "target_text": target,
            }

            # Add any additional metadata if provided
            if metadata and i < len(metadata):
                doc_metadata.update(metadata[i])

            # Create document
            doc = Document(page_content=text, metadata=doc_metadata)
            documents.append(doc)

        # Add to collection
        collection.add_documents(documents)
        print(f"Added {len(documents)} translation pairs to {user_id}'s RAG store")

    def search_similar_translations(
        self,
        user_id: str,
        query: str,
        source_language: str = None,
        target_language: str = None,
        k: int = 5,
    ) -> List[Dict[str, Any]]:
        # """Search for similar translations in the RAG store"""
        # Get the user's collection
        collection = self.create_or_get_collection(user_id)

        # Create filters based on languages if provided
        filter_dict = None
        if source_language or target_language:
            conditions = []
            if source_language:
                conditions.append({"source_language": source_language})
            if target_language:
                conditions.append({"target_language": target_language})
            filter_dict = {"$and": conditions} if len(conditions) > 1 else conditions[0]

        # Perform search
        results = collection.similarity_search(query, k=k, filter=filter_dict)

        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append(
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": getattr(doc, "score", None),
                }
            )

        return formatted_results

    def delete_user_collection(self, user_id: str) -> bool:
        """Delete a user's ChromaDB collection"""
        db_path = self.get_user_db_path(user_id)
        if os.path.exists(db_path):
            try:
                shutil.rmtree(db_path)
                return True
            except Exception as e:
                print(f"Error deleting user collection: {e}")
                return False
        return False

    def add_tmx_to_rag(self, user_id: str, tmx_entries: List[Dict[str, Any]]) -> int:
        """Add TMX entries to the RAG store"""
        source_texts = []
        target_texts = []
        metadata_list = []

        for entry in tmx_entries:
            source_texts.append(entry["source_text"])
            target_texts.append(entry["target_text"])
            metadata = {
                "tmx_unit_id": entry.get("tmx_unit_id"),
                "context": entry.get("context"),
                "domain": entry.get("domain", "general"),
                "created_at": entry.get("created_at"),
            }
            metadata_list.append(metadata)

        # Add to RAG
        if source_texts:
            self.add_translations_to_rag(
                user_id,
                source_texts,
                target_texts,
                tmx_entries[0].get("source_language", "unknown"),
                tmx_entries[0].get("target_language", "unknown"),
                metadata_list,
            )

        return len(source_texts)


# Initialize the Chroma service
chroma_service = ChromaService()
