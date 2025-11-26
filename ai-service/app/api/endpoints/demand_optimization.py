# ai-service/app/api/endpoints/demand_optimization.py

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


"""
MILP-based demand optimization with multi-load prioritization.
Models 5 loads (2 critical, 3 curtailable) with per-load curtailment penalties.
Prevents grid export when curtailment occurs.
Returns detailed summary with per-load analysis and dispatch plots.
"""
def run_demand_optimization(params, load_profiles_dict, price_profile_24h, solar_profile_24h: Optional[list] = None):
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
        battery_om_cost = max(0, float(params["battery_om_cost"]))  # INR/kWh
        weather = str(params["weather"]).lower()
        profile_type = str(params.get("profile_type", "Auto detect"))
        # Note: Only cost optimization is supported (matching notebook)
        
        # Hydrogen system parameters
        electrolyzer_capacity = max(0, float(params.get("electrolyzer_capacity", 1000.0)))  # kW
        fuel_cell_capacity = max(0, float(params.get("fuel_cell_capacity", 1000.0)))  # kW
        h2_tank_capacity = max(0, float(params.get("h2_tank_capacity", 100.0)))  # kg
        fuel_cell_efficiency_percent = max(0, min(1, float(params.get("fuel_cell_efficiency_percent", 0.60))))  # 0-1
        fuel_cell_om_cost = max(0, float(params.get("fuel_cell_om_cost", 1.5)))  # INR/kWh
        electrolyzer_om_cost = max(0, float(params.get("electrolyzer_om_cost", 0.5)))  # INR/kWh
        
        # Curtailment penalties per load (defaults from notebook)
        curtail_penalty = {
            3: max(0, float(params.get("curtail_penalty_load3", 18.0))),  # High priority
            4: max(0, float(params.get("curtail_penalty_load4", 10.0))),  # Medium priority
            5: max(0, float(params.get("curtail_penalty_load5", 8.0)))     # Low priority
        }
        
        # CO2 emission parameters
        co2_grid_import = max(0, float(params.get("co2_grid_import", 0.82)))
        co2_diesel = max(0, float(params.get("co2_diesel", 0.27)))
        co2_battery_discharge = max(0, float(params.get("co2_battery_discharge", 0.02)))
        co2_pv_used = max(0, float(params.get("co2_pv_used", 0.05)))
        co2_fuel_cell = max(0, float(params.get("co2_fuel_cell", 0.0)))
        co2_electrolyzer = max(0, float(params.get("co2_electrolyzer", 0.0)))
        
        # Validate load profiles
        if not load_profiles_dict or len(load_profiles_dict) < 5:
            raise ValueError("Must provide 5 load profiles")
        for i in [1, 2, 3, 4, 5]:
            if i not in load_profiles_dict or len(load_profiles_dict[i]) < 24:
                raise ValueError(f"Load profile {i} must contain at least 24 data points")
        if len(price_profile_24h) < 24:
            raise ValueError("Price profile must contain at least 24 data points")
            
    except (ValueError, TypeError, KeyError) as e:
        raise ValueError(f"Invalid input parameters: {str(e)}")

    # Battery capacity: API receives Wh, convert to Ah
    battery_capacity_ah = battery_capacity_wh / battery_voltage  # Ah

    # Hydrogen system constants
    H2_LHV = 33.3  # kWh/kg

    step_size = time_resolution_minutes / 60.0
    steps_per_hour = int(60 / time_resolution_minutes)
    time_horizon = num_days * 24 * steps_per_hour

    # Solar profiles
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
        wl = str(weather).lower()
        if wl == "rainy":
            solar_profile_base = solar_profile_rainy
        elif wl == "cloudy":
            solar_profile_base = solar_profile_cloudy
        else:
            solar_profile_base = solar_profile_sunny

    # Load IDs and classification
    load_ids = [1, 2, 3, 4, 5]
    critical_loads = [1, 2]  # Loads 1 and 2 are critical
    dr_loads = [3, 4, 5]     # Loads 3, 4, 5 are curtailable

    # Upsample all five load profiles
    expected_steps = num_days * 24 * steps_per_hour
    load_profiles = {}
    for i in load_ids:
        profile_24h = load_profiles_dict[i]
        if len(profile_24h) == expected_steps:
            load_profiles[i] = profile_24h
        else:
            load_profiles[i] = upsample_profile(profile_24h, steps_per_hour, num_days)

    # Upsample price and solar profiles
    if len(price_profile_24h) == expected_steps:
        price_profile = price_profile_24h
    else:
        price_profile = upsample_profile(price_profile_24h, steps_per_hour, num_days)

    if len(solar_profile_base) == expected_steps:
        solar_profile = solar_profile_base
    else:
        solar_profile = upsample_profile(solar_profile_base, steps_per_hour, num_days)

    # System capacities
    grid_max_power = grid_connection
    solar_capacity = solar_connection
    battery_storage_energy = battery_capacity_wh / 1000.0  # Convert Wh to kWh
    battery_power = battery_storage_energy * 0.5  # kW, 0.5C rate
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
    model = LpProblem('Demand_Optimization_MILP', LpMinimize)
    T = range(time_horizon)

    # Decision variables
    P_grid = {t: LpVariable(f"P_grid_{t}", -grid_max_power, grid_max_power) for t in T}
    P_diesel = {t: LpVariable(f"P_diesel_{t}", 0, diesel_max_power) for t in T}
    z_diesel = {t: LpVariable(f"z_diesel_{t}", cat='Binary') for t in T}
    F_diesel = {t: LpVariable(f"F_diesel_{t}", 0) for t in T}
    P_charge = {t: LpVariable(f"P_charge_{t}", 0, bess_charge_capacity) for t in T}
    P_discharge = {t: LpVariable(f"P_discharge_{t}", 0, bess_discharge_capacity) for t in T}
    E_battery = {t: LpVariable(f"E_battery_{t}", bess_min_soc * bess_energy_capacity, bess_max_soc * bess_energy_capacity) for t in T}
    z_bess = {t: LpVariable(f"z_bess_{t}", cat='Binary') for t in T}
    P_pv_used = {t: LpVariable(f"P_pv_used_{t}", 0) for t in T}
    P_solar_curt = {t: LpVariable(f"P_solar_curt_{t}", 0) for t in T}

    # Hydrogen system variables
    P_elec = {t: LpVariable(f"P_elec_{t}", 0, electrolyzer_capacity) for t in T}
    P_fc = {t: LpVariable(f"P_fc_{t}", 0, fuel_cell_capacity) for t in T}
    E_h2 = {t: LpVariable(f"E_h2_{t}", h2_min_soc * h2_tank_capacity, h2_max_soc * h2_tank_capacity) for t in T}
    z_h2 = {t: LpVariable(f"z_h2_{t}", cat='Binary') for t in T}
    P_elec_s1 = {t: LpVariable(f"P_elec_s1_{t}", 0, width_s1) for t in T}
    P_elec_s2 = {t: LpVariable(f"P_elec_s2_{t}", 0, width_s2) for t in T}
    z_elec_s2 = {t: LpVariable(f"z_elec_s2_{t}", cat='Binary') for t in T}
    H_produced = {t: LpVariable(f"H_produced_{t}", 0) for t in T}

    # Served / curtailed loads (per load, per time step)
    P_served = {(i, t): LpVariable(f"P_served_L{i}_{t}", 0) for i in load_ids for t in T}
    P_curt = {(i, t): LpVariable(f"P_curt_L{i}_{t}", 0) for i in dr_loads for t in T}

    # Binary flag: is there any curtailment at time t?
    M_curt = sum(max(load_profiles[i]) for i in dr_loads)  # big-M for total curtailable load
    z_curt = {t: LpVariable(f"z_curt_{t}", cat='Binary') for t in T}

    # Constraints
    # Load constraints
    for t in T:
        # Critical loads: must be fully served
        for i in critical_loads:
            model += P_served[(i, t)] == load_profiles[i][t], f"crit_load_{i}_served_{t}"
        # Non-critical: served + curtailed = demand
        for i in dr_loads:
            model += P_served[(i, t)] + P_curt[(i, t)] == load_profiles[i][t], f"dr_load_{i}_balance_{t}"

    # Option B: Forbid grid export when any curtailment occurs at time t
    for t in T:
        # If there is any curtailment -> z_curt[t] must be 1
        model += lpSum(P_curt[(i, t)] for i in dr_loads) <= M_curt * z_curt[t], f"curt_indicator_{t}"
        # If z_curt[t] = 1 (curtailment), then P_grid[t] >= 0 (no export)
        model += P_grid[t] >= -grid_max_power * (1 - z_curt[t]), f"no_export_when_curt_{t}"

    # Power balance
    for t in T:
        total_served_load = sum(P_served[(i, t)] for i in load_ids)
        supply = P_pv_used[t] + P_diesel[t] + P_discharge[t] + P_grid[t] + P_fc[t]
        demand = total_served_load + P_charge[t] + P_elec[t]
        model += (supply == demand), f"power_balance_{t}"

    # Solar
    for t in T:
        solar_available = solar_profile[t] * solar_capacity
        model += P_pv_used[t] + P_solar_curt[t] == solar_available, f"pv_balance_{t}"

    # Diesel
    for t in T:
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

    # Objective function: Cost minimization only (matching notebook lines 314-328)
    cost_components = []
    for t in T:
        cost_components.extend([
            step_size * price_profile[t] * P_grid[t],
            fuel_price * F_diesel[t],
            step_size * pv_energy_cost * P_pv_used[t],
            step_size * battery_om_cost * P_discharge[t],
            step_size * fuel_cell_om_cost * P_fc[t],
            step_size * electrolyzer_om_cost * P_elec[t]
        ])
        # Curtailment penalties
        for i in dr_loads:
            cost_components.append(step_size * curtail_penalty[i] * P_curt[(i, t)])
    
    model += sum(cost_components)

    # Solve
    cbc_path = shutil.which('cbc')
    if cbc_path:
        os.environ['COIN_CMD'] = cbc_path
        solver = COIN_CMD(msg=0, timeLimit=180, gapRel=0.01)
        print(f"Using system CBC solver at: {cbc_path}")
    else:
        solver = PULP_CBC_CMD(msg=0, timeLimit=180, gapRel=0.01)
        print("Using bundled CBC solver")
    model.solve(solver)
    
    # Check if solution was found
    if model.status != LpStatusOptimal:
        status_msg = LpStatus.get(model.status, f"Unknown status {model.status}")
        error_msg = f"Optimization failed with status: {status_msg}"
        print(f"❌ {error_msg}")
        raise ValueError(error_msg)

    # Gather results
    time_hours = [t * step_size for t in T]
    
    # Calculate H2 levels at end of each time step
    h2_levels_for_plot = []
    for t in T:
        h2_at_end_of_t = value(E_h2[t]) + value(H_produced[t]) * step_size - value(P_fc[t]) * step_size * fc_conversion_rate
        h2_levels_for_plot.append(h2_at_end_of_t)
    
    # Build per-load series
    load_demand_total = []
    load_curt_total = []
    load_demand_by_i = {i: [] for i in load_ids}
    load_served_by_i = {i: [] for i in load_ids}
    load_curt_by_i = {i: [] for i in load_ids}

    for t in T:
        total_demand_t = 0.0
        total_curt_t = 0.0
        for i in load_ids:
            demand_it = load_profiles[i][t]
            served_it = value(P_served[(i, t)])
            if i in dr_loads:
                curt_it = value(P_curt[(i, t)])
            else:
                curt_it = 0.0

            load_demand_by_i[i].append(demand_it)
            load_served_by_i[i].append(served_it)
            load_curt_by_i[i].append(curt_it)

            total_demand_t += demand_it
            total_curt_t += curt_it

        load_demand_total.append(total_demand_t)
        load_curt_total.append(total_curt_t)

    results = {
        'Time_Step': list(range(time_horizon)),
        'Time_Hours': time_hours,
        'Load_Demand': load_demand_total,
        'Price': price_profile,
        'Grid_Power': [value(P_grid[t]) for t in T],
        'Load_Curtailed': load_curt_total,
        'Diesel_Power': [value(P_diesel[t]) for t in T],
        'Fuel_Use_l': [step_size * value(F_diesel[t]) for t in T],
        'Fuel_Cost': [step_size * fuel_price * value(F_diesel[t]) for t in T],
        'Charge_Power': [value(P_charge[t]) for t in T],
        'Discharge_Power': [value(P_discharge[t]) for t in T],
        'Net_Battery_Power': [value(P_discharge[t]) - value(P_charge[t]) for t in T],
        'Battery_Level': [value(E_battery[t]) for t in T],
        'Battery_SOC': [value(E_battery[t]) / bess_energy_capacity * 100 for t in T],
        'Solar_Available': [solar_profile[t] * solar_capacity for t in T],
        'PV_Used': [value(P_pv_used[t]) for t in T],
        'Solar_Curtailed': [value(P_solar_curt[t]) for t in T],
        'Electrolyzer_Power': [value(P_elec[t]) for t in T],
        'Fuel_Cell_Power': [value(P_fc[t]) for t in T],
        'Net_H2_Power': [value(P_fc[t]) - value(P_elec[t]) for t in T],
        'H2_Level': h2_levels_for_plot,
        'H2_SOC': [level / h2_tank_capacity * 100 for level in h2_levels_for_plot],
        'Fuel_Cell_OM_Cost': [fuel_cell_om_cost * value(P_fc[t]) * step_size for t in T],
        'H2_Produced_kg': [value(H_produced[t]) for t in T]
    }

    # Add per-load data
    for i in load_ids:
        results[f'Load{i}_Demand'] = load_demand_by_i[i]
        results[f'Load{i}_Served'] = load_served_by_i[i]
        results[f'Load{i}_Curtailed'] = load_curt_by_i[i]

    # Aggregates
    total_load_demand = sum(load_demand_total) * step_size
    total_load_served = total_load_demand - sum(load_curt_total) * step_size
    grid_import = sum(max(0.0, p) for p in results['Grid_Power']) * step_size
    grid_export = sum(max(0.0, -p) for p in results['Grid_Power']) * step_size
    diesel_energy = sum(results['Diesel_Power']) * step_size
    fuel_cost_total = sum(results['Fuel_Cost'])
    total_pv_used = sum(results['PV_Used']) * step_size
    total_pv_avail = sum(results['Solar_Available']) * step_size
    total_charge = sum(results['Charge_Power']) * step_size
    total_discharge = sum(results['Discharge_Power']) * step_size
    battery_om_total = total_discharge * battery_om_cost
    
    # Hydrogen system totals
    total_h2_produced_kwh_input = sum(results['Electrolyzer_Power']) * step_size
    total_h2_produced_kg = sum(results['H2_Produced_kg']) * step_size
    total_h2_consumed_kwh_output = sum(results['Fuel_Cell_Power']) * step_size
    total_h2_consumed_kg = total_h2_consumed_kwh_output * fc_conversion_rate
    fuel_cell_om_total = sum(results['Fuel_Cell_OM_Cost'])
    electrolyzer_om_total = total_h2_produced_kwh_input * electrolyzer_om_cost
    round_trip_efficiency_h2 = (total_h2_consumed_kwh_output / total_h2_produced_kwh_input * 100) if total_h2_produced_kwh_input > 0 else 0
    
    # Cost calculations
    grid_cost = sum(max(0.0, results['Grid_Power'][t]) * price_profile[t] * step_size for t in range(time_horizon))
    pv_cost = total_pv_used * pv_energy_cost
    curt_cost_total = sum(
        sum(load_curt_by_i[i]) * step_size * curtail_penalty[i]
        for i in dr_loads
    )
    total_cost_value = grid_cost + pv_cost + battery_om_total + fuel_cost_total + fuel_cell_om_total + electrolyzer_om_total + curt_cost_total
    cost_per_kwh = (total_cost_value / total_load_served) if total_load_served > 0 else 0

    # Emissions summary (kg CO2)
    grid_emissions_kg = sum(co2_grid_import * max(0, value(P_grid[t])) * step_size for t in T)
    diesel_emissions_kg = sum(co2_diesel * value(P_diesel[t]) * step_size for t in T)
    battery_emissions_kg = sum(co2_battery_discharge * value(P_discharge[t]) * step_size for t in T)
    solar_emissions_kg = sum(co2_pv_used * value(P_pv_used[t]) * step_size for t in T)
    fc_emissions_kg = sum(co2_fuel_cell * value(P_fc[t]) * step_size for t in T)
    elec_emissions_kg = sum(co2_electrolyzer * value(P_elec[t]) * step_size for t in T)
    total_emissions_kg = grid_emissions_kg + diesel_emissions_kg + battery_emissions_kg + solar_emissions_kg + fc_emissions_kg + elec_emissions_kg

    # Per-load breakdown
    load_breakdown = {}
    for i in load_ids:
        served = sum(load_served_by_i[i]) * step_size
        curt = sum(load_curt_by_i[i]) * step_size
        demand = served + curt
        load_breakdown[i] = {
            "Demand_kWh": round(demand, 2),
            "Served_kWh": round(served, 2),
            "Curtailed_kWh": round(curt, 2),
            "Served_Percent": round((served/demand*100) if demand > 0 else 0, 1),
            "Type": "CRITICAL" if i in critical_loads else "CURTAILABLE"
        }

    summary = {
        "Optimization_Period_days": num_days,
        "Resolution_min": time_resolution_minutes,
        "Weather": weather,
        "Objective": "cost",  # Single objective: cost minimization only
        "Load": {
            "Total_Demand_kWh": round(total_load_demand, 2),
            "Total_Served_kWh": round(total_load_served, 2),
            "Total_Curtailed_kWh": round(total_load_demand - total_load_served, 2),
            "Served_Percent": round((total_load_served/total_load_demand*100) if total_load_demand>0 else 0, 1),
            "Per_Load_Breakdown": load_breakdown
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
            "Curtailment_Cost_INR": round(curt_cost_total, 2),
            "TOTAL_COST_INR": round(total_cost_value, 2),
            "Cost_per_kWh_INR": round(cost_per_kwh, 2),
            "Breakdown": {
                "Grid": round(grid_cost, 2),
                "Diesel": round(fuel_cost_total, 2),
                "PV": round(pv_cost, 2),
                "Battery": round(battery_om_total, 2),
                "Fuel_Cell": round(fuel_cell_om_total, 2),
                "Electrolyzer": round(electrolyzer_om_total, 2),
                "Curtailment": round(curt_cost_total, 2)
            }
        },
        "Emissions": {
            "Total_CO2_kg": round(total_emissions_kg, 2),
            "Emissions_per_kWh_kg": round(total_emissions_kg/total_load_served if total_load_served > 0 else 0, 4),
            "Breakdown_kg": {
                "Grid": round(grid_emissions_kg, 2),
                "Diesel": round(diesel_emissions_kg, 2),
                "Battery": round(battery_emissions_kg, 2),
                "Solar": round(solar_emissions_kg, 2),
                "Fuel_Cell": round(fc_emissions_kg, 2),
                "Electrolyzer": round(elec_emissions_kg, 2),
            }
        },
        "Notes": {
            "Profile_Type": profile_type
        }
    }

    # Generate plots (7 subplots matching notebook)
    plt.style.use('seaborn-v0_8-whitegrid')
    plt.rcParams.update({'font.size': 12, 'font.family': 'serif', 'axes.labelweight': 'bold', 'axes.titleweight': 'bold'})
    colors = {
        'load': "#010103",
        'grid': "#0863D1",
        'diesel': "#72394F",
        'battery': "#8938F3",
        'solar': "#6BF520",
        'h2': "#17becf",
        'served': "#2ca02c",
        'curt': "#d62728",
        'price': "#CA3510"
    }
    
    fig, axes = plt.subplots(7, 1, figsize=(12, 28), sharex=True)
    
    # Subplot 1: Power Flow from All Components
    ax0 = axes[0]
    ax0.plot(time_hours, results['Load_Demand'], color=colors['load'], linewidth=2.5, label="Total Load Demand")
    ax0.plot(time_hours, results['Grid_Power'], color=colors['grid'], linewidth=1.8, label="Grid Power")
    ax0.plot(time_hours, results['Diesel_Power'], color=colors['diesel'], linewidth=1.8, label="Diesel Gen")
    ax0.plot(time_hours, results['PV_Used'], color=colors['solar'], linewidth=1.8, label="Solar PV")
    ax0.plot(time_hours, results['Net_Battery_Power'], color=colors['battery'], linewidth=1.8, label="Battery Power")
    ax0.plot(time_hours, results['Net_H2_Power'], color=colors['h2'], linewidth=1.8, label="Hydrogen System Power")
    ax0.set_title("Power Flow from All Components", pad=12)
    ax0.set_ylabel("Power (kW)")
    ax0.set_xlabel("Time (hours)")
    ax0.grid(True, alpha=0.3)
    ax0.legend(fontsize=9, ncol=3, loc='upper right')
    ax0.set_xlim(min(time_hours), max(time_hours))
    
    # Subplot 2: Time-varying & Constant Energy Costs
    ax1 = axes[1]
    ax1.plot(time_hours, results['Price'], color=colors['price'], linewidth=2.0, label="Grid Price (time-varying)")
    ax1.plot(time_hours, [pv_energy_cost] * len(time_hours), color=colors['solar'], linestyle='--', linewidth=1.8, label=f"PV Cost ({pv_energy_cost} INR/kWh)")
    ax1.plot(time_hours, [battery_om_cost] * len(time_hours), color=colors['battery'], linestyle='--', linewidth=1.8, label=f"Battery O&M ({battery_om_cost} INR/kWh)")
    ax1.plot(time_hours, [fuel_cell_om_cost] * len(time_hours), color=colors['h2'], linestyle='--', linewidth=1.8, label=f"Fuel Cell O&M ({fuel_cell_om_cost} INR/kWh)")
    ax1.plot(time_hours, [electrolyzer_om_cost] * len(time_hours), color='gray', linestyle='--', linewidth=1.8, label=f"Electrolyzer O&M ({electrolyzer_om_cost} INR/kWh)")
    ax1.set_title("Energy Cost of Grid and Other Components", pad=10)
    ax1.set_ylabel("Cost (INR/kWh)")
    ax1.set_xlabel("Time (hours)")
    ax1.grid(True, alpha=0.3)
    ax1.legend(fontsize=9, ncol=2, loc='upper right')
    ax1.set_xlim(min(time_hours), max(time_hours))
    
    # Helper function for Load Subplots
    def plot_load(ax, load_id, is_critical=False):
        ax.plot(time_hours, results[f'Load{load_id}_Demand'], color=colors['load'], linewidth=2, label=f"Load {load_id} Demand")
        ax.plot(time_hours, results[f'Load{load_id}_Served'], color=colors['served'], linestyle='--', linewidth=2, label=f"Load {load_id} Served")
        ax.plot(time_hours, results[f'Load{load_id}_Curtailed'], color=colors['curt'], linestyle=':', linewidth=2, label=f"Load {load_id} Curtailed")
        title = f"Load {load_id} (Critical)" if is_critical else f"Load {load_id} (Curtailable)"
        ax.set_title(title, pad=10)
        ax.set_ylabel("Power (kW)")
        ax.set_xlabel("Time (hours)")
        ax.grid(True, alpha=0.3)
        ax.set_xlim(min(time_hours), max(time_hours))
        ax.legend(fontsize=9, loc='upper right')
    
    # Subplots 3-7: Loads 1-5
    plot_load(axes[2], 1, is_critical=True)
    plot_load(axes[3], 2, is_critical=True)
    plot_load(axes[4], 3, is_critical=False)
    plot_load(axes[5], 4, is_critical=False)
    plot_load(axes[6], 5, is_critical=False)
    
    plt.tight_layout()
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=150, bbox_inches='tight')
    buf.seek(0)
    plot_bytes = buf.read()
    plt.close()

    # Build chart_data for frontend
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    chart_data = []
    for t in T:
        ts = base_time + timedelta(minutes=t * time_resolution_minutes)
        chart_data.append({
            "timestamp": ts.isoformat(),
            "load_kwh": float(load_demand_total[t]) * step_size,
            "solar_kwh": float(value(P_pv_used[t])) * step_size,
            "grid_kwh": float(max(0.0, value(P_grid[t]))) * step_size,
            "battery_discharge_kwh": float(value(P_discharge[t])) * step_size,
            "battery_charge_kwh": float(value(P_charge[t])) * step_size,
            "battery_soc_percent": float(results['Battery_SOC'][t]),
        })

    return summary, plot_bytes, chart_data


@router.post("/demand-optimize")
async def optimize_demand(
    file: Optional[UploadFile] = None,
    profile_type: str = Form("Auto detect"),
    weather: str = Form("Sunny"),
    # objective_type removed - only cost optimization supported (matching notebook)
    num_days: int = Form(1),
    time_resolution_minutes: int = Form(60),
    grid_connection: float = Form(2500),
    solar_connection: float = Form(2000),
    battery_capacity: float = Form(4000000),  # Wh
    battery_voltage: float = Form(100),
    diesel_capacity: float = Form(2200),
    fuel_price: float = Form(90),
    pv_energy_cost: float = Form(2.85),
    battery_om_cost: float = Form(6.085),
    electrolyzer_capacity: float = Form(1000.0),
    fuel_cell_capacity: float = Form(1000.0),
    h2_tank_capacity: float = Form(100.0),
    fuel_cell_efficiency_percent: float = Form(0.60),
    fuel_cell_om_cost: float = Form(1.5),
    electrolyzer_om_cost: float = Form(0.5),
    curtail_penalty_load3: float = Form(18.0),
    curtail_penalty_load4: float = Form(10.0),
    curtail_penalty_load5: float = Form(8.0),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Demand optimization endpoint with multi-load prioritization:
    - Accepts uploaded CSV with 5 load profiles or uses default profiles
    - Optimizes with 2 critical loads (must be fully served) and 3 curtailable loads
    - Prevents grid export when curtailment occurs
    - Returns JSON summary + Base64-encoded plot with per-load analysis
    """
    # Default 24-hour profiles (from notebook)
    load1_24h = [160,150,140,130,120,130,150,170,190,220,240,260,250,240,230,240,260,280,300,290,260,230,200,180]
    load2_24h = [160,180,120,110,140,170,150,130,170,200,250,280,230,210,200,200,210,270,200,220,210,190,200,180]
    load3_24h = [200,190,180,170,160,170,190,220,250,290,320,350,340,330,320,330,350,370,390,380,340,300,260,230]
    load4_24h = [280,300,290,260,230,200,180,160,150,140,130,120,130,150,170,190,220,240,260,250,240,230,240,260]
    load5_24h = [120,110,100,90,80,90,190,210,200,180,160,140,130,110,120,130,150,160,170,160,150,140,150,170]
    price_profile_24h = [3.5, 3.2, 3.0, 2.8, 2.5, 2.8, 4.2, 5.5, 6.2, 7.8, 8.5, 9.2, 8.8, 8.2, 7.5, 8.0, 8.8, 9.5, 10.2, 9.8, 8.5, 7.2, 5.5, 4.2]

    inferred_days = num_days
    load_profiles_dict = {
        1: load1_24h,
        2: load2_24h,
        3: load3_24h,
        4: load4_24h,
        5: load5_24h
    }

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

        # Check for datetime/timestamp columns
        datetime_col = None
        for col in df.columns:
            if col.lower() in ['timestamp', 'datetime', 'date', 'time']:
                datetime_col = col
                break

        if datetime_col:
            df[datetime_col] = pd.to_datetime(df[datetime_col])
            df = df.sort_values(datetime_col)
            inferred_resolution = (df[datetime_col].iloc[1] - df[datetime_col].iloc[0]).seconds / 60
            time_resolution_minutes = int(inferred_resolution)
            total_minutes = (df[datetime_col].iloc[-1] - df[datetime_col].iloc[0]).total_seconds() / 60
            inferred_days = max(1, round(total_minutes / (24 * 60)))
            print(f"📂 Using uploaded file with inferred {inferred_days} day(s) and {time_resolution_minutes}-minute resolution")

        # Extract load profiles (case-insensitive, look for Load1, Load2, etc. or Load_1, Load_2, etc.)
        for i in [1, 2, 3, 4, 5]:
            load_cols = df.columns[df.columns.str.contains(f"Load{i}|Load_{i}|L{i}", case=False, regex=True)]
            if len(load_cols) > 0:
                load_profiles_dict[i] = df[load_cols[0]].astype(float).fillna(0.0).tolist()
            else:
                # Try to get by position if column names don't match
                if i <= len(df.columns):
                    load_profiles_dict[i] = df.iloc[:, i-1].astype(float).fillna(0.0).tolist()

        # Extract price profile
        price_cols = df.columns[df.columns.str.contains("Price", case=False)]
        if len(price_cols) > 0:
            price_profile_24h = df[price_cols[0]].astype(float).fillna(0.0).tolist()

        # Extract solar column if present
        solar_cols = df.columns[df.columns.str.contains("Solar|PV", case=False, regex=True)]
        if len(solar_cols) > 0:
            raw_solar = df[solar_cols[0]].astype(float).fillna(0.0).tolist()
            max_val = max(raw_solar) if raw_solar else 0.0
            if max_val > 1.2:
                solar_profile_input = [max(0.0, min(1.0, v / solar_connection)) for v in raw_solar]
            else:
                solar_profile_input = [max(0.0, min(1.0, v)) for v in raw_solar]

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
        "battery_om_cost": battery_om_cost,
        "weather": weather,
        # objective_type removed - only cost optimization supported
        "profile_type": profile_type,
        "electrolyzer_capacity": electrolyzer_capacity,
        "fuel_cell_capacity": fuel_cell_capacity,
        "h2_tank_capacity": h2_tank_capacity,
        "fuel_cell_efficiency_percent": fuel_cell_efficiency_percent,
        "fuel_cell_om_cost": fuel_cell_om_cost,
        "electrolyzer_om_cost": electrolyzer_om_cost,
        "curtail_penalty_load3": curtail_penalty_load3,
        "curtail_penalty_load4": curtail_penalty_load4,
        "curtail_penalty_load5": curtail_penalty_load5
    }

    # Run Optimization + Generate Plot
    try:
        summary, plot_bytes, chart_data = run_demand_optimization(params, load_profiles_dict, price_profile_24h, solar_profile_input)

        # Convert image bytes → base64 for direct UI rendering
        plot_base64 = base64.b64encode(plot_bytes).decode("utf-8")

        return JSONResponse({
            "status": "success",
            "summary": summary,
            "plot_base64": plot_base64,
            "chart_data": chart_data
        })

    except ValueError as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Optimization failed: {str(e)}"}, status_code=500)

