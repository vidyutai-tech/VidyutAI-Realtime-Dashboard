# ems-backend/app/models/pydantic_models.py

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict
from datetime import datetime, timedelta
import uuid

# --- Base Models (mirroring TypeScript types) ---

class Site(BaseModel):
    id: str = Field(default_factory=lambda: f"site_{uuid.uuid4().hex[:6]}")
    name: str
    location: str
    status: Literal['online', 'offline', 'maintenance']

class MaintenanceAsset(BaseModel):
    id: str = Field(default_factory=lambda: f"asset_{uuid.uuid4().hex[:6]}")
    siteId: str
    name: str
    type: str
    modelNumber: str
    installDate: str # Using str to match frontend 'YYYY-MM-DD'
    status: Literal['operational', 'degraded', 'offline']
    failure_probability: float
    rank: int

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: f"alert_{uuid.uuid4().hex[:6]}")
    timestamp: datetime
    device_id: str
    severity: Literal['critical', 'warning', 'info']
    message: str
    diagnosis: str
    recommended_action: str
    status: Literal['active', 'acknowledged', 'resolved']

class EnergyFlows(BaseModel):
    grid_to_load: float
    pv_to_load: float
    pv_to_battery: float
    battery_to_load: float
    battery_to_grid: float
    pv_to_grid: float

class RLSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: f"rl_{uuid.uuid4().hex[:6]}")
    timestamp: datetime
    action_summary: str
    explanation: List[str]
    confidence: float
    estimated_cost_savings: float
    status: Literal['pending', 'accepted', 'rejected']
    current_flows: EnergyFlows
    suggested_flows: EnergyFlows

class HealthStatus(BaseModel):
    site_health: float
    grid_draw: float
    battery_soc: float
    pv_generation_today: float
    battery_soh: float
    inverter_health: float
    motor_health: float
    pv_health: float
    ev_charger_health: float

class RLStrategy(BaseModel):
    cost_priority: int
    grid_stability_priority: int
    battery_longevity_priority: int

class DigitalTwinDataPoint(BaseModel):
    id: str
    label: str
    unit: str
    x: int
    y: int
    real_value: float
    predicted_value: float

class Anomaly(BaseModel):
    id: str
    timestamp: datetime
    data_point_id: str
    data_point_label: str
    severity: Literal['high', 'medium', 'low']
    message: str

class TelemetryMetrics(BaseModel):
    voltage: float
    current: float
    frequency: float
    thd: Optional[float] = None
    temp_c: float
    pv_generation: Optional[float] = None
    pv_irradiance: Optional[float] = None
    soc_batt: Optional[float] = None
    net_load: Optional[float] = None
    battery_discharge: Optional[float] = None

class Telemetry(BaseModel):
    timestamp: datetime
    site_id: str
    device_id: str
    subsystem: str
    metrics: TelemetryMetrics

# --- User & Token Models for Auth ---

class User(BaseModel):
    email: Optional[EmailStr] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Request/Response Models for API Endpoints ---

class SiteCreate(BaseModel):
    name: str
    location: str
    status: Literal['online', 'offline', 'maintenance']

class AssetCreate(BaseModel):
    siteId: str
    name: str
    type: str
    modelNumber: str
    installDate: str
    status: Literal['operational', 'degraded', 'offline']

class SimulationParams(BaseModel):
    pvCurtail: int
    batteryTarget: int
    gridPrice: int

class SimulationResult(BaseModel):
    cost: List[float]
    emissions: List[float]
    
# FIX: Add the missing AIQuery model for the chat endpoint
class AIQuery(BaseModel):
    question: str
    
    
class VibrationInput(BaseModel):
    features: List[float] = Field(..., min_length=24, max_length=24)


class MotorFaultInput(BaseModel):
    features: List[float] = Field(..., min_length=40, max_length=40)

# New Input model for our RL Simulator
class RLSuggestionInput(BaseModel):
    site_id: str
    battery_soc: float
    grid_price: float
    hour_of_day: int
    solar_forecast: float