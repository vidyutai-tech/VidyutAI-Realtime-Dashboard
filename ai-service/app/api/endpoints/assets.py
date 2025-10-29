# ems-backend/app/api/endpoints/assets.py

import asyncio
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models import pydantic_models as models
from app.data.mock_data import MOCK_MAINTENANCE_ASSETS
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/sites/{site_id}/assets", response_model=List[models.MaintenanceAsset])
async def read_assets_for_site(site_id: str, current_user: models.User = Depends(get_current_user)):
    """Retrieve all assets for a specific site."""
    await asyncio.sleep(0.7)
    assets = [asset for asset in MOCK_MAINTENANCE_ASSETS if asset.siteId == site_id]
    return sorted(assets, key=lambda x: x.rank)

@router.post("/assets", response_model=models.MaintenanceAsset, status_code=status.HTTP_201_CREATED)
async def create_asset(asset_data: models.AssetCreate, current_user: models.User = Depends(get_current_user)):
    """Create a new asset."""
    await asyncio.sleep(1)
    # Simulate calculating rank and failure probability
    new_asset = models.MaintenanceAsset(
        **asset_data.dict(),
        failure_probability=round(random.uniform(0.05, 0.6), 2),
        rank=random.randint(0, 10)
    )
    MOCK_MAINTENANCE_ASSETS.append(new_asset)
    return new_asset

@router.put("/{asset_id}", response_model=models.MaintenanceAsset)
async def update_asset(asset_id: str, asset_data: models.MaintenanceAsset, current_user: models.User = Depends(get_current_user)):
    """Update an existing asset."""
    await asyncio.sleep(1)
    for i, asset in enumerate(MOCK_MAINTENANCE_ASSETS):
        if asset.id == asset_id:
            updated_asset = asset_data.copy(update={"id": asset_id})
            MOCK_MAINTENANCE_ASSETS[i] = updated_asset
            return updated_asset
    raise HTTPException(status_code=404, detail="Asset not found")

@router.delete("/{asset_id}", response_model=dict)
async def delete_asset(asset_id: str, current_user: models.User = Depends(get_current_user)):
    """Delete an asset."""
    await asyncio.sleep(1)
    asset_found = False
    for i, asset in enumerate(MOCK_MAINTENANCE_ASSETS):
        if asset.id == asset_id:
            MOCK_MAINTENANCE_ASSETS.pop(i)
            asset_found = True
            break
    if not asset_found:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"success": True}