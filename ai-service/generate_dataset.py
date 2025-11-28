#!/usr/bin/env python3
"""
generate_dataset.py
Generate synthetic dataset for 1 month (Oct 28 to Nov 28, 2025)
Creates hourly timeseries data for ML models (Battery RUL, PV degradation, Emissions, Losses, Cost)
"""
import os
import json
import math
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Set seeds for reproducibility
random.seed(42)
np.random.seed(42)

# Output directory - relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(PROJECT_ROOT, "data")
os.makedirs(OUT_DIR, exist_ok=True)

# Site configuration
site = {
    "site_id": 1,
    "site_name": "Sample Site 1",
    "site_type": "Residential",
    "latitude": 23.0225,
    "longitude": 72.5714,
    "installation_date": "2022-01-01",
    "nominal_pv_capacity_kW": 10.0,
    "nominal_battery_kWh": 20.0,
    "inverter_rating_kW": 8.0,
    "diesel_generator_kW": 0.0,
    "tariff_plan": "time_of_use",
    "grid_emission_factor_kgCO2_per_kWh": 0.82
}

# Generate site metadata
site_meta_df = pd.DataFrame([site])
site_meta_path = os.path.join(OUT_DIR, "site_metadata.csv")
site_meta_df.to_csv(site_meta_path, index=False)
print(f"[OK] Saved site metadata to {site_meta_path}")

# Date range: Oct 28 to Nov 28, 2025 (1 month)
start = datetime(2025, 10, 28)
end = datetime(2025, 11, 28)
hours = int((end - start).total_seconds() / 3600)
timestamps = [start + timedelta(hours=i) for i in range(hours)]

print(f"Generating data for {len(timestamps)} hours ({len(timestamps)/24:.1f} days)")
print(f"Date range: {start.date()} to {end.date()}")

def load_profile(hour):
    """Generate load profile based on hour of day"""
    base = 0.5
    peak = 2.5 if 18 <= hour <= 22 else (1.2 if 6 <= hour <= 8 else 0.7)
    return base + peak * np.random.uniform(0.8, 1.2)

def clear_sky_irradiance(hour):
    """Generate clear sky irradiance based on hour"""
    if 6 <= hour <= 17:
        x = (hour - 11.5) / 5.5
        return max(0, 1000 * math.exp(-x*x))
    return 0.0

# Initialize variables
rows = []
battery_soc = 80.0
battery_capacity = site["nominal_battery_kWh"]
pv_degradation_rate = 0.005
inverter_eff_base = 0.95
grid_tariff_flat = 8.0
diesel_price = 95.0
diesel_co2_per_l = 2.68

# Generate hourly data
print("Generating hourly timeseries data...")
for idx, ts in enumerate(timestamps):
    if (idx + 1) % 100 == 0:
        print(f"  Progress: {idx + 1}/{len(timestamps)} hours ({100*(idx+1)/len(timestamps):.1f}%)")
    
    hour = ts.hour
    irradiance = clear_sky_irradiance(hour) * np.random.normal(1.0, 0.05)
    pv_irr_factor = min(1.0, irradiance / 1000.0)
    
    # Calculate PV power with degradation
    days_since_install = (ts - datetime(2025, 1, 1)).days
    pv_power = site["nominal_pv_capacity_kW"] * pv_irr_factor * \
               (1 - pv_degradation_rate * (days_since_install / 365.0)) * \
               np.random.normal(0.98, 0.02)
    if pv_power < 0:
        pv_power = 0.0
    
    load_kw = load_profile(hour)
    
    # Energy flow logic
    pv_available = pv_power
    battery_power = 0.0
    grid_import = 0.0
    diesel_power = 0.0
    
    if pv_available >= load_kw:
        # Surplus PV power
        surplus = pv_available - load_kw
        charge_possible = min(surplus, 2.0)
        if battery_soc < 95:
            battery_power = -charge_possible
            pv_available -= charge_possible
            grid_import = -max(0.0, pv_available - load_kw)
        else:
            grid_import = -(pv_available - load_kw)
    else:
        # Deficit - need to use battery or grid
        deficit = load_kw - pv_available
        if battery_soc > 25:
            discharge = min(deficit, 3.0, (battery_soc/100.0) * battery_capacity)
            battery_power = discharge
            deficit -= discharge
        if deficit > 0:
            grid_import = deficit
    
    # Update battery SOC
    if battery_power < 0:
        charged_kwh = (-battery_power) * 1.0
        battery_soc = min(100.0, battery_soc + (charged_kwh / battery_capacity) * 100.0 * 0.9)
    elif battery_power > 0:
        discharged_kwh = battery_power * 1.0
        battery_soc = max(0.0, battery_soc - (discharged_kwh / battery_capacity) * 100.0 / 0.9)
    
    # Calculate losses
    inverter_eff = inverter_eff_base + np.random.normal(0.0, 0.005)
    inverter_loss = max(0.0, pv_power * (1 - inverter_eff))
    wiring_loss = max(0.0, 0.01 * (pv_power + battery_power))
    idle_loss = 0.02
    losses_kw = inverter_loss + wiring_loss + idle_loss
    
    # Calculate emissions
    emissions_grid = max(0.0, grid_import) * site["grid_emission_factor_kgCO2_per_kWh"]
    fuel_liters = 0.0
    emissions_diesel = 0.0
    if diesel_power > 0:
        fuel_liters = diesel_power * 0.25
        emissions_diesel = fuel_liters * diesel_co2_per_l
    
    total_emissions = emissions_grid + emissions_diesel
    
    # Calculate cost
    tariff = grid_tariff_flat + (2.0 if 18 <= hour <= 22 else 0.0)
    cost_rs = max(0.0, grid_import) * tariff + fuel_liters * diesel_price
    
    # Anomaly and maintenance flags
    anomaly_flag = 1 if np.random.rand() < 0.01 else 0
    maintenance_flag = 1 if np.random.rand() < 0.005 else 0
    
    # Battery health metrics
    battery_cycle_count = int(days_since_install * np.random.uniform(0.05, 0.2))
    remaining_capacity_kwh = battery_capacity * \
        (1 - 0.0001 * battery_cycle_count - 0.001 * max(0, (25 - battery_soc)/100.0))
    rul_hours_label = max(0.0, remaining_capacity_kwh / (max(0.1, load_kw) * 0.5))
    
    rows.append({
        "timestamp": ts.isoformat(),
        "site_id": site["site_id"],
        "ambient_temperature_C": round(25 + 5 * math.sin((ts.timetuple().tm_yday/365.0)*2*math.pi) + np.random.normal(0,1), 2),
        "irradiance_W_m2": round(max(0.0, irradiance), 2),
        "pv_irradiance_factor": round(pv_irr_factor, 3),
        "pv_power_kW": round(pv_power, 3),
        "pv_degradation_rate_pct_per_year": round(pv_degradation_rate*100, 4),
        "inverter_efficiency_pct": round(inverter_eff*100, 3),
        "battery_soc_pct": round(battery_soc, 2),
        "battery_voltage_V": round(48 + np.random.normal(0, 0.2), 2),
        "battery_current_A": round((battery_power*1000.0/48.0) if battery_power != 0 else 0.0, 2),
        "battery_power_kW": round(battery_power, 3),
        "battery_cycle_count": battery_cycle_count,
        "diesel_power_kW": round(diesel_power, 3),
        "grid_import_kW": round(grid_import, 3),
        "load_kW": round(load_kw, 3),
        "losses_kW": round(losses_kw, 3),
        "fuel_consumption_liters": round(fuel_liters, 3),
        "emissions_kgCO2": round(total_emissions, 4),
        "tariff_Rs_per_kWh": round(tariff, 3),
        "cost_Rs_hour": round(cost_rs, 3),
        "anomaly_flag": anomaly_flag,
        "maintenance_flag": maintenance_flag,
        "remaining_capacity_kWh": round(remaining_capacity_kwh, 3),
        "rul_hours_label": round(rul_hours_label, 2)
    })

# Create DataFrame and save
df = pd.DataFrame(rows)
csv_path = os.path.join(OUT_DIR, f"hourly_timeseries_site_{site['site_id']}.csv")
df.to_csv(csv_path, index=False)
print(f"[OK] Saved hourly timeseries to {csv_path} ({len(df)} rows)")

# Generate battery health events
events = []
events.append({
    "site_id": site["site_id"],
    "timestamp_event": (start + timedelta(days=15)).isoformat(),
    "event_type": "maintenance",
    "cycles_at_event": int(15 * np.random.uniform(0.05, 0.2)),
    "soc_at_event": 80,
    "temperature_C_at_event": 30,
    "remaining_capacity_kWh": round(battery_capacity * 0.98, 3),
    "label_for_RUL": None
})
events_df = pd.DataFrame(events)
events_path = os.path.join(OUT_DIR, "battery_health_events.csv")
events_df.to_csv(events_path, index=False)
print(f"[OK] Saved battery health events to {events_path}")

# Generate PV performance summary
pv_summary = []
month_start = start.replace(day=1)
pv_summary.append({
    "month_start": month_start.date().isoformat(),
    "site_id": site["site_id"],
    "monthly_energy_kWh": round(df['pv_power_kW'].sum(), 3),
    "expected_energy_kWh": round(df['irradiance_W_m2'].sum()/1000.0 * site["nominal_pv_capacity_kW"] * 0.7, 3),
    "soiling_factor": round(np.random.uniform(0.95, 1.0), 3),
    "degradation_pct_this_month": round(pv_degradation_rate*100/12, 5),
    "flagged_anomaly": int(df['anomaly_flag'].sum() > 0)
})
pv_summary_df = pd.DataFrame(pv_summary)
pv_summary_path = os.path.join(OUT_DIR, f"pv_performance_summary_site_{site['site_id']}.csv")
pv_summary_df.to_csv(pv_summary_path, index=False)
print(f"[OK] Saved PV performance summary to {pv_summary_path}")

# Generate tariff and fuel prices
tariff_rows = []
for ts in timestamps:
    hour = ts.hour
    tariff = grid_tariff_flat + (2.0 if 18 <= hour <= 22 else 0.0)
    tariff_rows.append({
        "timestamp": ts.isoformat(),
        "tariff_plan": site["tariff_plan"],
        "grid_tariff_Rs_per_kWh": tariff,
        "diesel_price_Rs_per_liter": diesel_price
    })
tariff_df = pd.DataFrame(tariff_rows)
tariff_path = os.path.join(OUT_DIR, "tariff_and_fuel_prices.csv")
tariff_df.to_csv(tariff_path, index=False)
print(f"[OK] Saved tariff and fuel prices to {tariff_path}")

# Generate manifest
manifest = {
    "generated_date": datetime.now().isoformat(),
    "date_range": {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "total_hours": len(timestamps)
    },
    "files": [
        {"path": "site_metadata.csv", "rows": len(site_meta_df), "desc": "Site metadata (1 site)"},
        {"path": f"hourly_timeseries_site_{site['site_id']}.csv", "rows": len(df), "desc": f"Hourly timeseries ({len(timestamps)/24:.1f} days)"},
        {"path": "battery_health_events.csv", "rows": len(events_df), "desc": "Battery events (sample)"},
        {"path": f"pv_performance_summary_site_{site['site_id']}.csv", "rows": len(pv_summary_df), "desc": "PV monthly summary (sample)"},
        {"path": "tariff_and_fuel_prices.csv", "rows": len(tariff_df), "desc": "Hourly tariff and fuel price series"}
    ]
}
manifest_path = os.path.join(OUT_DIR, "manifest.json")
with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=2)
print(f"[OK] Saved manifest to {manifest_path}")

# Generate summary statistics
summary_stats = {
    "pv_power_mean_kW": float(df['pv_power_kW'].mean()),
    "pv_power_std_kW": float(df['pv_power_kW'].std()),
    "pv_power_max_kW": float(df['pv_power_kW'].max()),
    "pv_power_min_kW": float(df['pv_power_kW'].min()),
    "load_mean_kW": float(df['load_kW'].mean()),
    "load_max_kW": float(df['load_kW'].max()),
    "battery_soc_mean_pct": float(df['battery_soc_pct'].mean()),
    "battery_soc_min_pct": float(df['battery_soc_pct'].min()),
    "battery_soc_max_pct": float(df['battery_soc_pct'].max()),
    "grid_import_total_kWh": float(df['grid_import_kW'].clip(lower=0).sum()),
    "total_emissions_kgCO2": float(df['emissions_kgCO2'].sum()),
    "total_cost_Rs": float(df['cost_Rs_hour'].sum()),
    "rul_hours_min": float(df['rul_hours_label'].min()),
    "rul_hours_max": float(df['rul_hours_label'].max()),
    "anomaly_count": int(df['anomaly_flag'].sum()),
    "maintenance_count": int(df['maintenance_flag'].sum())
}
stats_path = os.path.join(OUT_DIR, "summary_stats.json")
with open(stats_path, "w") as f:
    json.dump(summary_stats, f, indent=2)
print(f"[OK] Saved summary statistics to {stats_path}")

# Print summary
print("\n" + "="*60)
print("Dataset Generation Complete!")
print("="*60)
print(f"Date range: {start.date()} to {end.date()}")
print(f"Total hours: {len(timestamps)} ({len(timestamps)/24:.1f} days)")
print(f"\nFiles generated in: {OUT_DIR}")
for file_info in manifest['files']:
    print(f"  - {file_info['path']}: {file_info['rows']} rows")
print(f"\nSummary Statistics:")
print(f"  PV Power: {summary_stats['pv_power_mean_kW']:.2f} kW (avg), {summary_stats['pv_power_max_kW']:.2f} kW (max)")
print(f"  Load: {summary_stats['load_mean_kW']:.2f} kW (avg), {summary_stats['load_max_kW']:.2f} kW (max)")
print(f"  Battery SOC: {summary_stats['battery_soc_mean_pct']:.1f}% (avg)")
print(f"  Total Grid Import: {summary_stats['grid_import_total_kWh']:.2f} kWh")
print(f"  Total Emissions: {summary_stats['total_emissions_kgCO2']:.4f} kg CO2")
print(f"  Total Cost: Rs {summary_stats['total_cost_Rs']:.2f}")
print(f"  Anomalies detected: {summary_stats['anomaly_count']}")
print(f"  Maintenance flags: {summary_stats['maintenance_count']}")

# Print preview
print("\n" + "="*60)
print("Preview (first 5 rows):")
print("="*60)
df_preview = df.head(5)[['timestamp', 'pv_power_kW', 'load_kW', 'battery_soc_pct', 'grid_import_kW', 'cost_Rs_hour']]
print(df_preview.to_string(index=False))
print("\n" + "="*60)

