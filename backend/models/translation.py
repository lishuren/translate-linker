
from enum import Enum
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field
from datetime import datetime

class TranslationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ProcessingDetails(BaseModel):
    engine: str = "langchain"
    model: str = "deepseek-coder"
    vectorStore: str = "faiss"
    documentChunks: int = 0
    ragEnabled: bool = True
    processingTime: Optional[float] = None
    totalTokens: Optional[int] = None
    translationProvider: Optional[str] = None
    agentEnabled: bool = True
    confidenceScore: Optional[float] = None

class Translation(BaseModel):
    id: str
    originalFileName: str
    targetLanguage: str
    status: TranslationStatus
    downloadUrl: Optional[str] = None
    createdAt: str
    errorMessage: Optional[str] = None
    processingDetails: Optional[ProcessingDetails] = None

class TranslationRequest(BaseModel):
    file_path: str
    target_language: str
    original_filename: str

class TranslationResponse(BaseModel):
    translation: Translation

class TranslationStatusResponse(BaseModel):
    id: str
    status: TranslationStatus
    progress: float = 0
    downloadUrl: Optional[str] = None
    errorMessage: Optional[str] = None
