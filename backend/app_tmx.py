
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse

# Local imports
from services.tmx_service import TMXService
from services.file_service import FileService

tmx_router = APIRouter(
    prefix="/api/tmx",
    tags=["TMX"]
)

# Initialize services
tmx_service = TMXService()
file_service = FileService()

@tmx_router.post("/upload", response_model=dict)
async def upload_tmx_file(file: UploadFile = File(...)):
    """Upload a TMX file to add to the translation memory"""
    try:
        # Generate a unique ID for this TMX file
        tmx_id = str(uuid.uuid4())
        
        # Check file extension
        if not file.filename.lower().endswith('.tmx'):
            raise HTTPException(status_code=400, detail="File must be a TMX file")
            
        # Save the uploaded file
        file_path = await file_service.save_upload(file, f"tmx_{tmx_id}")
        
        # Process the TMX file
        result = await tmx_service.parse_tmx_file(file_path)
        
        return {
            "success": True,
            "tmx_id": tmx_id,
            "result": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing TMX file: {str(e)}")

@tmx_router.post("/search", response_model=dict)
async def search_translation_memory(
    text: str = Form(...),
    source_language: str = Form(...),
    target_language: str = Form(...),
    threshold: float = Form(0.7)
):
    """Search translation memory for similar segments"""
    try:
        matches = await tmx_service.search_translation_memory(
            text,
            source_language,
            target_language,
            threshold
        )
        
        return {
            "success": True,
            "matches": matches,
            "match_count": len(matches)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching translation memory: {str(e)}")

@tmx_router.get("/export/{translation_id}", response_model=dict)
async def export_translation_as_tmx(translation_id: str):
    """Export a completed translation as a TMX file"""
    try:
        # This would need to be implemented
        return {
            "success": False,
            "error": "Not implemented yet"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting translation: {str(e)}")
