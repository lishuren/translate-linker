import os
import uuid
import time
import sys
import traceback
import json
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
    Query,
    Depends,
    Header,
)
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
from services.siliconflow_service import SiliconFlowService
from models.translation import (
    Translation,
    TranslationStatus,
    TranslationRequest,
    TranslationResponse,
    TranslationStatusResponse,
)
from models.api_key import APIKeySettings

# Import routers
from app_auth import auth_router, get_user_id_from_token
from app_tmx import tmx_router  # Import TMX router

# Load environment variables
load_dotenv()

# Check if debug mode is enabled from .env first, then command line args
DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"

# Enable more verbose debugging
VERBOSE_DEBUG = DEBUG_MODE


def debug_log(message: str, data=None, verbose=False):
    """Log debug messages only if in debug mode"""
    if DEBUG_MODE and (not verbose or (verbose and VERBOSE_DEBUG)):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if data:
            if isinstance(data, dict) or isinstance(data, list):
                try:
                    # Pretty print JSON with indentation
                    pretty_data = json.dumps(data, indent=2, default=str)
                    print(f"[DEBUG {timestamp}] {message}:\n{pretty_data}")
                except:
                    print(f"[DEBUG {timestamp}] {message}: {data}")
            else:
                print(f"[DEBUG {timestamp}] {message}: {data}")
        else:
            print(f"[DEBUG {timestamp}] {message}")


print(f"[SERVER] Starting with DEBUG_MODE: {DEBUG_MODE}")

# Create FastAPI app
app = FastAPI(
    title="Translation API",
    description="API for language translation services using LLMs",
    version="1.0.0",
    debug=DEBUG_MODE,
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
app.include_router(auth_router)
app.include_router(tmx_router)  # Include TMX router

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("translations", exist_ok=True)
os.makedirs("tmx_files", exist_ok=True)
os.makedirs("vector_stores", exist_ok=True)
os.makedirs("config", exist_ok=True)
os.makedirs("backend/data", exist_ok=True)
os.makedirs("backend/data/chroma", exist_ok=True)


@app.post("/api/translation/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    targetLanguage: str = Form(...),
    llmProvider: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
):
    try:
        # Log the request details
        print(
            f"[UPLOAD] Processing upload request for file: {file.filename}, target language: {targetLanguage}, provider: {llmProvider or 'default'}"
        )

        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        print(f"[UPLOAD] Request from user ID: {user_id}")

        if DEBUG_MODE:
            debug_log(
                f"Authorization header",
                authorization[:15] + "..." if authorization else None,
            )
            debug_log(
                f"Upload details",
                {
                    "filename": file.filename,
                    "size": file.size if hasattr(file, "size") else "unknown",
                    "content_type": file.content_type,
                    "target_language": targetLanguage,
                    "requested_provider": llmProvider,
                    "user_id": user_id,
                },
            )

        # Check if user is allowed to select model
        is_allowed = await translation_service.is_model_selection_allowed(user_id)
        print(f"[UPLOAD] User model selection allowed: {is_allowed}")

        # Use the provided LLM provider or the default one
        selected_provider = llmProvider

        # If user selection is not allowed, ignore provided LLM provider
        if not is_allowed and llmProvider:
            # Get the user's configured provider instead
            selected_provider = user_settings_service.get_user_llm_provider(user_id)
            print(
                f"[UPLOAD] User selection not allowed, using user-configured provider: {selected_provider}"
            )

        # If no provider specified, use the default provider from environment
        if not selected_provider:
            # Get default from API keys settings
            api_keys = APIKeySettings.from_env()
            selected_provider = api_keys.default_provider
            print(
                f"[UPLOAD] No provider specified, using default provider: {selected_provider}"
            )

        # Verify that we have an API key for the selected provider
        api_keys = APIKeySettings.from_env()
        if not api_keys.has_key_for_provider(selected_provider):
            # If no API key for selected provider, find a provider we do have a key for
            available_providers = [
                p
                for p in [
                    "openai",
                    "anthropic",
                    "google",
                    "groq",
                    "cohere",
                    "huggingface",
                    "deepseek",
                    "siliconflow",
                ]
                if api_keys.has_key_for_provider(p)
            ]

            print(
                f"[UPLOAD] No API key for {selected_provider}, available providers: {available_providers}"
            )

            if not available_providers:
                raise HTTPException(
                    status_code=400,
                    detail="No API keys configured for any LLM provider. Please configure at least one provider.",
                )

            # Use the first available provider
            selected_provider = available_providers[0]
            print(f"[UPLOAD] Using available provider instead: {selected_provider}")

        # Generate unique ID for this translation
        translation_id = str(uuid.uuid4())
        print(f"[UPLOAD] Generated translation ID: {translation_id}")

        # Save the uploaded file
        file_path = await file_service.save_upload(file, translation_id)
        print(f"[UPLOAD] Saved file to: {file_path}")

        # Create translation record
        translation = Translation(
            id=translation_id,
            originalFileName=file.filename,
            targetLanguage=targetLanguage,
            status=TranslationStatus.PROCESSING,
            createdAt=datetime.now().isoformat(),
        )

        # Check if RAG service should be used (based on global config)
        use_rag = (
            global_config.get_config()
            .get("translation_settings", {})
            .get("rag_enabled", True)
        )
        print(f"[UPLOAD] Using RAG for translation: {use_rag}")

        if use_rag:
            # Start translation in background with RAG
            background_tasks.add_task(
                rag_translation_service.process_translation_with_rag,
                translation_id=translation_id,
                file_path=file_path,
                target_language=targetLanguage,
                original_filename=file.filename,
                llm_provider=selected_provider,
                user_id=user_id,
            )
        else:
            # Use the standard translation service
            background_tasks.add_task(
                translation_service.process_translation,
                translation_id=translation_id,
                file_path=file_path,
                target_language=targetLanguage,
                original_filename=file.filename,
                llm_provider=selected_provider,
                user_id=user_id,
            )

        print(
            f"[UPLOAD] Translation processing started in background for ID: {translation_id}"
        )
        return JSONResponse(
            content={"success": True, "translation": translation.dict()}
        )

    except Exception as e:
        print(f"[ERROR] Upload document error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error uploading document: {str(e)}"
        )


@app.get(
    "/api/translation/status/{translation_id}", response_model=TranslationStatusResponse
)
async def check_translation_status(translation_id: str):
    try:
        print(f"[STATUS] Checking status for translation ID: {translation_id}")
        status = await translation_service.get_translation_status(translation_id)
        if not status:
            print(f"[STATUS] Translation not found: {translation_id}")
            raise HTTPException(status_code=404, detail="Translation not found")

        print(f"[STATUS] Translation status: {status}")
        response = {
            "id": translation_id,  # Add the root-level id
            "translation": status,
            "progress": status["progress"],
        }
        return response
    except Exception as e:
        print(f"[ERROR] Status check error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error checking translation status: {str(e)}"
        )


@app.get("/api/translation/download/{translation_id}")
async def download_translation(translation_id: str):
    try:
        print(f"[DOWNLOAD] Request to download translation ID: {translation_id}")
        file_path = await translation_service.get_translation_file(translation_id)
        if not file_path:
            print(f"[DOWNLOAD] Translation file not found: {translation_id}")
            raise HTTPException(status_code=404, detail="Translation file not found")

        print(f"[DOWNLOAD] Serving file: {file_path}")
        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/octet-stream",
        )
    except Exception as e:
        print(f"[ERROR] Download error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error downloading translation: {str(e)}"
        )


@app.delete("/api/translation/{translation_id}")
async def delete_translation(
    translation_id: str, authorization: Optional[str] = Header(None)
):
    try:
        print(f"[DELETE] Request to delete translation ID: {translation_id}")

        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        print(f"[DELETE] Request from user ID: {user_id}")

        if DEBUG_MODE:
            debug_log(
                f"Authorization header",
                authorization[:15] + "..." if authorization else None,
            )
            debug_log(f"Translation ID to delete", translation_id)
            debug_log(f"User ID attempting deletion", user_id)

        if not user_id:
            print(
                f"[DELETE] Unauthorized deletion attempt for translation: {translation_id}"
            )
            raise HTTPException(status_code=401, detail="Authentication required")

        # Delete the translation
        success = await translation_service.delete_translation(translation_id, user_id)

        if not success:
            print(
                f"[DELETE] Failed to delete translation: {translation_id}. Not found or no permission."
            )
            raise HTTPException(
                status_code=404,
                detail="Translation not found or you don't have permission to delete it",
            )

        print(f"[DELETE] Successfully deleted translation: {translation_id}")
        return {"success": True, "message": "Translation deleted successfully"}
    except Exception as e:
        print(f"[ERROR] Delete translation error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error deleting translation: {str(e)}"
        )


@app.get("/api/translation/history")
async def get_translation_history(authorization: Optional[str] = Header(None)):
    try:
        print("[HISTORY] Request for translation history")

        # Get user ID from token
        user_id = get_user_id_from_token(authorization)
        print(f"[HISTORY] Request from user ID: {user_id}")

        if not user_id:
            print(f"[HISTORY] Unauthorized history request")
            raise HTTPException(status_code=401, detail="Authentication required")

        translations = await translation_service.get_all_translations(user_id)
        print(f"[HISTORY] Found {len(translations)} translations for user {user_id}")
        return {"translations": translations}
    except Exception as e:
        print(f"[ERROR] Translation history error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving translation history: {str(e)}"
        )


@app.get("/api/config/model-selection-allowed")
async def is_model_selection_allowed(authorization: Optional[str] = Header(None)):
    """Check if a user is allowed to select LLM models"""
    try:
        # Get user ID from token
        user_id = get_user_id_from_token(authorization)

        is_allowed = await translation_service.is_model_selection_allowed(user_id)
        return {"allowed": is_allowed}
    except Exception as e:
        print(f"[ERROR] Model selection check error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error checking model selection permission: {str(e)}",
        )


@app.get("/api/config/available-web-translation-services")
async def get_available_web_translation_services():
    """Get available web translation services"""
    try:
        services = await translation_service.get_available_web_translation_services()
        return {"services": services}
    except Exception as e:
        print(f"[ERROR] Web translation services error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving web translation services: {str(e)}",
        )


@app.get("/api/config/system-info")
async def get_system_info():
    """Get system configuration information"""
    try:
        print("[CONFIG] Request for system info")
        config = global_config.get_config(reload=True)

        # Gather all environment variables for debugging
        env_vars = {
            "DEFAULT_LLM_MODEL": os.getenv("DEFAULT_LLM_MODEL"),
            "SILICONFLOW_API_KEY": bool(os.getenv("SILICONFLOW_API_KEY")),
            "SILICONFLOW_API_BASE": os.getenv("SILICONFLOW_API_BASE"),
            "SILICONFLOW_MODEL_NAME": os.getenv("SILICONFLOW_MODEL_NAME"),
        }
        print(f"[CONFIG] Environment variables: {env_vars}")

        return {
            "config": {
                "llm_settings": {
                    "default_provider": config.get("llm_settings", {}).get(
                        "default_provider", "openai"
                    ),
                    "available_providers": list(
                        config.get("llm_settings", {}).get("providers", {}).keys()
                    ),
                },
                "translation_settings": {
                    "default_web_service": config.get("translation_settings", {}).get(
                        "default_service", "none"
                    ),
                    "rag_enabled": config.get("translation_settings", {}).get(
                        "rag_enabled", True
                    ),
                },
                "system_version": "1.0.0",
                "env_debug": env_vars,  # Include environment variables for debugging
            }
        }
    except Exception as e:
        print(f"[ERROR] System info error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving system info: {str(e)}"
        )


@app.get("/api/config/api-key-status")
async def check_api_key_status():
    """Check if API keys are configured for each provider"""
    try:
        print("[CONFIG] Checking API key status")

        # Load fresh API keys from environment
        api_keys = APIKeySettings.from_env()

        # Get status for all providers
        status = api_keys.get_all_providers_status()

        # Add default provider info
        status["default_provider"] = api_keys.default_provider
        status["has_default_key"] = api_keys.has_key_for_provider(
            api_keys.default_provider
        )

        # Get count of configured providers
        configured_providers = sum(
            1
            for k, v in status.items()
            if isinstance(v, bool) and v and k != "has_default_key"
        )
        status["configured_providers_count"] = configured_providers

        print(f"[CONFIG] API key status: {status}")

        # Add detailed debug information
        env_debug = {
            "DEFAULT_LLM_MODEL": os.getenv("DEFAULT_LLM_MODEL"),
            "siliconflow_api_key_set": bool(os.getenv("SILICONFLOW_API_KEY")),
            "siliconflow_api_base": os.getenv("SILICONFLOW_API_BASE"),
            "siliconflow_model_name": os.getenv("SILICONFLOW_MODEL_NAME"),
        }

        return {"api_key_status": status, "env_debug": env_debug}
    except Exception as e:
        print(f"[ERROR] API key status check error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, detail=f"Error checking API key status: {str(e)}"
        )


# Debug endpoint to test any LLM provider service directly
@app.get("/api/debug/llm-test/{provider}")
async def test_llm_provider(
    provider: str, prompt: str = Query("Translate this to Spanish: Hello world")
):
    """Test endpoint for any LLM API"""
    if not DEBUG_MODE:
        raise HTTPException(status_code=403, detail="Debug mode is not enabled")

    try:
        print(f"[DEBUG] Testing {provider} API with prompt: {prompt}")

        # Get environment variables
        api_keys = APIKeySettings.from_env()

        if not api_keys.has_key_for_provider(provider):
            return {"status": "error", "message": f"{provider.upper()}_API_KEY not set"}

        response = None

        # Select service based on provider
        if provider == "siliconflow":
            service = SiliconFlowService()
            response = await service.generate_text(
                prompt, "You are a helpful translation assistant."
            )
        # Add other providers as needed
        else:
            return {
                "status": "error",
                "message": f"Provider {provider} not supported for direct testing",
            }

        return {
            "status": "success",
            "provider": provider,
            "response": response,
        }
    except Exception as e:
        print(f"[ERROR] {provider} test error: {str(e)}")
        if DEBUG_MODE:
            print(f"[ERROR_DEBUG] Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc() if DEBUG_MODE else None,
        }


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    print("[SERVER] Starting up LingoAIO API server")
    print(f"[SERVER] Debug mode: {DEBUG_MODE}")
    print(f"[SERVER] Command line arguments: {sys.argv}")

    if DEBUG_MODE:
        debug_log(
            "Environment configuration",
            {
                "DEFAULT_LLM_MODEL": os.getenv("DEFAULT_LLM_MODEL", "not set"),
                "SILICONFLOW_API_KEY": bool(os.getenv("SILICONFLOW_API_KEY")),
                "SILICONFLOW_API_BASE": os.getenv("SILICONFLOW_API_BASE", "not set"),
                "SILICONFLOW_MODEL_NAME": os.getenv(
                    "SILICONFLOW_MODEL_NAME", "not set"
                ),
                "RAG_ENABLED": os.getenv("RAG_ENABLED", "not set"),
                "DEBUG": os.getenv("DEBUG", "not set"),
                "PORT": os.getenv("PORT", "not set"),
                "HOST": os.getenv("HOST", "not set"),
            },
        )

    # Test loading API keys
    api_keys = APIKeySettings.from_env()
    print(f"[SERVER] Default LLM provider: {api_keys.default_provider}")
    print(
        f"[SERVER] API key for default provider exists: {api_keys.has_key_for_provider(api_keys.default_provider)}"
    )

    available_providers = [
        p
        for p in [
            "openai",
            "anthropic",
            "google",
            "groq",
            "cohere",
            "huggingface",
            "deepseek",
            "siliconflow",
        ]
        if api_keys.has_key_for_provider(p)
    ]
    print(f"[SERVER] Available providers: {', '.join(available_providers)}")


@app.on_event("shutdown")
async def shutdown_event():
    print("[SERVER] Shutting down LingoAIO API server")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))

    print(f"[STARTUP] Starting server with debug mode: {DEBUG_MODE}")
    print(f"[STARTUP] Command line args: {sys.argv}")

    uvicorn.run(
        "app:app", host=os.getenv("HOST", "0.0.0.0"), port=port, reload=DEBUG_MODE
    )
