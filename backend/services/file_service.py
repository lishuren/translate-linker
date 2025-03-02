
import os
import json
import shutil
from typing import Dict, List, Optional, BinaryIO
import aiofiles
from fastapi import UploadFile, HTTPException
import docx
import pandas as pd
from pypdf import PdfReader

class FileService:
    """Service for handling file operations"""
    
    UPLOADS_DIR = "uploads"
    TRANSLATIONS_DIR = "translations"
    METADATA_DIR = "metadata"
    
    def __init__(self):
        os.makedirs(self.UPLOADS_DIR, exist_ok=True)
        os.makedirs(self.TRANSLATIONS_DIR, exist_ok=True)
        os.makedirs(self.METADATA_DIR, exist_ok=True)
    
    async def save_upload(self, file: UploadFile, translation_id: str) -> str:
        """Save uploaded file to disk and return the path"""
        file_path = os.path.join(self.UPLOADS_DIR, f"{translation_id}_{file.filename}")
        
        try:
            # Save the file
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            
            return file_path
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Could not save file: {str(e)}"
            )
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text content from various file formats"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension == '.txt' or file_extension == '.md':
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    return await f.read()
                    
            elif file_extension == '.docx':
                doc = docx.Document(file_path)
                return '\n'.join([para.text for para in doc.paragraphs])
                
            elif file_extension == '.pdf':
                pdf = PdfReader(file_path)
                return '\n'.join([page.extract_text() for page in pdf.pages])
                
            elif file_extension in ['.csv', '.xlsx', '.xls']:
                if file_extension == '.csv':
                    df = pd.read_csv(file_path)
                else:
                    df = pd.read_excel(file_path)
                return df.to_string()
                
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file_extension}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error extracting text from file: {str(e)}"
            )
    
    async def save_translation(self, translation_id: str, translated_text: str, original_filename: str) -> str:
        """Save translated text as a file and return the path"""
        # Get original extension
        _, extension = os.path.splitext(original_filename)
        
        # Create output filename
        output_filename = f"{translation_id}_translated{extension}"
        output_path = os.path.join(self.TRANSLATIONS_DIR, output_filename)
        
        try:
            # For now, save all translations as text files
            # In a real implementation, we'd convert back to the original format
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(translated_text)
            
            return output_path
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Could not save translation: {str(e)}"
            )
    
    async def save_metadata(self, translation_id: str, metadata: Dict) -> None:
        """Save translation metadata"""
        metadata_path = os.path.join(self.METADATA_DIR, f"{translation_id}.json")
        
        try:
            async with aiofiles.open(metadata_path, 'w') as f:
                await f.write(json.dumps(metadata, indent=2))
        except Exception as e:
            print(f"Warning: Could not save metadata: {str(e)}")
    
    async def get_metadata(self, translation_id: str) -> Optional[Dict]:
        """Retrieve translation metadata"""
        metadata_path = os.path.join(self.METADATA_DIR, f"{translation_id}.json")
        
        if not os.path.exists(metadata_path):
            return None
        
        try:
            async with aiofiles.open(metadata_path, 'r') as f:
                content = await f.read()
                return json.loads(content)
        except Exception as e:
            print(f"Warning: Could not read metadata: {str(e)}")
            return None
