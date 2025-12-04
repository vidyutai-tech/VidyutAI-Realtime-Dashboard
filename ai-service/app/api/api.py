# ems-backend/app/api/api.py

from fastapi import APIRouter
from app.api.endpoints import auth, sites, assets, data, actions, simulations, planning, forecasting, prediction

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# FIX: All routers with specific, long paths are included BEFORE the general /sites router.
api_router.include_router(assets.router, prefix="", tags=["Assets"])
api_router.include_router(data.router, prefix="", tags=["Data"])
api_router.include_router(actions.router, prefix="", tags=["Actions"])
api_router.include_router(prediction.router, prefix="", tags=["ML Predictions"])
api_router.include_router(simulations.router, prefix="", tags=["Simulations & Predictions"])
api_router.include_router(forecasting.router, prefix="", tags=["Forecasting"])
api_router.include_router(planning.router, prefix="", tags=["Planning"])

# The general '/sites' router is now included LAST.
api_router.include_router(sites.router, prefix="/sites", tags=["Sites"])