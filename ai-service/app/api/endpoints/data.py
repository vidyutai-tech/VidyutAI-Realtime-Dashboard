# ems-backend/app/api/endpoints/data.py

import asyncio
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.models import pydantic_models as models
from app.data.mock_data import MOCK_ALERTS
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/sites/{site_id}/health-status", response_model=models.HealthStatus)
async def get_health_status(site_id: str, current_user: models.User = Depends(get_current_user)):
    """Get the current health status of a site."""
    await asyncio.sleep(0.6)
    return models.HealthStatus(
        site_health=round(random.uniform(90, 99.5), 2),
        grid_draw=round(random.uniform(50, 200), 2),
        battery_soc=round(random.uniform(40, 95), 2),
        pv_generation_today=round(random.uniform(500, 2000), 2),
        battery_soh=round(random.uniform(95, 99.8), 2),
        inverter_health=round(random.uniform(98, 100), 2),
        motor_health=round(random.uniform(97, 99.9), 2),
        pv_health=round(random.uniform(96, 99.5), 2),
        ev_charger_health=round(random.uniform(99, 100), 2),
    )

@router.get("/sites/{site_id}/alerts", response_model=List[models.Alert])
async def get_alerts(site_id: str, current_user: models.User = Depends(get_current_user)):
    """Get all alerts for a site."""
    await asyncio.sleep(0.8)
    return MOCK_ALERTS.get(site_id, [])

@router.get("/sites/{site_id}/timeseries", response_model=List[models.Telemetry])
# FIX: Renamed the 'range' parameter to 'time_range' to avoid conflict
async def get_timeseries_data(site_id: str, time_range: str = Query("1h", alias="range"), current_user: models.User = Depends(get_current_user)):
    """Get timeseries telemetry data."""
    # The 'time_range' variable now holds the query string (e.g., "1h")
    # but it's not used in this mock function.
    await asyncio.sleep(1.2)
    
    data = []
    now = datetime.utcnow()
    # Now, 'range(60)' correctly refers to the built-in function
    for i in range(60): 
        timestamp = now - timedelta(minutes=i)
        data.append(models.Telemetry(
            timestamp=timestamp,
            site_id=site_id,
            device_id="asset_a1",
            subsystem="Inverter",
            metrics=models.TelemetryMetrics(
                voltage=round(random.uniform(228, 232), 2),
                current=round(random.uniform(14, 16), 2),
                frequency=round(random.uniform(59.9, 60.1), 2),
                temp_c=round(random.uniform(45, 55), 2),
                pv_generation=round(random.uniform(100, 150), 2)
            )
        ))
    return data

@router.get("/assets/{asset_id}/digital-twin", response_model=Dict[str, Any])
async def get_digital_twin_data(asset_id: str, current_user: models.User = Depends(get_current_user)):
    """Get digital twin data for a specific asset."""
    await asyncio.sleep(1.5)
    base_temp = 50.0
    base_vibration = 0.5
    
    data_points = [
        models.DigitalTwinDataPoint(id="dt_temp", label="Casing Temperature", unit="°C", x=100, y=150, real_value=round(base_temp + random.uniform(-1, 1), 2), predicted_value=round(base_temp + random.uniform(-0.5, 0.5), 2)),
        models.DigitalTwinDataPoint(id="dt_vib", label="Vibration (X-axis)", unit="g", x=200, y=250, real_value=round(base_vibration + random.uniform(-0.05, 0.05), 3), predicted_value=round(base_vibration, 3)),
        models.DigitalTwinDataPoint(id="dt_rpm", label="Rotational Speed", unit="RPM", x=300, y=100, real_value=round(1500 + random.uniform(-10, 10), 0), predicted_value=1500),
    ]
    
    anomalies = [
        models.Anomaly(id="anom_1", timestamp=datetime.utcnow() - timedelta(hours=3), data_point_id="dt_temp", data_point_label="Casing Temperature", severity="medium", message="Sustained temperature above 55°C threshold."),
    ]
    
    return {"dataPoints": data_points, "anomalies": anomalies}