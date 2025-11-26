# ai-service/app/api/endpoints/planning.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_user_optional
from app.models import pydantic_models as models

router = APIRouter()


# Request/Response Models
class PlanningRequest(BaseModel):
    load_profile_id: str
    total_daily_energy_kwh: Optional[float] = None  # Can be passed directly
    preferred_sources: List[str]  # e.g., ["solar", "battery", "grid"]
    primary_goal: str  # "savings", "self_sustainability", "reliability", "carbon_reduction"
    allow_diesel: bool = False


class TechnicalSizing(BaseModel):
    solar_capacity_kw: float
    battery_capacity_kwh: float
    inverter_capacity_kw: float
    grid_connection_kw: float
    diesel_capacity_kw: Optional[float] = None
    recommendations: List[str]


class EconomicAnalysis(BaseModel):
    total_capex: float  # INR
    annual_opex: float  # INR
    payback_period_years: float
    npv_10_years: float  # INR
    roi_percentage: float
    monthly_savings: float  # INR


class EmissionsAnalysis(BaseModel):
    annual_co2_reduction_kg: float
    carbon_offset_percentage: float
    lifetime_co2_reduction_tonnes: float


class PlanningResponse(BaseModel):
    technical_sizing: TechnicalSizing
    economic_analysis: EconomicAnalysis
    emissions_analysis: EmissionsAnalysis


def calculate_technical_sizing(
    total_daily_energy_kwh: float,
    preferred_sources: List[str],
    primary_goal: str,
    allow_diesel: bool
) -> TechnicalSizing:
    """
    Calculate technical sizing based on load profile and preferences.
    This is a simplified calculation - in production, use more sophisticated algorithms.
    """
    # Base calculations
    peak_load_kw = total_daily_energy_kwh / 8  # Assume 8 hours of peak usage
    
    # Solar sizing based on daily energy and location (assuming 5 peak sun hours)
    solar_capacity_kw = (total_daily_energy_kwh * 0.6) / 5 if "solar" in preferred_sources else 0
    
    # Battery sizing: 2-3 days of autonomy for reliability, less for cost savings
    if primary_goal == "reliability":
        battery_capacity_kwh = total_daily_energy_kwh * 2.5
    elif primary_goal == "self_sustainability":
        battery_capacity_kwh = total_daily_energy_kwh * 2.0
    else:
        battery_capacity_kwh = total_daily_energy_kwh * 1.5
    
    # Inverter sizing: peak load + 20% margin
    inverter_capacity_kw = peak_load_kw * 1.2
    
    # Grid connection: based on peak load
    grid_connection_kw = peak_load_kw * 1.5
    
    # Diesel generator (if allowed and in preferred sources)
    diesel_capacity_kw = None
    if allow_diesel and "diesel" in preferred_sources:
        diesel_capacity_kw = peak_load_kw * 0.8
    
    recommendations = []
    if "solar" in preferred_sources:
        recommendations.append(f"Install {solar_capacity_kw:.2f} kW solar PV system")
    if battery_capacity_kwh > 0:
        recommendations.append(f"Install {battery_capacity_kwh:.2f} kWh battery storage")
    if diesel_capacity_kw:
        recommendations.append(f"Install {diesel_capacity_kw:.2f} kW diesel generator as backup")
    recommendations.append(f"Grid connection capacity: {grid_connection_kw:.2f} kW")
    
    return TechnicalSizing(
        solar_capacity_kw=round(solar_capacity_kw, 2),
        battery_capacity_kwh=round(battery_capacity_kwh, 2),
        inverter_capacity_kw=round(inverter_capacity_kw, 2),
        grid_connection_kw=round(grid_connection_kw, 2),
        diesel_capacity_kw=round(diesel_capacity_kw, 2) if diesel_capacity_kw else None,
        recommendations=recommendations
    )


def calculate_economic_analysis(
    technical_sizing: TechnicalSizing,
    total_daily_energy_kwh: float,
    primary_goal: str
) -> EconomicAnalysis:
    """
    Calculate economic analysis including CAPEX, OPEX, payback period, etc.
    """
    # Cost assumptions (INR)
    solar_cost_per_kw = 50000  # ₹50,000 per kW
    battery_cost_per_kwh = 8000  # ₹8,000 per kWh
    inverter_cost_per_kw = 15000  # ₹15,000 per kW
    grid_connection_cost_per_kw = 10000  # ₹10,000 per kW
    diesel_cost_per_kw = 20000  # ₹20,000 per kW
    
    # Calculate CAPEX
    solar_capex = technical_sizing.solar_capacity_kw * solar_cost_per_kw
    battery_capex = technical_sizing.battery_capacity_kwh * battery_cost_per_kwh
    inverter_capex = technical_sizing.inverter_capacity_kw * inverter_cost_per_kw
    grid_capex = technical_sizing.grid_connection_kw * grid_connection_cost_per_kw
    diesel_capex = (technical_sizing.diesel_capacity_kw * diesel_cost_per_kw) if technical_sizing.diesel_capacity_kw else 0
    
    total_capex = solar_capex + battery_capex + inverter_capex + grid_capex + diesel_capex
    
    # Annual OPEX (maintenance, insurance, etc.)
    annual_opex = total_capex * 0.02  # 2% of CAPEX
    
    # Annual savings calculation
    # Assume grid tariff: ₹8/kWh, solar generation saves 80% of energy cost
    annual_energy_kwh = total_daily_energy_kwh * 365
    grid_tariff = 8.0  # ₹/kWh
    solar_savings_percentage = 0.8
    
    annual_energy_cost = annual_energy_kwh * grid_tariff
    annual_savings = annual_energy_cost * solar_savings_percentage - annual_opex
    
    # Payback period
    payback_period_years = total_capex / annual_savings if annual_savings > 0 else 999
    
    # NPV calculation (10 years, 8% discount rate)
    discount_rate = 0.08
    npv = -total_capex
    for year in range(1, 11):
        npv += annual_savings / ((1 + discount_rate) ** year)
    
    # ROI
    roi_percentage = (annual_savings / total_capex) * 100 if total_capex > 0 else 0
    
    # Monthly savings
    monthly_savings = annual_savings / 12
    
    return EconomicAnalysis(
        total_capex=round(total_capex, 2),
        annual_opex=round(annual_opex, 2),
        payback_period_years=round(payback_period_years, 2),
        npv_10_years=round(npv, 2),
        roi_percentage=round(roi_percentage, 2),
        monthly_savings=round(monthly_savings, 2)
    )


def calculate_emissions_analysis(
    technical_sizing: TechnicalSizing,
    total_daily_energy_kwh: float
) -> EmissionsAnalysis:
    """
    Calculate CO2 emissions reduction.
    """
    # CO2 emission factors
    grid_co2_kg_per_kwh = 0.82  # kg CO2 per kWh (Indian grid average)
    solar_co2_kg_per_kwh = 0.05  # kg CO2 per kWh (manufacturing + installation)
    
    # Annual energy
    annual_energy_kwh = total_daily_energy_kwh * 365
    
    # Grid emissions (baseline)
    grid_emissions_kg = annual_energy_kwh * grid_co2_kg_per_kwh
    
    # Solar emissions (if solar is installed)
    solar_generation_kwh = technical_sizing.solar_capacity_kw * 5 * 365  # 5 peak sun hours
    solar_emissions_kg = solar_generation_kwh * solar_co2_kg_per_kwh
    
    # Remaining energy from grid
    remaining_grid_energy_kwh = max(0, annual_energy_kwh - solar_generation_kwh)
    remaining_grid_emissions_kg = remaining_grid_energy_kwh * grid_co2_kg_per_kwh
    
    # Total emissions with solar
    total_emissions_kg = solar_emissions_kg + remaining_grid_emissions_kg
    
    # Annual CO2 reduction
    annual_co2_reduction_kg = grid_emissions_kg - total_emissions_kg
    
    # Carbon offset percentage
    carbon_offset_percentage = (annual_co2_reduction_kg / grid_emissions_kg) * 100 if grid_emissions_kg > 0 else 0
    
    # Lifetime CO2 reduction (25 years)
    lifetime_co2_reduction_tonnes = (annual_co2_reduction_kg * 25) / 1000
    
    return EmissionsAnalysis(
        annual_co2_reduction_kg=round(annual_co2_reduction_kg, 2),
        carbon_offset_percentage=round(carbon_offset_percentage, 2),
        lifetime_co2_reduction_tonnes=round(lifetime_co2_reduction_tonnes, 2)
    )


@router.post("/planning/recommend", response_model=PlanningResponse)
async def get_planning_recommendation(
    request: PlanningRequest,
    current_user: models.User = Depends(get_current_user_optional)
):
    """
    Generate planning recommendation based on load profile, preferred sources, and goals.
    This endpoint calculates technical sizing, economic analysis, and emissions analysis.
    """
    try:
        # Use the total_daily_energy_kwh from request if provided, otherwise use default
        total_daily_energy_kwh = request.total_daily_energy_kwh or 50.0  # kWh per day
        
        if total_daily_energy_kwh <= 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid total_daily_energy_kwh. Must be greater than 0."
            )
        
        # Calculate technical sizing
        technical_sizing = calculate_technical_sizing(
            total_daily_energy_kwh=total_daily_energy_kwh,
            preferred_sources=request.preferred_sources,
            primary_goal=request.primary_goal,
            allow_diesel=request.allow_diesel
        )
        
        # Calculate economic analysis
        economic_analysis = calculate_economic_analysis(
            technical_sizing=technical_sizing,
            total_daily_energy_kwh=total_daily_energy_kwh,
            primary_goal=request.primary_goal
        )
        
        # Calculate emissions analysis
        emissions_analysis = calculate_emissions_analysis(
            technical_sizing=technical_sizing,
            total_daily_energy_kwh=total_daily_energy_kwh
        )
        
        return PlanningResponse(
            technical_sizing=technical_sizing,
            economic_analysis=economic_analysis,
            emissions_analysis=emissions_analysis
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating planning recommendation: {str(e)}"
        )

