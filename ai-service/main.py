"""
VidyutAI AI Service - Main Entry Point
This module serves as the main entry point for the AI service,
providing real-time data analysis and insights for energy management.
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Import optimization router
try:
    from app.api.endpoints import optimization
    OPTIMIZATION_AVAILABLE = True
except ImportError:
    OPTIMIZATION_AVAILABLE = False
    logger.warning("Optimization router not available - app.api.endpoints.optimization not found")

# Import demand optimization router
try:
    from app.api.endpoints import demand_optimization
    DEMAND_OPTIMIZATION_AVAILABLE = True
except ImportError:
    DEMAND_OPTIMIZATION_AVAILABLE = False
    logger.warning("Demand optimization router not available - app.api.endpoints.demand_optimization not found")

# Import forecasting router
try:
    from app.api.endpoints import forecasting
    FORECASTING_AVAILABLE = True
except ImportError:
    FORECASTING_AVAILABLE = False
    logger.warning("Forecasting router not available - app.api.endpoints.forecasting not found")

# Import actions router (for AI insights)
try:
    from app.api.endpoints import actions
    ACTIONS_AVAILABLE = True
except ImportError:
    ACTIONS_AVAILABLE = False
    logger.warning("Actions router not available - app.api.endpoints.actions not found")

# Import predictions router (for AI predictions)
try:
    from app.api.endpoints import predictions_new
    PREDICTIONS_AVAILABLE = True
except ImportError:
    PREDICTIONS_AVAILABLE = False
    logger.warning("Predictions router not available - app.api.endpoints.predictions_new not found")

# Initialize FastAPI app
app = FastAPI(
    title="VidyutAI AI Service",
    description="AI-powered analytics for energy management systems",
    version="0.1.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Include optimization router if available
if OPTIMIZATION_AVAILABLE:
    app.include_router(optimization.router, prefix="/api/v1", tags=["Source Optimization"])
    logger.info("Optimization router registered at /api/v1/optimize")

# Include demand optimization router if available
if DEMAND_OPTIMIZATION_AVAILABLE:
    app.include_router(demand_optimization.router, prefix="/api/v1", tags=["Demand Optimization"])
    logger.info("Demand optimization router registered at /api/v1/demand-optimize")

# Include forecasting router if available
if FORECASTING_AVAILABLE:
    app.include_router(forecasting.router, prefix="/api/v1", tags=["Forecasting"])
    logger.info("Forecasting router registered at /api/v1/forecast/*")

# Include actions router if available (for AI insights)
if ACTIONS_AVAILABLE:
    app.include_router(actions.router, prefix="/api/v1", tags=["Actions"])
    logger.info("Actions router registered at /api/v1/actions/*")

# Include predictions router if available (for AI predictions)
if PREDICTIONS_AVAILABLE:
    app.include_router(predictions_new.router, prefix="/api/v1", tags=["AI Predictions"])
    logger.info("Predictions router registered at /api/v1/predictions/*")

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