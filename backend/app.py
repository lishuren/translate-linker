
import os
import uuid
import time
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Query, Depends, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Local imports
from services.translation_service import TranslationService
from services.file_service import FileService
from services.user_settings_service import UserSettingsService
from services.global_config_service import GlobalConfigService
from services.rag_translation_service import rag_translation_service
from services.chroma_service import chroma_service
from models.translation import (
    Translation, 
    TranslationStatus, 
    TranslationRequest,
    TranslationResponse,
    TranslationStatusResponse
)

# Import routers
from app_tmx import tmx_router
from app_auth import auth_router, get_user_id_from_token

# Load environment variables
load_dotenv()

app = FastAPI(
    title="LingoAIO API",
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
user_settings_service = UserSettingsService()
global_config = GlobalConfigService()

# Include routers
app.include_router(tmx_router)
app.include_router(auth_router)

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("translations", exist_ok=True)
os.makedirs("tmx_files", exist_ok=True)
os.makedirs("vector_stores", exist_ok=True)
os.makedirs("config", exist_ok=True)
os.makedirs("backend/data", exist_ok=True)
os.makedirs("backend/data/chroma", exist_ok=True)

@app.post("/api/translation/upload", response_model=TranslationResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    targetLanguage: str = Form(...),
    llmProvider: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
):
    try:
        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        
        # Check if user is allowed to select model
        is_allowed = await translation_service.is_model_selection_allowed(user_id)
        
        # If user selection is not allowed, ignore provided LLM provider
        if not is_allowed and llmProvider:
            # Get the user's configured provider instead
            llmProvider = user_settings_service.get_user_llm_provider(user_id)
            
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
        
        # Check if RAG service should be used (based on global config)
        use_rag = global_config.get_config().get('translation_settings', {}).get('rag_enabled', True)
        
        if use_rag:
            # Start translation in background with RAG
            background_tasks.add_task(
                rag_translation_service.process_translation_with_rag,
                translation_id=translation_id,
                file_path=file_path,
                target_language=targetLanguage,
                original_filename=file.filename,
                llm_provider=llmProvider,
                user_id=user_id
            )
        else:
            # Use the standard translation service
            background_tasks.add_task(
                translation_service.process_translation,
                translation_id=translation_id,
                file_path=file_path,
                target_language=targetLanguage,
                original_filename=file.filename,
                llm_provider=llmProvider,
                user_id=user_id
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
async def get_translation_history(authorization: Optional[str] = Header(None)):
    try:
        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        
        translations = await translation_service.get_all_translations(user_id)
        return {"translations": translations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving translation history: {str(e)}")

@app.get("/api/config/model-selection-allowed")
async def is_model_selection_allowed(authorization: Optional[str] = Header(None)):
    """Check if a user is allowed to select LLM models"""
    try:
        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        
        is_allowed = await translation_service.is_model_selection_allowed(user_id)
        return {"allowed": is_allowed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking model selection permission: {str(e)}")

@app.get("/api/config/available-web-translation-services")
async def get_available_web_translation_services():
    """Get available web translation services"""
    try:
        services = await translation_service.get_available_web_translation_services()
        return {"services": services}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving web translation services: {str(e)}")

@app.get("/api/config/system-info")
async def get_system_info():
    """Get system configuration information"""
    try:
        config = global_config.get_config(reload=True)
        return {
            "config": {
                "llm_settings": {
                    "default_provider": config.get("llm_settings", {}).get("default_provider", "openai"),
                    "available_providers": list(config.get("llm_settings", {}).get("providers", {}).keys())
                },
                "translation_settings": {
                    "default_web_service": config.get("translation_settings", {}).get("default_service", "none"),
                    "rag_enabled": config.get("translation_settings", {}).get("rag_enabled", True)
                },
                "system_version": "1.0.0"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving system info: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=port,
        reload=debug
    )

