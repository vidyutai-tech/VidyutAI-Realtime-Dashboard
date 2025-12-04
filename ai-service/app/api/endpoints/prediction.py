# ems-backend/app/api/endpoints/simulations.py

import asyncio
import random
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
import xgboost as xgb
from pathlib import Path

from app.models import pydantic_models as models
from app.api.deps import get_current_user
from app.data.mock_data import MOCK_RL_SUGGESTIONS

# Import RLSuggestionInput from models
RLSuggestionInput = models.RLSuggestionInput

# --- Pydantic Models for ML Input ---

class VibrationInput(BaseModel):
    features: List[float] = Field(
        ...,
        description="A list of 24 numerical features for vibration diagnosis.",
        min_length=24,
        max_length=24
    )

class SolarInput(BaseModel):
    sequence: List[List[float]]

    @field_validator('sequence')
    def check_sequence_shape(cls, v):
        if len(v) != 24:
            raise ValueError('Sequence must have 24 timesteps.')
        if not all(len(row) == 2 for row in v):
            raise ValueError('Each timestep in the sequence must have 2 features.')
        return v

class MotorFaultInput(BaseModel):
    features: List[float] = Field(
        ...,
        description="A list of 40 numerical features for multi-sensor motor fault diagnosis.",
        min_length=40,
        max_length=40
    )

class IITGNEnergyForecastInput(BaseModel):
    features: dict = Field(
        ...,
        description="Dictionary of feature values for energy forecasting (flexible feature names)"
    )

class IITGNAnomalyDetectionInput(BaseModel):
    features: dict = Field(
        ...,
        description="Dictionary of feature values for anomaly detection (flexible feature names)"
    )

# Battery RUL model removed - feature marked as "Coming Soon"


# --- Load ML Models on Startup ---

router = APIRouter()
models_dir = Path("app/ml-models")
ml_models = {}

try:
    # 1. Load Vibration Diagnosis Model (RandomForest)
    ml_models["vibration_model"] = joblib.load(models_dir / "vibration_model.joblib")
    ml_models["vibration_scaler"] = joblib.load(models_dir / "vibration_scaler.joblib")
    ml_models["vibration_label_encoder"] = joblib.load(models_dir / "vibration_label_encoder.joblib")
    ml_models["vibration_features"] = joblib.load(models_dir / "vibration_model_features.json")

    # 2. Load Solar Forecast Model (LSTM)
    ml_models["solar_model"] = tf.keras.models.load_model(models_dir / "lstm_solar_forecast_model.keras")
    ml_models["solar_scaler"] = joblib.load(models_dir / "lstm_solar_scaler.joblib")
    
    # 3. Load Motor Fault Diagnosis Model (XGBoost)
    ml_models["motor_fault_model"] = xgb.XGBClassifier()
    ml_models["motor_fault_model"].load_model(models_dir / "motor_fault_model.json")
    ml_models["motor_fault_scaler"] = joblib.load(models_dir / "scaler.joblib")
    ml_models["motor_fault_label_encoder"] = joblib.load(models_dir / "label_encoder.joblib")
    
    print("✅ All ML models loaded successfully.")
except FileNotFoundError as e:
    print(f"⚠️  Some ML models not found: {e}. Continuing with available models.")
    ml_models = {}

# Load IITGN-trained models (optional, trained from real data)
try:
    import json
    # IITGN Energy Forecast Model
    iitgn_forecast_model_path = models_dir / "iitgn_energy_forecast_model.joblib"
    iitgn_forecast_scaler_path = models_dir / "iitgn_energy_forecast_scaler.joblib"
    iitgn_forecast_info_path = models_dir / "iitgn_energy_forecast_info.json"
    
    if iitgn_forecast_model_path.exists() and iitgn_forecast_scaler_path.exists():
        ml_models["iitgn_forecast_model"] = joblib.load(iitgn_forecast_model_path)
        ml_models["iitgn_forecast_scaler"] = joblib.load(iitgn_forecast_scaler_path)
        if iitgn_forecast_info_path.exists():
            with open(iitgn_forecast_info_path, 'r') as f:
                ml_models["iitgn_forecast_info"] = json.load(f)
        print("✅ IITGN Energy Forecast Model loaded successfully.")
    
    # IITGN Anomaly Detection Model
    iitgn_anomaly_model_path = models_dir / "iitgn_anomaly_detection_model.joblib"
    iitgn_anomaly_scaler_path = models_dir / "iitgn_anomaly_detection_scaler.joblib"
    iitgn_anomaly_info_path = models_dir / "iitgn_anomaly_detection_info.json"
    
    if iitgn_anomaly_model_path.exists() and iitgn_anomaly_scaler_path.exists():
        ml_models["iitgn_anomaly_model"] = joblib.load(iitgn_anomaly_model_path)
        ml_models["iitgn_anomaly_scaler"] = joblib.load(iitgn_anomaly_scaler_path)
        if iitgn_anomaly_info_path.exists():
            with open(iitgn_anomaly_info_path, 'r') as f:
                ml_models["iitgn_anomaly_info"] = json.load(f)
        print("✅ IITGN Anomaly Detection Model loaded successfully.")
except Exception as e:
    print(f"⚠️  IITGN models not available: {e}. Run training script to generate them.")

# Battery RUL model loading removed - feature marked as "Coming Soon"


# --- API Endpoints ---

@router.post("/simulate", response_model=models.SimulationResult)
async def run_simulation(params: models.SimulationParams, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(1.0)
    base_cost = 1000 - params.pvCurtail * 10
    base_emissions = 500 - params.pvCurtail * 5
    cost = [base_cost + random.uniform(-50, 50) for _ in range(24)]
    emissions = [base_emissions + random.uniform(-20, 20) for _ in range(24)]
    return {"cost": cost, "emissions": emissions}

@router.post("/predict/vibration", response_model=dict)
async def predict_vibration(input_data: VibrationInput, current_user: models.User = Depends(get_current_user)):
    if not ml_models:
        raise HTTPException(status_code=503, detail="ML models are not available.")
    
    input_df = pd.DataFrame([input_data.features], columns=ml_models["vibration_features"])
    scaled_features = ml_models["vibration_scaler"].transform(input_df)
    prediction_encoded = ml_models["vibration_model"].predict(scaled_features)
    probabilities = ml_models["vibration_model"].predict_proba(scaled_features)
    prediction_decoded = ml_models["vibration_label_encoder"].inverse_transform(prediction_encoded)
    confidence = probabilities[0][prediction_encoded[0]]
    
    return {"prediction": prediction_decoded[0], "confidence": float(confidence)}

@router.post("/predict/solar", response_model=dict)
async def predict_solar(input_data: SolarInput, current_user: models.User = Depends(get_current_user)):
    if not ml_models:
        raise HTTPException(status_code=503, detail="ML models are not available.")

    input_sequence = np.array(input_data.sequence)
    scaled_sequence = ml_models["solar_scaler"].transform(input_sequence)
    
    look_back = 24
    future_predictions_scaled = []
    current_window = list(scaled_sequence)

    for _ in range(96):
        input_for_prediction = np.array([current_window[-look_back:]])
        predicted_power_scaled = ml_models["solar_model"].predict(input_for_prediction, verbose=0)[0][0]
        future_predictions_scaled.append(predicted_power_scaled)
        new_step = [0, predicted_power_scaled]
        current_window.append(new_step)

    dummy_irradiation = np.zeros((len(future_predictions_scaled), 1))
    predictions_to_inverse = np.hstack([dummy_irradiation, np.array(future_predictions_scaled).reshape(-1, 1)])
    inversed_predictions = ml_models["solar_scaler"].inverse_transform(predictions_to_inverse)
    final_forecast = np.maximum(0, inversed_predictions[:, 1]).tolist()

    return {"prediction": final_forecast}

@router.post("/predict/motor-fault", response_model=dict)
async def predict_motor_fault(input_data: MotorFaultInput, current_user: models.User = Depends(get_current_user)):
    if not ml_models:
        raise HTTPException(status_code=503, detail="ML models are not available.")
    
    # Since feature names aren't provided, we create a generic DataFrame
    input_df = pd.DataFrame([input_data.features])
    
    # Preprocess (Scale) the data
    scaled_features = ml_models["motor_fault_scaler"].transform(input_df)
    
    # Predict using the XGBoost model
    prediction_encoded = ml_models["motor_fault_model"].predict(scaled_features)
    probabilities = ml_models["motor_fault_model"].predict_proba(scaled_features)
    
    # Post-process (Decode) the output
    prediction_decoded = ml_models["motor_fault_label_encoder"].inverse_transform(prediction_encoded)
    
    # Get confidence score for the predicted class
    confidence = probabilities[0][prediction_encoded[0]]
    
    return {"prediction": prediction_decoded[0], "confidence": float(confidence)}

@router.post("/predict/rl-suggestion", response_model=models.RLSuggestion)
async def get_rl_suggestion(input_data: RLSuggestionInput, current_user: models.User = Depends(get_current_user)):
    """
    Simulates an RL agent's decision using a set of smart rules (heuristics).
    """
    # Define thresholds for our rules
    HIGH_GRID_PRICE = 7.0  # (e.g., ₹7/kWh)
    LOW_GRID_PRICE = 3.0   # (e.g., ₹3/kWh)
    HIGH_SOLAR_FORECAST = 500 # (e.g., >500 kW)
    BATTERY_MIN_FOR_SELLING = 50.0 # (e.g., SoC > 50%)
    BATTERY_MAX_FOR_CHARGING = 90.0 # (e.g., SoC < 90%)

    action_summary = "Hold current state. Operation is optimal." # Default action
    explanation = ["Current grid price and load levels are nominal.", "No profitable action is available."]

    # Rule 1: Sell to grid if price is high and battery is charged
    if input_data.grid_price > HIGH_GRID_PRICE and input_data.battery_soc > BATTERY_MIN_FOR_SELLING:
        action_summary = "Sell battery power to the grid to maximize profit."
        explanation = [f"Grid price is high at ₹{input_data.grid_price}/kWh.", "Selling stored energy is highly profitable right now."]

    # Rule 2: Charge from grid if price is low (e.g., overnight)
    elif input_data.grid_price < LOW_GRID_PRICE and input_data.battery_soc < BATTERY_MAX_FOR_CHARGING:
        action_summary = "Charge battery from the grid while prices are low."
        explanation = [f"Grid price is very low at ₹{input_data.grid_price}/kWh.", "Charging now will save money later in the day."]
    
    # Rule 3: Use battery to avoid high grid prices
    elif input_data.grid_price > HIGH_GRID_PRICE and input_data.battery_soc > 20: # Use battery if it has some charge
        action_summary = "Discharge battery to power the site and avoid high grid costs."
        explanation = [f"Grid price is high at ₹{input_data.grid_price}/kWh.", "Using stored energy is cheaper than buying from the grid."]

    # Rule 4: Prioritize storing solar power
    elif input_data.solar_forecast > HIGH_SOLAR_FORECAST and input_data.battery_soc < BATTERY_MAX_FOR_CHARGING:
        action_summary = "Prioritize charging the battery with available solar power."
        explanation = [f"High solar generation of {input_data.solar_forecast} kW is predicted.", "Storing this free energy is the most efficient action."]

    # Create and return the suggestion object
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

    # Add the new suggestion to the in-memory list so the frontend can see it
    if input_data.site_id not in MOCK_RL_SUGGESTIONS:
        MOCK_RL_SUGGESTIONS[input_data.site_id] = []
    MOCK_RL_SUGGESTIONS[input_data.site_id].insert(0, new_suggestion)
    
    return new_suggestion

@router.post("/predict/iitgn-energy-forecast", response_model=dict)
async def predict_iitgn_energy_forecast(
    input_data: IITGNEnergyForecastInput,
    current_user: models.User = Depends(get_current_user)
):
    """Predict energy consumption/generation using IITGN-trained model"""
    if "iitgn_forecast_model" not in ml_models:
        raise HTTPException(
            status_code=503,
            detail="IITGN Energy Forecast model is not available. Please train the model first using the training script."
        )
    
    model = ml_models["iitgn_forecast_model"]
    scaler = ml_models["iitgn_forecast_scaler"]
    info = ml_models.get("iitgn_forecast_info", {})
    features_list = info.get("features", list(input_data.features.keys()))
    
    # Create DataFrame with features in correct order
    feature_values = [input_data.features.get(f, 0.0) for f in features_list]
    input_df = pd.DataFrame([feature_values], columns=features_list)
    
    # Fill missing values with 0
    input_df = input_df.fillna(0)
    
    # Scale and predict
    scaled_features = scaler.transform(input_df)
    prediction = model.predict(scaled_features)[0]
    
    return {
        "prediction": float(prediction),
        "target": info.get("target", "energy"),
        "units": "kWh" if "kwh" in info.get("target", "").lower() else "kW",
        "model_info": {
            "mae": info.get("mae"),
            "rmse": info.get("rmse"),
            "r2": info.get("r2")
        }
    }

@router.post("/predict/iitgn-anomaly", response_model=dict)
async def detect_iitgn_anomaly(
    input_data: IITGNAnomalyDetectionInput,
    current_user: models.User = Depends(get_current_user)
):
    """Detect anomalies in energy system data using IITGN-trained model"""
    if "iitgn_anomaly_model" not in ml_models:
        raise HTTPException(
            status_code=503,
            detail="IITGN Anomaly Detection model is not available. Please train the model first using the training script."
        )
    
    model = ml_models["iitgn_anomaly_model"]
    scaler = ml_models["iitgn_anomaly_scaler"]
    info = ml_models.get("iitgn_anomaly_info", {})
    features_list = info.get("features", list(input_data.features.keys()))
    
    # Create DataFrame with features in correct order
    feature_values = [input_data.features.get(f, 0.0) for f in features_list]
    input_df = pd.DataFrame([feature_values], columns=features_list)
    
    # Fill missing values with 0
    input_df = input_df.fillna(0)
    
    # Scale and predict
    scaled_features = scaler.transform(input_df)
    prediction = model.predict(scaled_features)[0]
    anomaly_score = model.score_samples(scaled_features)[0]
    
    # -1 means anomaly, 1 means normal
    is_anomaly = prediction == -1
    
    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": float(anomaly_score),
        "status": "anomaly" if is_anomaly else "normal",
        "confidence": abs(float(anomaly_score))
    }

# Battery RUL prediction endpoints removed - feature marked as "Coming Soon"