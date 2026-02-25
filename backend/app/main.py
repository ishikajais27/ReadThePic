
import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

# Load environment variables
load_dotenv()
app = FastAPI(
    title="Image to Text API - Gemini 1.5 Flash",
    description="Fast OCR API powered by Google Gemini 1.5 Flash - <1s processing, multilingual support, high accuracy",
    version="2.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Image to Text API - Powered by Gemini 1.5 Flash",
        "status": "running",
        "model": "gemini-1.5-flash",
        "features": {
            "speed": "<1 second per image",
            "accuracy": "Handles complex layouts, handwriting, multilingual text",
            "free_tier": "15 requests/min, 1M tokens/day"
        },
        "endpoints": {
            "health": "/health",
            "extract_text": "/api/extract-text",
            "extract_text_batch": "/api/extract-text-batch"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "api": "gemini-1.5-flash",
        "optimized_for": "speed + accuracy"
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )