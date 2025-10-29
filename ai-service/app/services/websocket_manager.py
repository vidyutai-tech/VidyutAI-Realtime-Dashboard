# ems-backend/app/services/websocket_manager.py

import asyncio
import random
from datetime import datetime
import json # <-- Import the json library
from pydantic.json import pydantic_encoder # <-- Import Pydantic's special encoder
from fastapi import WebSocket, WebSocketDisconnect

from app.models.pydantic_models import Telemetry, TelemetryMetrics, Alert, RLSuggestion, EnergyFlows

# This is the updated, security-removed version from your previous request
async def websocket_handler(websocket: WebSocket, site_id: str):
    """Handles WebSocket connections and streams data."""
    
    await websocket.accept()
    
    try:
        event_counter = 0
        while True:
            await asyncio.sleep(2)
            event_counter += 1

            # --- Default: Send Telemetry Update ---
            telemetry_data = Telemetry(
                timestamp=datetime.utcnow(),
                site_id=site_id,
                device_id="main_grid_tie",
                subsystem="Grid",
                metrics=TelemetryMetrics(
                    voltage=round(random.uniform(229, 231), 2),
                    current=round(random.uniform(95, 105), 2),
                    frequency=round(random.uniform(59.95, 60.05), 2),
                    temp_c=round(random.uniform(30, 35), 2),
                    net_load=round(random.uniform(150, 300), 2),
                )
            )
            # FIX: Manually create JSON string using pydantic_encoder and send as text
            message = {"type": "telemetry_update", "payload": telemetry_data.dict()}
            json_string = json.dumps(message, default=pydantic_encoder)
            await websocket.send_text(json_string)

            # --- Occasionally Send an Alert (every 5 cycles) ---
            if event_counter % 5 == 0:
                new_alert = Alert(
                    timestamp=datetime.utcnow(),
                    device_id=random.choice(["asset_a1", "asset_b1", "asset_c1"]),
                    severity=random.choice(["warning", "info"]),
                    message="Voltage fluctuation detected",
                    diagnosis="Possible grid instability or internal load change.",
                    recommended_action="Monitor system, no immediate action required.",
                    status="active"
                )
                # FIX: Apply the same fix here
                message = {"type": "new_alert", "payload": new_alert.dict()}
                json_string = json.dumps(message, default=pydantic_encoder)
                await websocket.send_text(json_string)

            # --- Occasionally Send an RL Suggestion (every 8 cycles) ---
            if event_counter % 8 == 0:
                new_suggestion = RLSuggestion(
                    timestamp=datetime.utcnow(),
                    action_summary="Discharge battery to offset peak load",
                    explanation=["Grid demand is approaching a peak.", "Discharging battery can reduce costs."],
                    confidence=0.88,
                    estimated_cost_savings=75.50,
                    status="pending",
                    current_flows=EnergyFlows(grid_to_load=250, pv_to_load=50, pv_to_battery=10, battery_to_load=0, battery_to_grid=0, pv_to_grid=0),
                    suggested_flows=EnergyFlows(grid_to_load=150, pv_to_load=50, pv_to_battery=10, battery_to_load=100, battery_to_grid=0, pv_to_grid=0)
                )
                # FIX: And apply the same fix here
                message = {"type": "rl_suggestion", "payload": new_suggestion.dict()}
                json_string = json.dumps(message, default=pydantic_encoder)
                await websocket.send_text(json_string)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for site {site_id}")
    except Exception as e:
        print(f"Error in WebSocket for site {site_id}: {e}")