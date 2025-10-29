"""
VidyutAI AI Service - Main Entry Point
This module serves as the main entry point for the AI service,
providing real-time data analysis and insights for energy management.
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv

# Import local modules
from config import settings
from api.router import api_router
from core.data_processor import DataProcessor
from models.model_manager import ModelManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VidyutAI AI Service",
    description="AI-powered analytics for energy management systems",
    version="0.1.0",
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Initialize components
data_processor = None
model_manager = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global data_processor, model_manager
    
    logger.info("Starting VidyutAI AI Service...")
    
    try:
        # Initialize data processor
        data_processor = DataProcessor()
        logger.info("Data processor initialized")
        
        # Initialize model manager
        model_manager = ModelManager()
        logger.info("Model manager initialized")
        
        logger.info("VidyutAI AI Service started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down VidyutAI AI Service...")
    
    # Clean up resources here
    
    logger.info("VidyutAI AI Service shut down successfully")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "VidyutAI AI Service",
        "status": "running",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8000))
    
    # Run the application
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)