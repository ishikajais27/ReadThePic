
import hashlib
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.services.image_processor import ImageProcessor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the image processor (singleton)
image_processor = None

@router.on_event("startup")
async def startup_event():
    global image_processor
    logger.info("Initializing Gemini 1.5 Flash API...")
    try:
        image_processor = ImageProcessor()
        logger.info("✓ Gemini 1.5 Flash initialized successfully!")
        logger.info("✓ Free tier limits: 15 requests/min, 1M tokens/day")
    except ValueError as e:
        logger.error(f"✗ Failed to initialize Gemini API: {e}")
        logger.error("  Please set GEMINI_API_KEY in your .env file")
        logger.error("  Get your free key at: https://ai.google.dev/")

# Simple in-memory cache for recent results
result_cache = {}
MAX_CACHE_SIZE = 100

def get_cache_key(image_bytes: bytes, task_type: str) -> str:
    """Generate cache key from image bytes and task type"""
    image_hash = hashlib.md5(image_bytes).hexdigest()
    return f"{image_hash}_{task_type}"

@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    task_type: Optional[str] = Form("text")
):
    """
    Extract text from uploaded image using Gemini 1.5 Flash
    
    Free tier: 15 requests/min, 1M tokens/day, <1s processing time
    
    Args:
        file: Image file (jpg, jpeg, png, webp, gif)
        task_type: Type of recognition - "text", "formula", or "table"
    
    Returns:
        JSON with extracted text
    """
    try:
        # Check if API is initialized
        if image_processor is None:
            raise HTTPException(
                status_code=500,
                detail="Gemini API not initialized. Please check your GEMINI_API_KEY in .env file. Get your free key at: https://ai.google.dev/"
            )
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (jpg, jpeg, png, webp, gif)"
            )
        
        # Validate task type
        valid_tasks = ["text", "formula", "table"]
        if task_type not in valid_tasks:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid task_type. Must be one of: {', '.join(valid_tasks)}"
            )
        
        # Read image file
        image_bytes = await file.read()
        
        # Check cache first
        cache_key = get_cache_key(image_bytes, task_type)
        if cache_key in result_cache:
            logger.info(f"✓ Cache hit for {file.filename}")
            return JSONResponse(content={
                "success": True,
                "filename": file.filename,
                "task_type": task_type,
                "extracted_text": result_cache[cache_key],
                "cached": True
            })
        
        # Process image with Gemini 1.5 Flash
        logger.info(f"Processing image: {file.filename} with task: {task_type}")
        result = image_processor.process_image(image_bytes, task_type)
        
        # Update cache
        if len(result_cache) >= MAX_CACHE_SIZE:
            # Remove oldest entry
            result_cache.pop(next(iter(result_cache)))
        result_cache[cache_key] = result
        
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "task_type": task_type,
            "extracted_text": result,
            "cached": False
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/extract-text-batch")
async def extract_text_batch(
    files: list[UploadFile] = File(...),
    task_type: Optional[str] = Form("text")
):
    """
    Extract text from multiple uploaded images using Gemini 1.5 Flash
    
    Args:
        files: List of image files
        task_type: Type of recognition - "text", "formula", or "table"
    
    Returns:
        JSON with extracted text for each image
    """
    try:
        # Check if API is initialized
        if image_processor is None:
            raise HTTPException(
                status_code=500,
                detail="Gemini API not initialized. Please check your GEMINI_API_KEY in .env file"
            )
        
        results = []
        
        for file in files:
            # Validate file type
            if not file.content_type.startswith("image/"):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "File must be an image"
                })
                continue
            
            # Read and process image
            try:
                image_bytes = await file.read()
                
                # Check cache
                cache_key = get_cache_key(image_bytes, task_type)
                if cache_key in result_cache:
                    extracted_text = result_cache[cache_key]
                    cached = True
                else:
                    extracted_text = image_processor.process_image(image_bytes, task_type)
                    result_cache[cache_key] = extracted_text
                    cached = False
                
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "extracted_text": extracted_text,
                    "cached": cached
                })
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": str(e)
                })
        
        return JSONResponse(content={
            "success": True,
            "task_type": task_type,
            "total_files": len(files),
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error processing batch: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )