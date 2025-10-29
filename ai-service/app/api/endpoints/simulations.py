# ems-backend/app/api/endpoints/simulations.py

import asyncio
import random
from typing import List, Literal,Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import numpy as np
from datetime import datetime # <-- Added datetime import

from app.models import pydantic_models as models
from app.api.deps import get_current_user
from app.data.mock_data import MOCK_RL_SUGGESTIONS # <-- Added import for suggestions list

from datetime import datetime, timedelta
from app.data.mock_data import LAST_SUGGESTION_ACTION

#
# --- Pydantic Models for Smart Simulator Inputs ---

class VibrationInput(BaseModel):
    features: List[float] = Field(..., min_length=24, max_length=24)

class SmartSolarInput(BaseModel):
    weather: Literal['sunny', 'cloudy', 'rainy'] = 'sunny'

class MotorFaultInput(BaseModel):
    features: List[float] = Field(..., min_length=40, max_length=40)

# ADDED: Input model for our RL Simulator
class RLSuggestionInput(BaseModel):
    site_id: str
    battery_soc: float
    grid_price: float
    hour_of_day: int
    solar_forecast: float

# --- API Endpoints ---

router = APIRouter()

@router.post("/simulate", response_model=models.SimulationResult)
async def run_simulation(params: models.SimulationParams, current_user: models.User = Depends(get_current_user)):
    """
    Smarter simulation that now considers grid price in its calculations.
    """
    await asyncio.sleep(1.5)
    
    price_multiplier = 1 + (params.gridPrice / 100)
    base_cost = (1000 - (params.pvCurtail * 10) + (params.batteryTarget * 2)) * price_multiplier
    base_emissions = 500 - (params.pvCurtail * 5)

    cost = [base_cost + random.uniform(-50, 50) for _ in range(24)]
    emissions = [base_emissions + random.uniform(-20, 20) for _ in range(24)]
    
    return {"cost": cost, "emissions": emissions}


@router.post("/predict/vibration", response_model=dict)
async def predict_vibration(input_data: Optional[VibrationInput] = None, current_user: models.User = Depends(get_current_user)):
    """
    If input_data is provided, uses smart simulation. Otherwise, returns a random prediction.
    """
    await asyncio.sleep(0.9)
    
    if input_data:
        # Smart simulator logic (if data is provided)
        rms = np.sqrt(np.mean(np.square(input_data.features)))
        pred = "Nominal"
        conf = round(random.uniform(0.90, 0.99), 2)
        if rms > 0.8:
            pred = "Misalignment Fault"
            conf = round(random.uniform(0.85, 0.95), 2)
        elif rms > 0.5:
            pred = "Bearing Wear Detected"
            conf = round(random.uniform(0.75, 0.84), 2)
    else:
        # Fallback random logic (if request is empty)
        pred = random.choice(["Nominal", "Bearing Wear Detected", "Misalignment Fault"])
        conf = round(random.uniform(0.75, 0.98), 2)
        
    return {"prediction": pred, "confidence": conf}


@router.post("/predict/solar", response_model=dict)
async def predict_solar(input_data: Optional[SmartSolarInput] = None, current_user: models.User = Depends(get_current_user)):
    """
    If input_data is provided, uses smart simulation. Otherwise, returns a default sunny day forecast.
    """
    await asyncio.sleep(1.5)
    
    base_forecast = [max(0, 1000 * (-(i - 48)**2 / 1000 + 1)) for i in range(96)]
    weather = input_data.weather if input_data else 'sunny'

    if weather == 'cloudy':
        forecast = [val * random.uniform(0.4, 0.6) + random.uniform(-40, 40) for val in base_forecast]
    elif weather == 'rainy':
        forecast = [val * random.uniform(0.1, 0.25) + random.uniform(-20, 20) for val in base_forecast]
    else: # 'sunny'
        forecast = [val + random.uniform(-50, 50) for val in base_forecast]
        
    return {"prediction": np.maximum(0, forecast).tolist()}


@router.post("/predict/motor-fault", response_model=dict)
async def predict_motor_fault(input_data: Optional[MotorFaultInput] = None, current_user: models.User = Depends(get_current_user)):
    """
    If input_data is provided, uses smart simulation. Otherwise, returns a random prediction.
    """
    await asyncio.sleep(1.2)
    
    if input_data:
        # Smart simulator logic (if data is provided)
        simulated_temp_features = input_data.features[-5:]
        avg_temp_metric = np.mean(simulated_temp_features)
        if avg_temp_metric > 0.75:
            pred = "Stator Winding Fault Imminent"
            conf = round(random.uniform(0.88, 0.95), 2)
        else:
            pred = "No Fault Expected"
            conf = round(random.uniform(0.96, 0.99), 2)
    else:
        # Fallback random logic (if request is empty)
        pred = random.choice(["No Fault Expected", "Stator Winding Fault Imminent"])
        conf = round(random.uniform(0.88, 0.99), 2)

    return {"prediction": pred, "confidence": conf}
# --- ADDED: RL SUGGESTION SMART SIMULATOR ---
@router.post("/predict/rl-suggestion", response_model=models.RLSuggestion)
async def get_rl_suggestion(input_data: RLSuggestionInput, current_user: models.User = Depends(get_current_user)):
    """
    Simulates an RL agent's decision using a set of smart rules (heuristics).
    """
    
    cooldown_period = timedelta(minutes=5)
    last_action_time = LAST_SUGGESTION_ACTION.get(input_data.site_id)

    if last_action_time and (datetime.now() - last_action_time) < cooldown_period:
        # If we are in the cooldown period, do not generate a new suggestion.
        # We can raise an exception that the frontend can ignore.
        raise HTTPException(status_code=204, detail="In suggestion cooldown period.")
    # --- END OF COOLDOWN CHECK ---
    HIGH_GRID_PRICE = 7.0
    LOW_GRID_PRICE = 3.0
    HIGH_SOLAR_FORECAST = 500
    BATTERY_MIN_FOR_SELLING = 50.0
    BATTERY_MAX_FOR_CHARGING = 90.0

    action_summary = "Hold current state. Operation is optimal."
    explanation = ["Current grid price and load levels are nominal.", "No profitable action is available."]

    if input_data.grid_price > HIGH_GRID_PRICE and input_data.battery_soc > BATTERY_MIN_FOR_SELLING:
        action_summary = "Sell battery power to the grid to maximize profit."
        explanation = [f"Grid price is high at ₹{input_data.grid_price}/kWh.", "Selling stored energy is highly profitable right now."]
    elif input_data.grid_price < LOW_GRID_PRICE and input_data.battery_soc < BATTERY_MAX_FOR_CHARGING:
        action_summary = "Charge battery from the grid while prices are low."
        explanation = [f"Grid price is very low at ₹{input_data.grid_price}/kWh.", "Charging now will save money later in the day."]
    elif input_data.grid_price > HIGH_GRID_PRICE and input_data.battery_soc > 20:
        action_summary = "Discharge battery to power the site and avoid high grid costs."
        explanation = [f"Grid price is high at ₹{input_data.grid_price}/kWh.", "Using stored energy is cheaper than buying from the grid."]
    elif input_data.solar_forecast > HIGH_SOLAR_FORECAST and input_data.battery_soc < BATTERY_MAX_FOR_CHARGING:
        action_summary = "Prioritize charging the battery with available solar power."
        explanation = [f"High solar generation of {input_data.solar_forecast} kW is predicted.", "Storing this free energy is the most efficient action."]

    new_suggestion = models.RLSuggestion(
        timestamp=datetime.now(),
        action_summary=action_summary,
        explanation=explanation,
        confidence=round(random.uniform(0.90, 0.98), 2),
        estimated_cost_savings=round(random.uniform(5000, 25000), 2) if "Hold" not in action_summary else 0,
        status="pending",
        current_flows=models.EnergyFlows(grid_to_load=5, pv_to_load=2, pv_to_battery=1, battery_to_load=0, battery_to_grid=0, pv_to_grid=0),
        suggested_flows=models.EnergyFlows(grid_to_load=0, pv_to_load=2, pv_to_battery=0, battery_to_load=5, battery_to_grid=1, pv_to_grid=0)
    )

    if input_data.site_id not in MOCK_RL_SUGGESTIONS:
        MOCK_RL_SUGGESTIONS[input_data.site_id] = []
    MOCK_RL_SUGGESTIONS[input_data.site_id].insert(0, new_suggestion)
    
    return new_suggestion