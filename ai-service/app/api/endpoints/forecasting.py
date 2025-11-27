"""
Energy Forecasting API Endpoints
Provides forecasting for energy production, demand, and consumption
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import joblib
from pathlib import Path
import json

from app.api.deps import get_current_user_optional
from app.models import pydantic_models as models
from app.core.config import settings
import os

# Import Groq LLM for AI explanations
groq_llm = None
try:
    from langchain_openai import ChatOpenAI
    groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if groq_api_key:
        groq_llm = ChatOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_api_key,
            model="llama-3.1-8b-instant",
            temperature=0.7,
        )
        print("✅ Groq LLM configured for forecasting explanations")
    else:
        print("⚠️ GROQ_API_KEY not found for forecasting explanations")
except Exception as e:
    print(f"⚠️ Groq LLM not available for forecasting: {e}")

router = APIRouter()

# Load IITGN models if available
models_dir = Path("app/ml-models")
iitgn_models = {}

try:
    model_path = models_dir / "iitgn_energy_forecast_model.joblib"
    scaler_path = models_dir / "iitgn_scaler.joblib"
    info_path = models_dir / "iitgn_energy_forecast_info.json"
    
    # Try alternative naming
    if not scaler_path.exists():
        scaler_path = models_dir / "iitgn_energy_forecast_scaler.joblib"
    
    if model_path.exists() and scaler_path.exists():
        iitgn_models["forecast_model"] = joblib.load(model_path)
        iitgn_models["forecast_scaler"] = joblib.load(scaler_path)
        if info_path.exists():
            with open(info_path, 'r') as f:
                iitgn_models["forecast_info"] = json.load(f)
        else:
            # Create default info if not available
            iitgn_models["forecast_info"] = {
                "features": [],
                "description": "IITGN Energy Forecast Model"
            }
        print("✅ IITGN Forecast model loaded")
except Exception as e:
    print(f"⚠️ IITGN Forecast model not available: {e}")

# Input models
class ForecastingInput(BaseModel):
    """Input for energy forecasting"""
    site_id: Optional[str] = None
    forecast_horizon_hours: int = Field(24, ge=1, le=168, description="Forecast horizon in hours (1-168)")
    forecast_type: str = Field("consumption", description="Type: production, demand, or consumption")

class ForecastingFeaturesInput(BaseModel):
    """Input with specific features for forecasting"""
    features: Dict[str, float] = Field(..., description="Feature values for forecasting")
    forecast_horizon_hours: int = Field(24, ge=1, le=168)
    forecast_type: str = Field("consumption", description="Type: production, demand, or consumption")

def generate_realistic_forecast(
    base_value: float,
    forecast_hours: int,
    forecast_type: str,
    current_hour: int = None
) -> List[Dict[str, any]]:
    """
    Generate realistic energy forecasts based on time-of-day patterns
    """
    if current_hour is None:
        current_hour = datetime.now().hour
    
    forecast_data = []
    
    # Time-of-day patterns (normalized 0-1)
    if forecast_type == "production":
        # Solar production: peaks around noon, zero at night
        pattern = lambda h: max(0, np.sin((h % 24 - 6) * np.pi / 12)) if 6 <= (h % 24) <= 18 else 0
        daily_variation = 0.8  # 80% variation
    elif forecast_type == "demand":
        # Demand: peaks in morning and evening, lower at night
        h_mod = np.array([(current_hour + i) % 24 for i in range(forecast_hours)])
        pattern = lambda h: 0.3 + 0.5 * np.exp(-((h - 8)**2) / 18) + 0.4 * np.exp(-((h - 19)**2) / 18)
        daily_variation = 0.6  # 60% variation
    else:  # consumption
        # Consumption: similar to demand but smoother
        pattern = lambda h: 0.4 + 0.4 * np.exp(-((h - 12)**2) / 32)
        daily_variation = 0.5  # 50% variation
    
    # Generate forecast
    for i in range(forecast_hours):
        hour = (current_hour + i) % 24
        timestamp = datetime.now() + timedelta(hours=i)
        
        # Base pattern value
        pattern_value = pattern(hour)
        
        # Add realistic noise and trends
        noise = np.random.normal(0, 0.05)  # Small random noise
        trend = 1.0 + (i / forecast_hours) * 0.1  # Slight upward trend
        
        # Calculate forecast value
        forecast_value = base_value * pattern_value * trend * (1 + noise)
        forecast_value = max(0, forecast_value)  # Ensure non-negative
        
        # Add confidence interval
        confidence_lower = forecast_value * 0.85
        confidence_upper = forecast_value * 1.15
        
        forecast_data.append({
            "timestamp": timestamp.isoformat(),
            "hour": hour,
            "value": round(forecast_value, 2),
            "confidence_lower": round(confidence_lower, 2),
            "confidence_upper": round(confidence_upper, 2),
            "pattern_factor": round(pattern_value, 3)
        })
    
    return forecast_data

@router.post("/forecast/energy", response_model=Dict)
async def forecast_energy(
    input_data: ForecastingInput,
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Generate energy forecast (production, demand, or consumption) for specified horizon
    Uses IITGN model if available, otherwise generates realistic forecast
    """
    try:
        # Base values (in kWh or kW) - realistic defaults
        base_values = {
            "production": 500.0,   # Solar production capacity
            "demand": 800.0,       # Average demand
            "consumption": 750.0   # Average consumption
        }
        
        base_value = base_values.get(input_data.forecast_type, 750.0)
        current_hour = datetime.now().hour
        
        # If IITGN model is available, use it for more accurate forecasts
        if "forecast_model" in iitgn_models:
            try:
                model = iitgn_models["forecast_model"]
                scaler = iitgn_models["forecast_scaler"]
                info = iitgn_models["forecast_info"]
                features_list = info.get("features", [])
                
                # Create feature vector (use base_value as proxy for current state)
                # In real scenario, would use actual current measurements
                feature_values = {}
                for feature in features_list[:5]:  # Use first 5 features
                    feature_values[feature] = base_value * np.random.uniform(0.8, 1.2)
                
                # Generate forecast for each hour
                forecast_data = []
                for i in range(input_data.forecast_horizon_hours):
                    hour = (current_hour + i) % 24
                    timestamp = datetime.now() + timedelta(hours=i)
                    
                    # Adjust features based on hour (time-of-day effects)
                    adjusted_features = feature_values.copy()
                    if "solar" in str(features_list).lower() or "pv" in str(features_list).lower():
                        # Solar features peak at noon
                        solar_factor = max(0, np.sin((hour - 6) * np.pi / 12)) if 6 <= hour <= 18 else 0
                        for key in adjusted_features:
                            if "solar" in key.lower() or "pv" in key.lower():
                                adjusted_features[key] *= solar_factor
                    
                    # Prepare input
                    feature_vector = [adjusted_features.get(f, base_value * 0.9) for f in features_list]
                    input_df = pd.DataFrame([feature_vector], columns=features_list)
                    input_df = input_df.fillna(0)
                    
                    # Scale and predict
                    scaled_features = scaler.transform(input_df)
                    prediction = model.predict(scaled_features)[0]
                    
                    # Apply time-of-day pattern
                    if input_data.forecast_type == "production":
                        pattern = max(0, np.sin((hour - 6) * np.pi / 12)) if 6 <= hour <= 18 else 0
                        prediction *= pattern
                    elif input_data.forecast_type in ["demand", "consumption"]:
                        pattern = 0.4 + 0.4 * np.exp(-((hour - 12)**2) / 32)
                        prediction *= pattern
                    
                    prediction = max(0, prediction)
                    
                    forecast_data.append({
                        "timestamp": timestamp.isoformat(),
                        "hour": hour,
                        "value": round(float(prediction), 2),
                        "confidence_lower": round(float(prediction * 0.9), 2),
                        "confidence_upper": round(float(prediction * 1.1), 2),
                        "pattern_factor": round(pattern, 3),
                        "model_used": "iitgn"
                    })
                
                return {
                    "success": True,
                    "forecast_type": input_data.forecast_type,
                    "horizon_hours": input_data.forecast_horizon_hours,
                    "site_id": input_data.site_id,
                    "data": forecast_data,
                    "model_info": {
                        "model": "iitgn_energy_forecast",
                        "mae": info.get("mae"),
                        "r2": info.get("r2")
                    }
                }
            except Exception as e:
                print(f"Error using IITGN model: {e}, falling back to realistic forecast")
        
        # Fallback: Generate realistic forecast
        forecast_data = generate_realistic_forecast(
            base_value,
            input_data.forecast_horizon_hours,
            input_data.forecast_type,
            current_hour
        )
        
        return {
            "success": True,
            "forecast_type": input_data.forecast_type,
            "horizon_hours": input_data.forecast_horizon_hours,
            "site_id": input_data.site_id,
            "data": forecast_data,
            "model_info": {
                "model": "statistical_pattern",
                "description": "Time-of-day pattern-based forecast"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@router.post("/forecast/energy-with-features", response_model=Dict)
async def forecast_energy_with_features(
    input_data: ForecastingFeaturesInput,
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Generate energy forecast using provided feature values
    """
    try:
        if "forecast_model" not in iitgn_models:
            raise HTTPException(
                status_code=503,
                detail="IITGN forecast model not available. Please train the model first."
            )
        
        model = iitgn_models["forecast_model"]
        scaler = iitgn_models["forecast_scaler"]
        info = iitgn_models["forecast_info"]
        features_list = info.get("features", list(input_data.features.keys()))
        
        current_hour = datetime.now().hour
        forecast_data = []
        
        for i in range(input_data.forecast_horizon_hours):
            hour = (current_hour + i) % 24
            timestamp = datetime.now() + timedelta(hours=i)
            
            # Prepare feature vector
            feature_vector = [input_data.features.get(f, 0.0) for f in features_list]
            input_df = pd.DataFrame([feature_vector], columns=features_list)
            input_df = input_df.fillna(0)
            
            # Scale and predict
            scaled_features = scaler.transform(input_df)
            prediction = model.predict(scaled_features)[0]
            
            forecast_data.append({
                "timestamp": timestamp.isoformat(),
                "hour": hour,
                "value": round(float(prediction), 2),
                "confidence_lower": round(float(prediction * 0.9), 2),
                "confidence_upper": round(float(prediction * 1.1), 2)
            })
        
        return {
            "success": True,
            "forecast_type": input_data.forecast_type,
            "horizon_hours": input_data.forecast_horizon_hours,
            "data": forecast_data,
            "model_info": info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@router.get("/forecast/summary", response_model=Dict)
async def get_forecast_summary(
    site_id: Optional[str] = None,
    forecast_type: str = "consumption",
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Get a quick forecast summary with key metrics
    """
    try:
        # Generate 24h forecast
        base_values = {
            "production": 500.0,
            "demand": 800.0,
            "consumption": 750.0
        }
        base_value = base_values.get(forecast_type, 750.0)
        
        forecast_data = generate_realistic_forecast(
            base_value,
            24,
            forecast_type
        )
        
        values = [d["value"] for d in forecast_data]
        total = sum(values)
        peak = max(values)
        peak_hour = forecast_data[values.index(peak)]["hour"]
        average = total / len(values)
        
        return {
            "success": True,
            "forecast_type": forecast_type,
            "summary": {
                "total_24h": round(total, 2),
                "average": round(average, 2),
                "peak": round(peak, 2),
                "peak_hour": peak_hour,
                "min": round(min(values), 2),
                "min_hour": forecast_data[values.index(min(values))]["hour"]
            },
            "data": forecast_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast summary error: {str(e)}")

@router.post("/forecast/explain", response_model=Dict)
async def explain_forecast(
    forecast_data: Dict,
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Generate AI explanation of forecast using Groq LLM
    """
    if not groq_llm:
        return {
            "success": False,
            "explanation": "AI explanation service is not available. Groq API key not configured.",
            "fallback": True
        }
    
    try:
        from langchain_core.prompts import ChatPromptTemplate
        
        forecast_type = forecast_data.get("forecast_type", "consumption")
        summary = forecast_data.get("summary", {})
        data_points = forecast_data.get("data", [])
        
        # Extract key insights
        peak_hour = summary.get("peak_hour", 12)
        peak_value = summary.get("peak", 0)
        average = summary.get("average", 0)
        total = summary.get("total_24h", 0)
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an energy management expert. Provide concise, technical explanations of energy forecasts. 
            Focus on practical insights and actionable recommendations. Use simple language but be precise.
            Keep explanations under 200 words. Format with **bold** for key points."""),
            ("human", """Analyze this {forecast_type} forecast:

**Key Metrics:**
- Total 24h: {total} kWh
- Average: {average} kWh
- Peak: {peak_value} kWh at hour {peak_hour}
- Min: {min_value} kWh at hour {min_hour}

**Pattern Analysis:**
The forecast shows {peak_pattern} at hour {peak_hour}, which is {peak_timing}. 
Average values are {avg_comparison} compared to typical patterns.

Provide a brief, actionable explanation focusing on:
1. What the forecast indicates
2. Key patterns or trends
3. One practical recommendation

Keep it concise and to the point.""")
        ])
        
        min_value = summary.get("min", 0)
        min_hour = summary.get("min_hour", 2)
        
        # Determine peak pattern
        if peak_hour >= 6 and peak_hour <= 18:
            peak_pattern = "peak production/activity"
            peak_timing = "during daylight hours" if forecast_type == "production" else "during peak usage hours"
        else:
            peak_pattern = "lower activity"
            peak_timing = "outside typical peak hours"
        
        avg_comparison = "above average" if average > (total / 24) else "below average"
        
        chain = prompt_template | groq_llm
        response = await chain.ainvoke({
            "forecast_type": forecast_type,
            "total": round(total, 2),
            "average": round(average, 2),
            "peak_value": round(peak_value, 2),
            "peak_hour": peak_hour,
            "min_value": round(min_value, 2),
            "min_hour": min_hour,
            "peak_pattern": peak_pattern,
            "peak_timing": peak_timing,
            "avg_comparison": avg_comparison
        })
        
        return {
            "success": True,
            "explanation": response.content,
            "forecast_type": forecast_type,
            "key_metrics": summary
        }
        
    except Exception as e:
        # Fallback explanation if AI fails
        return {
            "success": True,
            "explanation": f"**{forecast_type.capitalize()} Forecast Analysis:**\n\n" +
                          f"The forecast shows an average of {summary.get('average', 0):.2f} kWh with peak values of " +
                          f"{summary.get('peak', 0):.2f} kWh at hour {summary.get('peak_hour', 12)}. " +
                          f"Total estimated {forecast_type} over 24 hours is {summary.get('total_24h', 0):.2f} kWh.",
            "fallback": True,
            "error": str(e)
        }

