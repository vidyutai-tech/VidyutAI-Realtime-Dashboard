# ems-backend/app/api/endpoints/optimization.py

import base64
from datetime import datetime, timedelta
import shutil
import os
from io import BytesIO
from typing import Optional
from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from pulp import lpSum, LpProblem, LpMinimize, LpVariable, COIN_CMD, PULP_CBC_CMD, value, LpStatus, LpStatusOptimal

from app.api.deps import get_current_user, get_current_user_optional
from app.models import pydantic_models as models

router = APIRouter()

# -----------------------------
# Utility function
# -----------------------------
def upsample_profile(hourly_profile, steps_per_hour, num_days):
    """Upsample hourly data using linear interpolation."""
    hourly_times = np.arange(len(hourly_profile))
    fine_times = np.linspace(0, len(hourly_profile) - 1, len(hourly_profile) * steps_per_hour)
    upsampled_single_day = np.interp(fine_times, hourly_times, hourly_profile).tolist()
    return upsampled_single_day * num_days


"""MILP-based optimizer aligned with the  .
Models grid import/export, diesel with min-power on/off, battery charge/discharge with SOC,
PV curtailment, and a simple hydrogen loop (electrolyzer piecewise efficiency + fuel cell).
Returns a detailed summary and a combined dispatch plot.
"""
def run_optimization(params, load_profile_24h, price_profile_24h, solar_profile_24h: Optional[list] = None):
    # Input validation
    try:
        num_days = max(1, min(30, int(params["num_days"])))  # Limit to 1-30 days
        time_resolution_minutes = int(params["time_resolution_minutes"])
        if time_resolution_minutes not in [15, 30, 60]:
            time_resolution_minutes = 30  # Default to 30 minutes
        
        grid_connection = max(100, float(params["grid_connection"]))  # kW, minimum 100kW
        solar_connection = max(0, float(params["solar_connection"]))  # kW
        battery_capacity_wh = max(1000, float(params["battery_capacity"]))  # Wh, minimum 1kWh
        battery_voltage = max(12, float(params["battery_voltage"]))  # V, minimum 12V
        diesel_capacity = max(0, float(params["diesel_capacity"]))  # kW
        fuel_price = max(0, float(params["fuel_price"]))  # INR/l
        pv_energy_cost = max(0, float(params["pv_energy_cost"]))  # INR/kWh
        load_curtail_cost = max(0, float(params["load_curtail_cost"]))  # INR/kWh
        battery_om_cost = max(0, float(params["battery_om_cost"]))  # INR/kWh
        weather = str(params["weather"]).lower()
        objective_type = str(params.get("objective_type", "cost")).lower()
        profile_type = str(params.get("profile_type", "Auto detect"))
        
        # Hydrogen system parameters (with defaults if not provided)
        electrolyzer_capacity = max(0, float(params.get("electrolyzer_capacity", 1000.0)))  # kW
        fuel_cell_capacity = max(0, float(params.get("fuel_cell_capacity", 800.0)))  # kW
        h2_tank_capacity = max(0, float(params.get("h2_tank_capacity", 100.0)))  # kg
        fuel_cell_efficiency_percent = max(0, min(1, float(params.get("fuel_cell_efficiency_percent", 0.60))))  # 0-1
        fuel_cell_om_cost = max(0, float(params.get("fuel_cell_om_cost", 1.5)))  # INR/kWh
        electrolyzer_om_cost = max(0, float(params.get("electrolyzer_om_cost", 0.5)))  # INR/kWh
        
        # Validate load and price profiles
        if len(load_profile_24h) < 24:
            raise ValueError("Load profile must contain at least 24 data points")
        if len(price_profile_24h) < 24:
            raise ValueError("Price profile must contain at least 24 data points")
            
    except (ValueError, TypeError, KeyError) as e:
        raise ValueError(f"Invalid input parameters: {str(e)}")

    # Battery capacity: API receives Wh, convert to Ah for   compatibility
    battery_capacity_ah = battery_capacity_wh / battery_voltage  # Ah

    # Weather → solar scaling (matching  )
    wl = str(weather).lower()
    if wl == "sunny":
        solar_scale = 1.0
    elif wl == "cloudy":
        solar_scale = 0.6
    elif wl == "rainy":
        solar_scale = 0.3
    else:
        solar_scale = 1.0  # default to sunny

    # Hydrogen system constants (H2_LHV is fixed, not configurable)
    H2_LHV = 33.3  # kWh/kg

    step_size = time_resolution_minutes / 60.0
    steps_per_hour = int(60 / time_resolution_minutes)
    time_horizon = num_days * 24 * steps_per_hour

    # Solar profiles (matching   exactly)
    solar_profile_sunny = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05, 0.2, 0.4, 0.6, 0.8, 0.9,
                           1.0, 0.95, 0.85, 0.7, 0.5, 0.25, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0]
    solar_profile_cloudy = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.03, 0.15, 0.3, 0.45, 0.6, 0.65,
                            0.7, 0.68, 0.6, 0.5, 0.35, 0.18, 0.03, 0.0, 0.0, 0.0, 0.0, 0.0]
    solar_profile_rainy = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 
                           0.3, 0.25, 0.2, 0.15, 0.1, 0.05, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0]
    
    # Select solar profile
    if solar_profile_24h is not None and len(solar_profile_24h) >= 24:
        solar_profile_base = solar_profile_24h
    else:
        # Fallback based on weather
        if wl == "rainy":
            solar_profile_base = solar_profile_rainy
        elif wl == "cloudy":
            solar_profile_base = solar_profile_cloudy
        else:
            solar_profile_base = solar_profile_sunny

    # If data already matches expected total steps, skip upsampling
    expected_steps = num_days * 24 * steps_per_hour

    if len(load_profile_24h) == expected_steps:
        print(f"✅ Uploaded data already at {time_resolution_minutes}-min resolution. Skipping upsampling.")
        load_profile = load_profile_24h
        price_profile = price_profile_24h
    else:
        print(f"ℹ️ Upsampling base 24-hour profiles to {num_days} days × {time_resolution_minutes}-min resolution.")
        load_profile = upsample_profile(load_profile_24h, steps_per_hour, num_days)
        price_profile = upsample_profile(price_profile_24h, steps_per_hour, num_days)

    # If provided data already matches expected steps, skip upsampling
    if len(solar_profile_base) == expected_steps:
        solar_profile = solar_profile_base
    else:
        solar_profile = upsample_profile(solar_profile_base, steps_per_hour, num_days)

    # System capacities / derived values (matching   exactly)
    grid_max_power = grid_connection
    solar_capacity = solar_connection
    battery_storage_energy = battery_capacity_wh / 1000.0  # Convert Wh to kWh
    battery_power = battery_storage_energy * 0.5  # kW, 0.5C rate as in  
    bess_charge_capacity = battery_power
    bess_discharge_capacity = battery_power
    bess_energy_capacity = battery_storage_energy
    bess_min_soc, bess_max_soc = 0.1, 0.9
    bess_charge_efficiency, bess_discharge_efficiency = 0.95, 0.95

    diesel_min_power = 0.1 * diesel_capacity
    diesel_max_power = diesel_capacity
    fuel_slope, fuel_intercept = 0.18, 48  # l/kWh affine approx

    # Hydrogen parameters
    h2_min_soc, h2_max_soc = 0.1, 0.9
    fuel_cell_efficiency_kwh_per_kg = H2_LHV * fuel_cell_efficiency_percent
    fc_conversion_rate = 1.0 / max(1e-9, fuel_cell_efficiency_kwh_per_kg)

    # Piecewise electrolyzer efficiency (2-piece)
    P_break1_percent = 0.20
    eff_at_break1 = 0.80
    eff_at_break2 = 0.75
    P_break1 = electrolyzer_capacity * P_break1_percent
    P_break2 = electrolyzer_capacity
    H2_at_break1 = (P_break1 * eff_at_break1) / H2_LHV
    H2_at_break2 = (P_break2 * eff_at_break2) / H2_LHV
    slope_s1 = H2_at_break1 / P_break1 if P_break1 > 0 else 0
    slope_s2 = (H2_at_break2 - H2_at_break1) / (P_break2 - P_break1) if (P_break2 - P_break1) > 0 else 0
    width_s1 = P_break1
    width_s2 = P_break2 - P_break1

    # Model
    model = LpProblem('EMS_MILP', LpMinimize)
    T = range(time_horizon)

    # Decision variables
    P_grid = {t: LpVariable(f"P_grid_{t}", -grid_max_power, grid_max_power) for t in T}
    P_load_curt = {t: LpVariable(f"P_load_curt_{t}", 0) for t in T}
    P_diesel = {t: LpVariable(f"P_diesel_{t}", 0, diesel_max_power) for t in T}
    z_diesel = {t: LpVariable(f"z_diesel_{t}", cat='Binary') for t in T}
    F_diesel = {t: LpVariable(f"F_diesel_{t}", 0) for t in T}
    P_charge = {t: LpVariable(f"P_charge_{t}", 0, bess_charge_capacity) for t in T}
    P_discharge = {t: LpVariable(f"P_discharge_{t}", 0, bess_discharge_capacity) for t in T}
    E_battery = {t: LpVariable(f"E_battery_{t}", bess_min_soc * bess_energy_capacity, bess_max_soc * bess_energy_capacity) for t in T}
    z_bess = {t: LpVariable(f"z_bess_{t}", cat='Binary') for t in T}
    P_pv_used = {t: LpVariable(f"P_pv_used_{t}", 0) for t in T}
    P_solar_curt = {t: LpVariable(f"P_solar_curt_{t}", 0) for t in T}

    # Hydrogen side
    P_elec = {t: LpVariable(f"P_elec_{t}", 0, electrolyzer_capacity) for t in T}
    P_fc = {t: LpVariable(f"P_fc_{t}", 0, fuel_cell_capacity) for t in T}
    E_h2 = {t: LpVariable(f"E_h2_{t}", h2_min_soc * h2_tank_capacity, h2_max_soc * h2_tank_capacity) for t in T}
    z_h2 = {t: LpVariable(f"z_h2_{t}", cat='Binary') for t in T}
    P_elec_s1 = {t: LpVariable(f"P_elec_s1_{t}", 0, width_s1) for t in T}
    P_elec_s2 = {t: LpVariable(f"P_elec_s2_{t}", 0, width_s2) for t in T}
    z_elec_s2 = {t: LpVariable(f"z_elec_s2_{t}", cat='Binary') for t in T}
    H_produced = {t: LpVariable(f"H_produced_{t}", 0) for t in T}
    P_grid_import = {t: LpVariable(f"P_grid_import_{t}", 0) for t in T}

    # Constraints
    for t in T:
        # Power balance
        load_served = load_profile[t] - P_load_curt[t]
        supply = P_pv_used[t] + P_diesel[t] + P_discharge[t] + P_grid[t] + P_fc[t]
        demand = load_served + P_charge[t] + P_elec[t]
        model += (supply == demand), f"power_balance_{t}"

    for t in T:
        model += P_load_curt[t] <= load_profile[t], f"load_curt_max_{t}"

    for t in T:
        # PV balance and curtailment
        solar_available = solar_profile[t] * solar_capacity
        model += P_pv_used[t] + P_solar_curt[t] == solar_available, f"pv_balance_{t}"

    for t in T:
        # Diesel min-up via on/off proxy and fuel consumption affine envelope
        model += P_diesel[t] >= diesel_min_power * z_diesel[t], f"diesel_min_{t}"
        model += P_diesel[t] <= diesel_max_power * z_diesel[t], f"diesel_max_{t}"
        model += F_diesel[t] >= fuel_slope * P_diesel[t] + fuel_intercept * z_diesel[t], f"fuel_cons_{t}"

    # Battery dynamics and no simultaneous charge/discharge
    initial_battery_level = 0.5 * bess_energy_capacity
    model += E_battery[0] == initial_battery_level
    for t in T:
        if t < time_horizon - 1:
            model += (
                E_battery[t+1] == E_battery[t] + step_size * (P_charge[t] * bess_charge_efficiency - P_discharge[t] * (1.0 / bess_discharge_efficiency))
            ), f"battery_dynamics_{t}"
        model += P_charge[t] <= bess_charge_capacity * (1 - z_bess[t]), f"charge_limit_{t}"
        model += P_discharge[t] <= bess_discharge_capacity * z_bess[t], f"discharge_limit_{t}"
    # Cyclic final SOC
    model += (
        initial_battery_level == E_battery[time_horizon-1] + step_size * (P_charge[time_horizon-1] * bess_charge_efficiency - P_discharge[time_horizon-1] * (1.0 / bess_discharge_efficiency))
    ), "battery_cyclic_soc"

    # Hydrogen dynamics with piecewise electrolyzer
    initial_h2_level = 0.5 * h2_tank_capacity
    model += E_h2[0] == initial_h2_level
    for t in T:
        model += P_elec[t] == P_elec_s1[t] + P_elec_s2[t], f"elec_sum_{t}"
        model += H_produced[t] == (P_elec_s1[t] * slope_s1) + (P_elec_s2[t] * slope_s2), f"h2_prod_{t}"
        model += P_elec_s1[t] >= width_s1 * z_elec_s2[t], f"elec_s1_before_s2_{t}"
        model += P_elec_s2[t] <= width_s2 * z_elec_s2[t], f"elec_s2_activation_{t}"
        model += P_fc[t] <= fuel_cell_capacity * z_h2[t], f"fc_limit_{t}"
        model += P_elec[t] <= electrolyzer_capacity * (1 - z_h2[t]), f"elec_limit_{t}"
        if t < time_horizon - 1:
            model += (
            E_h2[t+1] == E_h2[t] + H_produced[t] * step_size - (P_fc[t] * step_size * fc_conversion_rate)
            ), f"h2_dyn_{t}"
    model += (
        E_h2[0] == E_h2[time_horizon-1] + H_produced[time_horizon-1] * step_size - (P_fc[time_horizon-1] * step_size * fc_conversion_rate)
    ), "h2_cyclic"

    for t in T:
        model += P_grid_import[t] >= P_grid[t], f"grid_import_ge_pgrid_{t}"
        model += P_grid_import[t] >= 0, f"grid_import_ge_0_{t}"


    co2_kg_per_kwh = {
        "grid": 0.716,
        "diesel": 0.9,  # Matching notebook: 0.9 kg CO2/kWh
        "battery": 0.029,
        "solar": 0.046,
        "fuel_cell": 0.001,
        "electrolyzer": 0.0,
    }
    co2_load_curt_penalty = 5.0

    # Debug: Print objective type to verify it's being used
    print(f"🔍 Optimization objective type: '{objective_type}' (normalized from input)")
    
    # Determine objective function based on objective type
    if objective_type == "co2":
        objective_expr = lpSum([
            step_size * (
                co2_kg_per_kwh["grid"] * P_grid_import[t]
                + co2_kg_per_kwh["diesel"] * P_diesel[t]
                + co2_kg_per_kwh["battery"] * P_discharge[t]
                + co2_kg_per_kwh["solar"] * P_pv_used[t]
                + co2_kg_per_kwh["fuel_cell"] * P_fc[t]
                + co2_kg_per_kwh["electrolyzer"] * P_elec[t]
            )
            + step_size * co2_load_curt_penalty * P_load_curt[t]
            for t in T
        ])
    else:
        # Default: minimize total operating cost
        # Use P_grid_import to only count imports as cost (exports don't reduce cost in this model)
        objective_expr = lpSum([
            step_size * price_profile[t] * P_grid_import[t]
            + step_size * load_curtail_cost * P_load_curt[t]
            + step_size * fuel_price * F_diesel[t]
            + step_size * pv_energy_cost * P_pv_used[t]
            + step_size * battery_om_cost * P_discharge[t]
            + step_size * fuel_cell_om_cost * P_fc[t]
            + step_size * electrolyzer_om_cost * P_elec[t]
            for t in T
        ])
    model += objective_expr

    # Solve - Use system-installed CBC if available (ARM64 compatible), otherwise fall back to bundled
    cbc_path = shutil.which('cbc')
    if cbc_path:
        # Use system-installed CBC (fixes "Bad CPU type" error on Apple Silicon)
        os.environ['COIN_CMD'] = cbc_path
        solver = COIN_CMD(msg=0, timeLimit=180, gapRel=0.01)
        print(f"Using system CBC solver at: {cbc_path}")
    else:
        # Fall back to bundled CBC
        solver = PULP_CBC_CMD(msg=0, timeLimit=180, gapRel=0.01)
        print("Using bundled CBC solver")
    model.solve(solver)
    
    # Check if solution was found
    if model.status != LpStatusOptimal:
        status_msg = LpStatus.get(model.status, f"Unknown status {model.status}")
        error_msg = f"Optimization failed with status: {status_msg}"
        if objective_type == "co2":
            error_msg += " (CO2 objective). The problem may be infeasible or unbounded. Check constraints and parameters."
        print(f"❌ {error_msg}")
        raise ValueError(error_msg)

    # Gather results (matching   structure exactly)
    time_hours = [t * step_size for t in T]
    
    # Calculate H2 levels at end of each time step (for plotting, matching  )
    h2_levels_for_plot = []
    for t in T:
        h2_at_end_of_t = value(E_h2[t]) + value(H_produced[t]) * step_size - value(P_fc[t]) * step_size * fc_conversion_rate
        h2_levels_for_plot.append(h2_at_end_of_t)
    
    results = {
        'Time_Step': list(range(time_horizon)),
        'Time_Hours': time_hours,
        'Load_Demand': load_profile,
        'Price': price_profile,
        'Grid_Power': [value(P_grid[t]) for t in T],
        'Grid_Import': [value(P_grid_import[t]) for t in T],
        'Load_Curtailed': [value(P_load_curt[t]) for t in T],
        'Diesel_Power': [value(P_diesel[t]) for t in T],
        'Fuel_Use_l': [step_size * value(F_diesel[t]) for t in T],
        'Fuel_Cost': [step_size * fuel_price * value(F_diesel[t]) for t in T],
        'Charge_Power': [value(P_charge[t]) for t in T],
        'Discharge_Power': [value(P_discharge[t]) for t in T],
        'Net_Battery_Power': [value(P_discharge[t]) - value(P_charge[t]) for t in T],
        'Battery_Level': [value(E_battery[t]) for t in T],
        'Battery_SOC': [value(E_battery[t]) / bess_energy_capacity * 100 for t in T],  # Battery SOC in %
        'Solar_Available': [solar_profile[t] * solar_capacity for t in T],
        'PV_Used': [value(P_pv_used[t]) for t in T],
        'Solar_Curtailed': [value(P_solar_curt[t]) for t in T],
        'Electrolyzer_Power': [value(P_elec[t]) for t in T],
        'Fuel_Cell_Power': [value(P_fc[t]) for t in T],
        'Net_H2_Power': [value(P_fc[t]) - value(P_elec[t]) for t in T],
        'H2_Level': h2_levels_for_plot,  # H2 level at end of each step
        'H2_SOC': [level / h2_tank_capacity * 100 for level in h2_levels_for_plot],  # H2 SOC in %
        'Fuel_Cell_OM_Cost': [fuel_cell_om_cost * value(P_fc[t]) * step_size for t in T],
        'H2_Produced_kg': [value(H_produced[t]) for t in T]  # H2 produced per time step
    }

    # Aggregates (matching   calculations)
    total_load = sum(load_profile) * step_size
    total_served = total_load - sum(results['Load_Curtailed']) * step_size
    grid_import = sum(results['Grid_Import']) * step_size
    grid_export = sum(max(0.0, -p) for p in results['Grid_Power']) * step_size
    diesel_energy = sum(results['Diesel_Power']) * step_size
    fuel_cost_total = sum(results['Fuel_Cost'])
    total_pv_used = sum(results['PV_Used']) * step_size
    total_pv_avail = sum(results['Solar_Available']) * step_size
    total_charge = sum(results['Charge_Power']) * step_size
    total_discharge = sum(results['Discharge_Power']) * step_size
    battery_om_total = total_discharge * battery_om_cost
    
    # Hydrogen system totals (matching   calculations)
    total_h2_produced_kwh_input = sum(results['Electrolyzer_Power']) * step_size
    total_h2_produced_kg = sum(results['H2_Produced_kg']) * step_size
    total_h2_consumed_kwh_output = sum(results['Fuel_Cell_Power']) * step_size
    total_h2_consumed_kg = total_h2_consumed_kwh_output * fc_conversion_rate
    fuel_cell_om_total = sum(results['Fuel_Cell_OM_Cost'])
    electrolyzer_om_total = total_h2_produced_kwh_input * electrolyzer_om_cost
    round_trip_efficiency_h2 = (total_h2_consumed_kwh_output / total_h2_produced_kwh_input * 100) if total_h2_produced_kwh_input > 0 else 0
    
    # Cost calculations (matching notebook - allows negative grid power for exports)
    grid_cost = sum(results['Grid_Power'][t] * price_profile[t] * step_size for t in range(time_horizon))
    pv_cost = total_pv_used * pv_energy_cost
    curtail_kwh = sum(results['Load_Curtailed']) * step_size
    curtail_cost_total = curtail_kwh * load_curtail_cost
    total_cost_value = grid_cost + pv_cost + battery_om_total + fuel_cost_total + fuel_cell_om_total + electrolyzer_om_total + curtail_cost_total
    cost_per_kwh = (total_cost_value / total_served) if total_served > 0 else 0

    # Emissions summary (tCO2), computed from positive flows and life-cycle proxies
    # Always calculate emissions - don't use try/except that might hide issues
    grid_ef_kg = co2_kg_per_kwh["grid"]
    diesel_ef_kg = co2_kg_per_kwh["diesel"]
    solar_ef_kg = co2_kg_per_kwh["solar"]
    battery_ef_kg = co2_kg_per_kwh["battery"]
    fc_ef_kg = co2_kg_per_kwh["fuel_cell"]
    
    # Ensure all values are numeric (they should already be, but be safe)
    grid_import_val = float(grid_import) if grid_import is not None else 0.0
    diesel_energy_val = float(diesel_energy) if diesel_energy is not None else 0.0
    total_pv_used_val = float(total_pv_used) if total_pv_used is not None else 0.0
    total_discharge_val = float(total_discharge) if total_discharge is not None else 0.0
    total_h2_consumed_kwh_output_val = float(total_h2_consumed_kwh_output) if total_h2_consumed_kwh_output is not None else 0.0
    
    # Calculate emissions in tonnes CO2
    grid_emissions_t = (grid_import_val * grid_ef_kg) / 1000.0
    diesel_emissions_t = (diesel_energy_val * diesel_ef_kg) / 1000.0
    solar_emissions_t = (total_pv_used_val * solar_ef_kg) / 1000.0
    battery_emissions_t = (total_discharge_val * battery_ef_kg) / 1000.0
    fc_emissions_t = (total_h2_consumed_kwh_output_val * fc_ef_kg) / 1000.0
    total_emissions_t = grid_emissions_t + diesel_emissions_t + solar_emissions_t + battery_emissions_t + fc_emissions_t
    
    # Always set emissions - never None
    emissions = {
        "Total_CO2_t": round(total_emissions_t, 4),
        "Breakdown_t": {
            "Grid": round(grid_emissions_t, 4),
            "Diesel": round(diesel_emissions_t, 4),
            "Solar": round(solar_emissions_t, 4),
            "Battery": round(battery_emissions_t, 4),
            "Fuel_Cell": round(fc_emissions_t, 4),
        }
    }
    
    print(f"📊 Calculated emissions: Total_CO2_t = {emissions['Total_CO2_t']} tCO2")

    summary = {
        "Optimization_Period_days": num_days,
        "Resolution_min": time_resolution_minutes,
        "Weather": weather,
        "Objective": objective_type,
        "Load": {
            "Total_Demand_kWh": round(total_load, 2),
            "Total_Served_kWh": round(total_served, 2),
            "Served_Percent": round((total_served/total_load*100) if total_load>0 else 0, 1)
        },
        "Grid": {
            "Import_kWh": round(grid_import, 2), 
            "Export_kWh": round(grid_export, 2), 
            "Energy_Cost_INR": round(grid_cost, 2)
        },
        "Diesel": {
            "Energy_kWh": round(diesel_energy, 2), 
            "Fuel_Cost_INR": round(fuel_cost_total, 2)
        },
        "Battery": {
            "Charged_kWh": round(total_charge, 2),
            "Discharged_kWh": round(total_discharge, 2), 
            "OM_Cost_INR": round(battery_om_total, 2),
            "Capacity_kWh": round(battery_storage_energy, 2),
            "Voltage_V": round(battery_voltage, 2)
        },
        "Solar": {
            "Available_kWh": round(total_pv_avail, 2),
            "Used_kWh": round(total_pv_used, 2),
            "Used_Percent": round((total_pv_used/total_pv_avail*100) if total_pv_avail>0 else 0, 1)
        },
        "Hydrogen": {
            "Energy_to_Electrolyzer_kWh": round(total_h2_produced_kwh_input, 2),
            "Energy_from_Fuel_Cell_kWh": round(total_h2_consumed_kwh_output, 2),
            "Hydrogen_Produced_kg": round(total_h2_produced_kg, 2),
            "Hydrogen_Consumed_kg": round(total_h2_consumed_kg, 2),
            "Fuel_Cell_OM_Cost_INR": round(fuel_cell_om_total, 2),
            "Electrolyzer_OM_Cost_INR": round(electrolyzer_om_total, 2),
            "Round_Trip_Efficiency_percent": round(round_trip_efficiency_h2, 1),
            "Effective_Conversion_kWh_per_kg": round(total_h2_produced_kwh_input/total_h2_produced_kg if total_h2_produced_kg > 0 else 0, 2)
        },
        "Costs": {
            "Grid_Cost_INR": round(grid_cost, 2),
            "Diesel_Fuel_Cost_INR": round(fuel_cost_total, 2),
            "PV_Energy_Cost_INR": round(pv_cost, 2),
            "Battery_OM_Cost_INR": round(battery_om_total, 2),
            "Fuel_Cell_OM_Cost_INR": round(fuel_cell_om_total, 2),
            "Electrolyzer_OM_Cost_INR": round(electrolyzer_om_total, 2),
            "Curtailment_Cost_INR": round(curtail_cost_total, 2),
            "TOTAL_COST_INR": round(total_cost_value, 2),
            "Cost_per_kWh_INR": round(cost_per_kwh, 2),
            "Breakdown": {
                "Grid": round(grid_cost, 2),
                "Diesel": round(fuel_cost_total, 2),
                "PV": round(pv_cost, 2),
                "Battery": round(battery_om_total, 2),
                "Fuel_Cell": round(fuel_cell_om_total, 2),
                "Electrolyzer": round(electrolyzer_om_total, 2),
                "Curtailment": round(curtail_cost_total, 2)
            }
        },
        "Notes": {
            "Profile_Type": profile_type
        },
        "Emissions": emissions
    }

    # Generate all plots (matching   exactly)
    plt.style.use('seaborn-v0_8-whitegrid')
    plt.rcParams.update({'font.size': 14, 'font.family': 'serif', 'axes.labelweight': 'bold', 'axes.titleweight': 'bold'})
    colors = {'load': "#010103", 'grid': "#0863D1", 'diesel': "#72394F", 'battery': "#8938F3", 'solar': "#6BF520", 'h2': "#17becf", 'price': "#CA3510", 'cost': "#25E8F3"}
    
    # Create a figure with 3 subplots (vertical layout)
    fig = plt.figure(figsize=(10, 18))
    
    # Plot 1: Power Dispatch Strategy
    ax1 = plt.subplot(3, 1, 1)
    ax1.plot(results['Time_Hours'], results['Load_Demand'], color=colors['load'], label='Load Demand', linewidth=3, markersize=6, markerfacecolor='white', markeredgewidth=2, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.plot(results['Time_Hours'], results['Grid_Power'], color=colors['grid'], label='Grid Power', linewidth=2.5, markersize=5, alpha=0.8, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.plot(results['Time_Hours'], results['Diesel_Power'], color=colors['diesel'], label='Diesel Gen', linewidth=2.5, markersize=5, alpha=0.8, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.plot(results['Time_Hours'], results['PV_Used'], color=colors['solar'], label='Solar PV', linewidth=2.5, markersize=5, alpha=0.8, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.plot(results['Time_Hours'], results['Net_Battery_Power'], color=colors['battery'], label='Battery Power', linewidth=2.5, markersize=5, alpha=0.8, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.plot(results['Time_Hours'], results['Net_H2_Power'], color=colors['h2'], label='Hydrogen Sys Power', linewidth=2.5, markersize=6, alpha=0.8, markevery=max(1, len(results['Time_Hours'])//100))
    ax1.set_title(f'Optimal Power Dispatch Strategy ({num_days} Day{"s" if num_days > 1 else ""}, {time_resolution_minutes}-min resolution)', fontsize=16, pad=20, fontweight='bold')
    ax1.set_xlabel('Time [hours]', fontsize=14)
    ax1.set_ylabel('Power [kW]', fontsize=14)
    ax1.legend(loc='upper right', fontsize=10, framealpha=0.9, ncol=3)
    ax1.grid(True, alpha=0.3)
    ax1.set_xlim(-0.5, num_days * 24 + 0.5)
    
    # Calculate Y-axis range from -min to +max with margin
    all_power_values = []
    all_power_values.extend(results['Load_Demand'])
    all_power_values.extend(results['Grid_Power'])
    all_power_values.extend(results['Diesel_Power'])
    all_power_values.extend(results['PV_Used'])
    all_power_values.extend(results['Net_Battery_Power'])
    all_power_values.extend(results['Net_H2_Power'])
    
    min_power = min(all_power_values)
    max_power = max(all_power_values)
    margin = max(abs(min_power), abs(max_power)) * 0.1  # 10% margin
    ax1.set_ylim(min_power - margin, max_power + margin)
    
    # Plot 2: Battery State of Charge
    ax2 = plt.subplot(3, 1, 2)
    ax2.plot(results['Time_Hours'], results['Battery_SOC'], color=colors['battery'], linewidth=4, markersize=6, markerfacecolor='white', markeredgewidth=3, markevery=max(1, len(results['Time_Hours'])//100))
    ax2.axhline(y=bess_min_soc*100, color='red', linestyle='--', alpha=0.7, linewidth=2, label=f'Min SOC ({bess_min_soc*100:.0f}%)')
    ax2.axhline(y=bess_max_soc*100, color='green', linestyle='--', alpha=0.7, linewidth=2, label=f'Max SOC ({bess_max_soc*100:.0f}%)')
    ax2.fill_between(results['Time_Hours'], bess_min_soc*100, bess_max_soc*100, alpha=0.1, color=colors['battery'])
    ax2.set_title(f'Battery State of Charge ({num_days} Day{"s" if num_days > 1 else ""})', fontsize=16, pad=20)
    ax2.set_xlabel('Time [hours]', fontsize=14)
    ax2.set_ylabel('State of Charge [%]', fontsize=14)
    ax2.set_ylim(-5, 105)
    ax2.set_xlim(-0.5, num_days * 24 + 0.5)
    ax2.grid(True, alpha=0.3)
    ax2.legend(fontsize=12, framealpha=0.9, loc='upper right')
    
    # Plot 3: Hydrogen Storage Level
    ax3 = plt.subplot(3, 1, 3)
    ax3.plot(results['Time_Hours'], results['H2_SOC'], color=colors['h2'], linewidth=4, markersize=7, markerfacecolor='white', markeredgewidth=3, markevery=max(1, len(results['Time_Hours'])//100))
    ax3.axhline(y=h2_min_soc*100, color='red', linestyle='--', alpha=0.7, linewidth=2, label=f'Min Level ({h2_min_soc*100:.0f}%)')
    ax3.axhline(y=h2_max_soc*100, color='green', linestyle='--', alpha=0.7, linewidth=2, label=f'Max Level ({h2_max_soc*100:.0f}%)')
    ax3.fill_between(results['Time_Hours'], h2_min_soc*100, h2_max_soc*100, alpha=0.1, color=colors['h2'])
    ax3.set_title(f'Hydrogen Storage Level ({num_days} Day{"s" if num_days > 1 else ""})', fontsize=16, pad=20)
    ax3.set_xlabel('Time [hours]', fontsize=14)
    ax3.set_ylabel('Hydrogen Stored [% of Capacity]', fontsize=14)
    ax3.set_ylim(-5, 105)
    ax3.set_xlim(-0.5, num_days * 24 + 0.5)
    ax3.grid(True, alpha=0.3)
    ax3.legend(fontsize=12, framealpha=0.9, loc='upper right')
    
    plt.tight_layout()
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=150, bbox_inches='tight')
    buf.seek(0)
    plot_bytes = buf.read()
    plt.close()

    return summary, plot_bytes


@router.post("/optimize")
async def optimize(
    file: Optional[UploadFile] = None,
    profile_type: str = Form("Auto detect"),
    weather: str = Form("Sunny"),
    objective_type: str = Form("cost"),
    num_days: int = Form(2),
    time_resolution_minutes: int = Form(30),
    grid_connection: float = Form(2000),
    solar_connection: float = Form(2000),
    battery_capacity: float = Form(4000000),  # Wh
    battery_voltage: float = Form(100),
    diesel_capacity: float = Form(2200),
    fuel_price: float = Form(95),
    pv_energy_cost: float = Form(2.85),
    load_curtail_cost: float = Form(50),
    battery_om_cost: float = Form(6.085),
    electrolyzer_capacity: float = Form(1000.0),
    fuel_cell_capacity: float = Form(800.0),
    h2_tank_capacity: float = Form(100.0),
    fuel_cell_efficiency_percent: float = Form(0.60),
    fuel_cell_om_cost: float = Form(1.5),
    electrolyzer_om_cost: float = Form(0.5),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Unified EMS optimization endpoint:
    - Accepts uploaded CSV or uses default 24-hour base profiles
    - Automatically infers duration (days) from uploaded file
    - Returns JSON summary + Base64-encoded plot in one response
    """
    # Default 24-hour profiles (fallback - matching  )
    load_profile = [800, 750, 700, 650, 600, 650, 750, 850, 950, 1100, 1200, 1300,
                    1250, 1200, 1150, 1200, 1300, 1400, 1500, 1450, 1300, 1150, 1000, 900]
    price_profile = [3.5, 3.2, 3.0, 2.8, 2.5, 2.8, 4.2, 5.5, 6.2, 7.8, 8.5,
                     9.2, 8.8, 8.2, 7.5, 8.0, 8.8, 9.5, 10.2, 9.8, 8.5, 7.2, 5.5, 4.2]

    inferred_days = num_days  # default to user input

    # Handle uploaded CSV/XLSX
    solar_profile_input = None
    if file:
        file_bytes = await file.read()
        filename = file.filename or ""
        try:
            if filename.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(BytesIO(file_bytes))
            else:
                df = pd.read_csv(BytesIO(file_bytes))
        except Exception as e:
            return JSONResponse({"status": "error", "message": f"Failed to read uploaded file: {e}"}, status_code=400)

        # Check for datetime/timestamp columns (case-insensitive)
        datetime_col = None
        for col in df.columns:
            if col.lower() in ['timestamp', 'datetime', 'date', 'time']:
                datetime_col = col
                break

        if datetime_col:
            df[datetime_col] = pd.to_datetime(df[datetime_col])
            df = df.sort_values(datetime_col)

            # Infer resolution and duration
            inferred_resolution = (df[datetime_col].iloc[1] - df[datetime_col].iloc[0]).seconds / 60
            time_resolution_minutes = int(inferred_resolution)
            total_minutes = (df[datetime_col].iloc[-1] - df[datetime_col].iloc[0]).total_seconds() / 60
            inferred_days = max(1, round(total_minutes / (24 * 60)))

            print(f"📂 Using uploaded file with inferred {inferred_days} day(s) and {time_resolution_minutes}-minute resolution")

        # Extract load/price columns (case-insensitive)
        load_profile = df.iloc[:, df.columns.str.contains("Load", case=False)].squeeze().tolist()
        price_profile = df.iloc[:, df.columns.str.contains("Price", case=False)].squeeze().tolist()

        # Extract solar column (Solar/PV), if present
        solar_cols = df.columns[df.columns.str.contains("Solar|PV", case=False, regex=True)]
        if len(solar_cols) > 0:
            raw_solar = df[solar_cols[0]].astype(float).fillna(0.0).tolist()
            # Normalize: if values look like kW (max > 1.2), divide by solar_connection to get 0..1 factor
            max_val = max(raw_solar) if raw_solar else 0.0
            if max_val > 1.2:
                try:
                    solar_connection = float(solar_connection)
                except Exception:
                    solar_connection = float(params.get("solar_connection", 2000)) if 'params' in locals() else 2000.0
                solar_profile_input = [max(0.0, min(1.0, v / solar_connection)) for v in raw_solar]
            else:
                # Assume already normalized (0-1)
                # Scale gradually to match weather condition's typical profile peak
                # This preserves the shape while allowing gradual scaling based on weather
                weather_lower = str(weather).lower()
                if weather_lower == "sunny":
                    target_peak = 1.0  # Sunny days can reach full capacity
                elif weather_lower == "cloudy":
                    target_peak = 0.7  # Cloudy days typically peak at ~70%
                else:  # rainy
                    target_peak = 0.3  # Rainy days typically peak at ~30%
                
                if max_val > 0 and max_val < target_peak:
                    # Scale gradually: scale the profile to match weather-appropriate peak
                    scale_factor = target_peak / max_val
                    solar_profile_input = [max(0.0, min(1.0, v * scale_factor)) for v in raw_solar]
                else:
                    # Use as-is if already at or above target peak, or if all zeros
                    solar_profile_input = [max(0.0, min(1.0, v)) for v in raw_solar]

        # Fallback: infer days if timestamp missing
        if not datetime_col:
            records_per_day = int(24 * (60 / time_resolution_minutes))
            inferred_days = max(1, round(len(df) / records_per_day))
            print(f"📊 Inferred duration from row count: {inferred_days} day(s)")

    # Build Parameters
    params = {
        "num_days": inferred_days,
        "time_resolution_minutes": time_resolution_minutes,
        "grid_connection": grid_connection,
        "solar_connection": solar_connection,
        "battery_capacity": battery_capacity,
        "battery_voltage": battery_voltage,
        "diesel_capacity": diesel_capacity,
        "fuel_price": fuel_price,
        "pv_energy_cost": pv_energy_cost,
        "load_curtail_cost": load_curtail_cost,
        "battery_om_cost": battery_om_cost,
        "weather": weather,
        "objective_type": objective_type,
        "profile_type": profile_type,
        "electrolyzer_capacity": electrolyzer_capacity,
        "fuel_cell_capacity": fuel_cell_capacity,
        "h2_tank_capacity": h2_tank_capacity,
        "fuel_cell_efficiency_percent": fuel_cell_efficiency_percent,
        "fuel_cell_om_cost": fuel_cell_om_cost,
        "electrolyzer_om_cost": electrolyzer_om_cost
    }

    # Run Optimization + Generate Plot
    try:
        summary, plot_bytes = run_optimization(params, load_profile, price_profile, solar_profile_input)

        # Debug: Verify emissions are in summary
        if "Emissions" in summary:
            print(f"✅ Emissions in summary: {summary['Emissions']}")
        else:
            print(f"⚠️ WARNING: Emissions not found in summary! Keys: {list(summary.keys())}")

        # Convert image bytes → base64 for direct UI rendering
        plot_base64 = base64.b64encode(plot_bytes).decode("utf-8")

        return JSONResponse({
            "status": "success",
            "summary": summary,
            "plot_base64": plot_base64
        })

    except ValueError as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Optimization failed: {str(e)}"}, status_code=500)

