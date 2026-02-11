
import io
import logging
import os
from functools import lru_cache

import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

load_dotenv()
logger = logging.getLogger(__name__)

class ImageProcessor:
    _instance = None
    _model = None
    
    def __new__(cls):
        """Singleton pattern to ensure only one model instance"""
        if cls._instance is None:
            cls._instance = super(ImageProcessor, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the Gemini API"""
        if self._model is not None:
            return  # Already initialized
        
        # Get API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_actual_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY not found or not set in .env file.\n"
                "Get your free API key from: https://ai.google.dev/"
            )
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Use model from .env or default to gemini-flash-latest
        # Available options from your screenshots:
        # - gemini-flash-latest (BEST for OCR - fastest)
        # - gemini-2.5-flash
        # - gemini-2.0-flash
        model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
        
        # Initialize the model
        self._model = genai.GenerativeModel(model_name)
        
        logger.info(f"Gemini API initialized with model: {model_name}")
        logger.info("Optimized for fast OCR with high accuracy")
    
    @property
    def model(self):
        return self._model
    
    @lru_cache(maxsize=3)
    def get_prompt(self, task_type: str) -> str:
        """
        Get the appropriate prompt for the task type (cached)
        
        Args:
            task_type: One of "text", "formula", or "table"
        
        Returns:
            Prompt string for the model
        """
        prompts = {
            "text": "Extract all text from this image. Return only the text content.",
            "formula": "Extract all mathematical formulas and equations from this image in LaTeX format.",
            "table": "Extract the table from this image and format it as a markdown table."
        }
        return prompts.get(task_type, prompts["text"])
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Optimize image before processing
        
        Args:
            image: PIL Image
            
        Returns:
            Optimized PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Gemini Flash handles large images well
        max_dimension = 4096
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image to {new_size}")
        
        return image
    
    def process_image(self, image_bytes: bytes, task_type: str = "text") -> str:
        """
        Process image and extract text using Gemini Flash Latest
        
        Args:
            image_bytes: Image file bytes
            task_type: Type of recognition task
        
        Returns:
            Extracted text from the image
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess image
            image = self.preprocess_image(image)
            
            # Get appropriate prompt
            prompt = self.get_prompt(task_type)
            
            # Generate content using Gemini
            logger.info(f"Sending request to Gemini Flash with task: {task_type}")
            
            response = self.model.generate_content([prompt, image])
            
            # Extract text from response
            if response and hasattr(response, 'text') and response.text:
                extracted_text = response.text.strip()
                logger.info(f"Successfully extracted text")
                return extracted_text
            else:
                logger.warning("No text returned from Gemini API")
                return ""
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error in image processing: {error_msg}")
            raise Exception(f"Failed to process image: {error_msg}")