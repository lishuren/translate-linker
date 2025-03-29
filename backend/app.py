import os
import uuid
import time
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Local imports
from services.translation_service import TranslationService
from services.file_service import FileService
from models.translation import (
    Translation, 
    TranslationStatus, 
    TranslationRequest,
    TranslationResponse,
    TranslationStatusResponse
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Translation API",
    description="API for translating documents using LangChain with multiple LLM providers",
    version="1.0.0"
)

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
file_service = FileService()
translation_service = TranslationService()

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("translations", exist_ok=True)

@app.post("/api/translation/upload", response_model=TranslationResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    targetLanguage: str = Form(...),
    llmProvider: Optional[str] = Form(None)
):
    try:
        # Generate unique ID for this translation
        translation_id = str(uuid.uuid4())
        
        # Save the uploaded file
        file_path = await file_service.save_upload(file, translation_id)
        
        # Create translation record
        translation = Translation(
            id=translation_id,
            originalFileName=file.filename,
            targetLanguage=targetLanguage,
            status=TranslationStatus.PROCESSING,
            createdAt=datetime.now().isoformat()
        )
        
        # Start translation in background with specified LLM provider
        background_tasks.add_task(
            translation_service.process_translation,
            translation_id=translation_id,
            file_path=file_path,
            target_language=targetLanguage,
            original_filename=file.filename,
            llm_provider=llmProvider
        )
        
        return {"translation": translation.dict()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/api/translation/status/{translation_id}", response_model=TranslationStatusResponse)
async def check_translation_status(translation_id: str):
    try:
        status = await translation_service.get_translation_status(translation_id)
        if not status:
            raise HTTPException(status_code=404, detail="Translation not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking translation status: {str(e)}")

@app.get("/api/translation/download/{translation_id}")
async def download_translation(translation_id: str):
    try:
        file_path = await translation_service.get_translation_file(translation_id)
        if not file_path:
            raise HTTPException(status_code=404, detail="Translation file not found")
        
        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading translation: {str(e)}")

@app.get("/api/translation/history")
async def get_translation_history():
    try:
        translations = await translation_service.get_all_translations()
        return {"translations": translations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving translation history: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=port,
        reload=debug
    )
