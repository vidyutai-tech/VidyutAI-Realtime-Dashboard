# ems-backend/app/main.py

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.api.endpoints import optimization, demand_optimization, forecasting, predictions_new
from app.services.websocket_manager import websocket_handler

# Create FastAPI app instance
app = FastAPI(
    title="Energy Management System API",
    description="Backend for the EMS dashboard, providing data and real-time updates.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include the main API router
app.include_router(api_router, prefix="/api/v1")

# Include optimization router directly (not through api_router)
# This allows frontend to call /api/v1/optimize directly
app.include_router(optimization.router, prefix="/api/v1", tags=["Source Optimization"])

# Include demand optimization router
# This allows frontend to call /api/v1/demand-optimize directly
app.include_router(demand_optimization.router, prefix="/api/v1", tags=["Demand Optimization"])

# Include forecasting router
# This allows frontend to call /api/v1/forecast/* directly
app.include_router(forecasting.router, prefix="/api/v1", tags=["Forecasting"])

# Include predictions router
# This allows frontend to call /api/v1/predictions/* directly
app.include_router(predictions_new.router, prefix="/api/v1", tags=["AI Predictions"])

# Define the WebSocket route
@app.websocket("/ws/site/{site_id}")
async def websocket_endpoint(websocket: WebSocket, site_id: str):
    await websocket_handler(websocket, site_id)

# Root endpoint for basic health check
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the EMS Backend API"}