# ems-backend/app/api/endpoints/sites.py

import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models import pydantic_models as models
from app.data.mock_data import MOCK_SITES
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[models.Site])
async def read_sites(current_user: models.User = Depends(get_current_user)):
    """Retrieve all sites."""
    await asyncio.sleep(0.5) # Simulate latency
    return MOCK_SITES

@router.post("", response_model=models.Site, status_code=status.HTTP_201_CREATED)
async def create_site(site_data: models.SiteCreate, current_user: models.User = Depends(get_current_user)):
    """Create a new site."""
    await asyncio.sleep(1)
    new_site = models.Site(**site_data.dict())
    MOCK_SITES.append(new_site)
    return new_site

@router.put("/{site_id}", response_model=models.Site)
async def update_site(site_id: str, site_data: models.Site, current_user: models.User = Depends(get_current_user)):
    """Update an existing site."""
    await asyncio.sleep(1)
    for i, site in enumerate(MOCK_SITES):
        if site.id == site_id:
            updated_site = site_data.copy(update={"id": site_id})
            MOCK_SITES[i] = updated_site
            return updated_site
    raise HTTPException(status_code=404, detail="Site not found")

@router.delete("/{site_id}", response_model=dict)
async def delete_site(site_id: str, current_user: models.User = Depends(get_current_user)):
    """Delete a site."""
    await asyncio.sleep(1)
    site_found = False
    for i, site in enumerate(MOCK_SITES):
        if site.id == site_id:
            MOCK_SITES.pop(i)
            site_found = True
            break
    if not site_found:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"success": True}