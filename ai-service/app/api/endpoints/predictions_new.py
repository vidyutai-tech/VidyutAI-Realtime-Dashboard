"""
AI Predictions API Endpoints
Provides inference for:
1. Battery RUL Prediction
2. Solar Panel Degradation
3. Energy Loss Analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import json

from app.api.deps import get_current_user
from app.models import pydantic_models as models

router = APIRouter()
models_dir = Path("app/ml-models")

# Global models dict
prediction_models = {}

# Load models on startup
def load_prediction_models():
    """Load all prediction models"""
    global prediction_models
    
    try:
        # Battery RUL Model
        battery_model_path = models_dir / "battery_rul_model.joblib"
        battery_scaler_path = models_dir / "battery_rul_scaler.joblib"
        battery_meta_path = models_dir / "battery_rul_metadata.json"
        
        if battery_model_path.exists():
            prediction_models['battery_rul'] = {
                'model': joblib.load(battery_model_path),
                'scaler': joblib.load(battery_scaler_path),
                'metadata': json.load(open(battery_meta_path))
            }
            print("✅ Battery RUL Model loaded")
        
        # Solar Degradation Model  
        solar_model_path = models_dir / "solar_degradation_model.joblib"
        solar_scaler_path = models_dir / "solar_degradation_scaler.joblib"
        solar_meta_path = models_dir / "solar_degradation_metadata.json"
        
        if solar_model_path.exists():
            prediction_models['solar_degradation'] = {
                'model': joblib.load(solar_model_path),
                'scaler': joblib.load(solar_scaler_path),
                'metadata': json.load(open(solar_meta_path))
            }
            print("✅ Solar Degradation Model loaded")
        
        # Energy Loss Model
        loss_model_path = models_dir / "energy_loss_model.joblib"
        loss_scaler_path = models_dir / "energy_loss_scaler.joblib"
        loss_meta_path = models_dir / "energy_loss_metadata.json"
        
        if loss_model_path.exists():
            prediction_models['energy_loss'] = {
                'model': joblib.load(loss_model_path),
                'scaler': joblib.load(loss_scaler_path),
                'metadata': json.load(open(loss_meta_path))
            }
            print("✅ Energy Loss Model loaded")
            
    except Exception as e:
        print(f"⚠️ Error loading prediction models: {e}")

# Load models immediately
load_prediction_models()

# Pydantic Models
class BatteryRULInput(BaseModel):
    cycle_count: float = Field(..., description="Number of charge/discharge cycles")
    temperature_c: float = Field(..., description="Battery temperature in Celsius")
    voltage_v: float = Field(..., description="Battery voltage")
    current_a: float = Field(..., description="Current in Amperes")
    soc_percent: float = Field(..., description="State of Charge percentage")
    discharge_rate: float = Field(..., description="C-rate for discharge")
    charge_rate: float = Field(..., description="C-rate for charge")
    age_days: int = Field(..., description="Battery age in days")

class SolarDegradationInput(BaseModel):
    age_years: float = Field(..., description="Solar panel age in years")
    irradiance_wm2: float = Field(..., description="Solar irradiance W/m²")
    temperature_c: float = Field(..., description="Panel temperature in Celsius")
    dust_index: float = Field(..., description="Dust accumulation index 0-100")
    humidity_percent: float = Field(..., description="Humidity percentage")
    tilt_angle_deg: float = Field(..., description="Panel tilt angle in degrees")
    efficiency_initial: float = Field(..., description="Initial efficiency percentage")

class EnergyLossInput(BaseModel):
    load_kw: float = Field(..., description="Load in kilowatts")
    voltage_v: float = Field(..., description="System voltage")
    current_a: float = Field(..., description="Current in Amperes")
    power_factor: float = Field(..., description="Power factor 0-1")
    cable_length_m: float = Field(..., description="Cable length in meters")
    transformer_load_percent: float = Field(..., description="Transformer loading percentage")
    ambient_temp_c: float = Field(..., description="Ambient temperature")
    frequency_hz: float = Field(..., description="Frequency in Hz")

# API Endpoints

@router.post("/predictions/battery-rul")
async def predict_battery_rul(
    input_data: BatteryRULInput,
    current_user: models.User = Depends(get_current_user)
):
    """Predict Battery Remaining Useful Life"""
    
    if 'battery_rul' not in prediction_models:
        raise HTTPException(status_code=503, detail="Battery RUL model not available. Run training script first.")
    
    model_data = prediction_models['battery_rul']
    features = model_data['metadata']['features']
    
    # Prepare input
    input_df = pd.DataFrame([[
        input_data.cycle_count,
        input_data.temperature_c,
        input_data.voltage_v,
        input_data.current_a,
        input_data.soc_percent,
        input_data.discharge_rate,
        input_data.charge_rate,
        input_data.age_days
    ]], columns=features)
    
    # Scale and predict
    input_scaled = model_data['scaler'].transform(input_df)
    prediction = model_data['model'].predict(input_scaled)[0]
    
    # Calculate confidence interval (95%)
    rmse = model_data['metadata']['metrics']['rmse']
    ci_lower = max(0, prediction - 1.96 * rmse)
    ci_upper = prediction + 1.96 * rmse
    
    return {
        'success': True,
        'prediction': {
            'rul_hours': float(prediction),
            'rul_days': float(prediction / 24),
            'confidence_interval': {
                'lower': float(ci_lower),
                'upper': float(ci_upper)
            }
        },
        'model_info': {
            'type': model_data['metadata']['model_type'],
            'r2_score': model_data['metadata']['metrics']['r2'],
            'mae': model_data['metadata']['metrics']['mae']
        },
        'health_status': 'Good' if prediction > 2000 else ('Warning' if prediction > 500 else 'Critical')
    }

@router.post("/predictions/solar-degradation")
async def predict_solar_degradation(
    input_data: SolarDegradationInput,
    current_user: models.User = Depends(get_current_user)
):
    """Predict Solar Panel Degradation"""
    
    if 'solar_degradation' not in prediction_models:
        raise HTTPException(status_code=503, detail="Solar degradation model not available")
    
    model_data = prediction_models['solar_degradation']
    features = model_data['metadata']['features']
    
    # Prepare input
    input_df = pd.DataFrame([[
        input_data.age_years,
        input_data.irradiance_wm2,
        input_data.temperature_c,
        input_data.dust_index,
        input_data.humidity_percent,
        input_data.tilt_angle_deg,
        input_data.efficiency_initial
    ]], columns=features)
    
    # Scale and predict
    input_scaled = model_data['scaler'].transform(input_df)
    degradation = model_data['model'].predict(input_scaled)[0]
    
    # Calculate current efficiency
    current_efficiency = input_data.efficiency_initial * (1 - degradation / 100)
    
    # Calculate confidence interval
    rmse = model_data['metadata']['metrics']['rmse']
    ci_lower = max(0, degradation - 1.96 * rmse)
    ci_upper = min(100, degradation + 1.96 * rmse)
    
    return {
        'success': True,
        'prediction': {
            'degradation_percent': float(degradation),
            'current_efficiency': float(current_efficiency),
            'initial_efficiency': input_data.efficiency_initial,
            'confidence_interval': {
                'lower': float(ci_lower),
                'upper': float(ci_upper)
            }
        },
        'model_info': {
            'type': model_data['metadata']['model_type'],
            'r2_score': model_data['metadata']['metrics']['r2'],
            'mae': model_data['metadata']['metrics']['mae']
        },
        'performance_status': 'Excellent' if degradation < 10 else ('Good' if degradation < 20 else 'Needs Maintenance')
    }

@router.post("/predictions/energy-loss")
async def predict_energy_loss(
    input_data: EnergyLossInput,
    current_user: models.User = Depends(get_current_user)
):
    """Predict Energy Loss in Distribution System"""
    
    if 'energy_loss' not in prediction_models:
        raise HTTPException(status_code=503, detail="Energy loss model not available")
    
    model_data = prediction_models['energy_loss']
    features = model_data['metadata']['features']
    
    # Prepare input
    input_df = pd.DataFrame([[
        input_data.load_kw,
        input_data.voltage_v,
        input_data.current_a,
        input_data.power_factor,
        input_data.cable_length_m,
        input_data.transformer_load_percent,
        input_data.ambient_temp_c,
        input_data.frequency_hz
    ]], columns=features)
    
    # Scale and predict
    input_scaled = model_data['scaler'].transform(input_df)
    loss_percent = model_data['model'].predict(input_scaled)[0]
    
    # Calculate actual loss
    loss_kw = input_data.load_kw * (loss_percent / 100)
    annual_loss_kwh = loss_kw * 8760  # Annual hours
    annual_cost_inr = annual_loss_kwh * 7  # ₹7/kWh average
    
    # Calculate confidence interval
    rmse = model_data['metadata']['metrics']['rmse']
    ci_lower = max(0, loss_percent - 1.96 * rmse)
    ci_upper = min(100, loss_percent + 1.96 * rmse)
    
    return {
        'success': True,
        'prediction': {
            'loss_percent': float(loss_percent),
            'loss_kw': float(loss_kw),
            'annual_loss_kwh': float(annual_loss_kwh),
            'annual_cost_inr': float(annual_cost_inr),
            'confidence_interval': {
                'lower': float(ci_lower),
                'upper': float(ci_upper)
            }
        },
        'model_info': {
            'type': model_data['metadata']['model_type'],
            'r2_score': model_data['metadata']['metrics']['r2'],
            'mae': model_data['metadata']['metrics']['mae']
        },
        'efficiency_status': 'Excellent' if loss_percent < 3 else ('Good' if loss_percent < 6 else 'Needs Optimization')
    }

@router.get("/predictions/battery-rul/dashboard")
async def get_battery_rul_dashboard():
    """Get Battery RUL dashboard with sample predictions"""
    
    if 'battery_rul' not in prediction_models:
        raise HTTPException(status_code=503, detail="Battery RUL model not available")
    
    model_data = prediction_models['battery_rul']
    
    # Generate sample predictions for visualization
    np.random.seed(42)
    n_samples = 50
    
    predictions = []
    for i in range(n_samples):
        cycle_count = i * 60  # Progressive cycles
        temp = np.random.normal(25, 5)
        age_days = i * 30  # Progressive aging
        
        input_df = pd.DataFrame([[
            cycle_count, temp, 48, 20, 75, 0.5, 0.5, age_days
        ]], columns=model_data['metadata']['features'])
        
        input_scaled = model_data['scaler'].transform(input_df)
        rul = model_data['model'].predict(input_scaled)[0]
        
        predictions.append({
            'cycle_count': int(cycle_count),
            'age_days': int(age_days),
            'rul_hours': float(rul),
            'rul_days': float(rul / 24)
        })
    
    return {
        'success': True,
        'predictions': predictions,
        'model_info': model_data['metadata']['metrics']
    }

@router.get("/predictions/solar-degradation/dashboard")
async def get_solar_degradation_dashboard():
    """Get Solar Degradation dashboard with sample predictions"""
    
    if 'solar_degradation' not in prediction_models:
        raise HTTPException(status_code=503, detail="Solar degradation model not available")
    
    model_data = prediction_models['solar_degradation']
    
    # Generate sample predictions over panel lifetime
    predictions = []
    for age in range(0, 26):  # 0-25 years
        input_df = pd.DataFrame([[
            age, 800, 35, 30, 60, 20, 18
        ]], columns=model_data['metadata']['features'])
        
        input_scaled = model_data['scaler'].transform(input_df)
        degradation = model_data['model'].predict(input_scaled)[0]
        current_eff = 18 * (1 - degradation / 100)
        
        predictions.append({
            'age_years': age,
            'degradation_percent': float(degradation),
            'efficiency_current': float(current_eff),
            'efficiency_initial': 18.0
        })
    
    return {
        'success': True,
        'predictions': predictions,
        'model_info': model_data['metadata']['metrics']
    }

@router.get("/predictions/energy-loss/dashboard")
async def get_energy_loss_dashboard():
    """Get Energy Loss dashboard with sample predictions"""
    
    if 'energy_loss' not in prediction_models:
        raise HTTPException(status_code=503, detail="Energy loss model not available")
    
    model_data = prediction_models['energy_loss']
    
    # Generate predictions for different load scenarios
    predictions = []
    load_values = np.linspace(50, 500, 30)
    
    for load in load_values:
        voltage = 415
        current = load * 1000 / (voltage * np.sqrt(3) * 0.9)
        
        input_df = pd.DataFrame([[
            load, voltage, current, 0.9, 200, 75, 30, 50
        ]], columns=model_data['metadata']['features'])
        
        input_scaled = model_data['scaler'].transform(input_df)
        loss_percent = model_data['model'].predict(input_scaled)[0]
        loss_kw = load * (loss_percent / 100)
        
        predictions.append({
            'load_kw': float(load),
            'loss_percent': float(loss_percent),
            'loss_kw': float(loss_kw),
            'efficiency_percent': float(100 - loss_percent)
        })
    
    return {
        'success': True,
        'predictions': predictions,
        'model_info': model_data['metadata']['metrics']
    }

