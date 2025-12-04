"""
Generate synthetic data for AI Prediction models:
1. Battery RUL (Remaining Useful Life)
2. Solar Panel Degradation
3. Energy Loss Analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

def generate_battery_rul_data(n_samples=5000):
    """
    Generate synthetic battery RUL data
    Features: cycle_count, temperature, voltage, current, soc, discharge_rate, charge_rate, age_days
    Target: rul_hours (remaining useful life in hours)
    """
    np.random.seed(42)
    
    # Generate features
    cycle_count = np.random.randint(0, 3000, n_samples)
    temperature = np.random.normal(25, 10, n_samples)  # °C
    voltage = np.random.normal(48, 2, n_samples)  # V
    current = np.random.normal(20, 5, n_samples)  # A
    soc = np.random.uniform(10, 100, n_samples)  # %
    discharge_rate = np.random.uniform(0.1, 2.0, n_samples)  # C-rate
    charge_rate = np.random.uniform(0.1, 1.0, n_samples)  # C-rate
    age_days = np.random.randint(0, 1825, n_samples)  # 0-5 years
    
    # Calculate RUL based on realistic battery degradation patterns
    # Base RUL: 8760 hours (1 year) for new battery
    base_rul = 8760
    
    # Degradation factors
    cycle_degradation = (cycle_count / 3000) * 6000  # More cycles = less RUL
    temp_degradation = np.maximum(0, (temperature - 25) * 50)  # High temp degrades faster
    age_degradation = (age_days / 1825) * 4000  # Age impact
    high_discharge_penalty = np.maximum(0, (discharge_rate - 1.0) * 500)
    low_soc_penalty = np.maximum(0, (30 - soc) * 10)  # Keeping battery at low SoC damages it
    
    rul_hours = base_rul - cycle_degradation - temp_degradation - age_degradation - high_discharge_penalty - low_soc_penalty
    rul_hours = np.maximum(100, rul_hours + np.random.normal(0, 200, n_samples))  # Add noise, min 100 hours
    
    df = pd.DataFrame({
        'cycle_count': cycle_count,
        'temperature_c': temperature,
        'voltage_v': voltage,
        'current_a': current,
        'soc_percent': soc,
        'discharge_rate': discharge_rate,
        'charge_rate': charge_rate,
        'age_days': age_days,
        'rul_hours': rul_hours
    })
    
    return df

def generate_solar_degradation_data(n_samples=3000):
    """
    Generate synthetic solar panel degradation data
    Features: age_years, irradiance, temperature, dust_index, humidity, tilt_angle, efficiency_initial
    Target: efficiency_current (current efficiency %)
    """
    np.random.seed(43)
    
    age_years = np.random.uniform(0, 25, n_samples)
    irradiance = np.random.uniform(200, 1000, n_samples)  # W/m²
    temperature = np.random.normal(35, 15, n_samples)  # °C
    dust_index = np.random.uniform(0, 100, n_samples)  # 0-100 dust accumulation
    humidity = np.random.uniform(20, 90, n_samples)  # %
    tilt_angle = np.random.uniform(0, 45, n_samples)  # degrees
    efficiency_initial = np.random.normal(18, 2, n_samples)  # %
    
    # Solar panel degradation model
    # Typical degradation: 0.5-0.8% per year
    annual_degradation_rate = np.random.uniform(0.5, 0.8, n_samples) / 100
    age_degradation = efficiency_initial * annual_degradation_rate * age_years
    
    # Environmental factors
    dust_impact = (dust_index / 100) * efficiency_initial * 0.15  # Up to 15% loss from dust
    temp_impact = np.maximum(0, (temperature - 25) * 0.02)  # 0.02% per degree above 25°C
    humidity_impact = (humidity / 100) * 0.5  # Slight humidity impact
    
    # Calculate current efficiency
    efficiency_current = efficiency_initial - age_degradation - dust_impact - temp_impact - humidity_impact
    efficiency_current = np.maximum(5, efficiency_current + np.random.normal(0, 0.5, n_samples))  # Min 5%, add noise
    
    # Calculate degradation percentage
    degradation_percent = ((efficiency_initial - efficiency_current) / efficiency_initial) * 100
    
    df = pd.DataFrame({
        'age_years': age_years,
        'irradiance_wm2': irradiance,
        'temperature_c': temperature,
        'dust_index': dust_index,
        'humidity_percent': humidity,
        'tilt_angle_deg': tilt_angle,
        'efficiency_initial': efficiency_initial,
        'efficiency_current': efficiency_current,
        'degradation_percent': degradation_percent
    })
    
    return df

def generate_energy_loss_data(n_samples=4000):
    """
    Generate synthetic energy loss analysis data
    Features: load_kw, voltage, current, power_factor, cable_length, transformer_load, ambient_temp
    Target: loss_percent (energy loss percentage)
    """
    np.random.seed(44)
    
    load_kw = np.random.uniform(50, 500, n_samples)
    voltage = np.random.normal(415, 15, n_samples)  # V
    current = load_kw * 1000 / (voltage * np.sqrt(3) * 0.95)  # Calculate current
    power_factor = np.random.uniform(0.7, 1.0, n_samples)
    cable_length_m = np.random.uniform(50, 1000, n_samples)
    transformer_load_percent = np.random.uniform(20, 120, n_samples)
    ambient_temp = np.random.normal(30, 10, n_samples)  # °C
    frequency = np.random.normal(50, 0.5, n_samples)  # Hz
    
    # Energy loss calculation (realistic model)
    # I²R losses in cables
    resistance_per_m = 0.0001  # Simplified
    cable_loss = (current ** 2) * resistance_per_m * cable_length_m / (load_kw * 1000) * 100
    
    # Transformer losses
    transformer_loss = np.where(
        transformer_load_percent > 100,
        2.0 + (transformer_load_percent - 100) * 0.1,  # Overload penalty
        1.5 + (100 - transformer_load_percent) * 0.01  # Underloading also inefficient
    )
    
    # Power factor losses
    pf_loss = (1 - power_factor) * 2
    
    # Temperature impact
    temp_loss = np.maximum(0, (ambient_temp - 25) * 0.02)
    
    # Voltage deviation losses
    voltage_deviation = np.abs(voltage - 415) / 415 * 100
    voltage_loss = voltage_deviation * 0.1
    
    # Total loss
    loss_percent = cable_loss + transformer_loss + pf_loss + temp_loss + voltage_loss
    loss_percent = np.clip(loss_percent + np.random.normal(0, 0.3, n_samples), 0.5, 20)  # 0.5-20% range
    
    # Calculate actual loss in kW
    loss_kw = load_kw * (loss_percent / 100)
    
    df = pd.DataFrame({
        'load_kw': load_kw,
        'voltage_v': voltage,
        'current_a': current,
        'power_factor': power_factor,
        'cable_length_m': cable_length_m,
        'transformer_load_percent': transformer_load_percent,
        'ambient_temp_c': ambient_temp,
        'frequency_hz': frequency,
        'loss_percent': loss_percent,
        'loss_kw': loss_kw
    })
    
    return df

if __name__ == '__main__':
    print("🔄 Generating synthetic prediction data...\n")
    
    # Generate datasets
    print("1️⃣ Generating Battery RUL data...")
    battery_df = generate_battery_rul_data(5000)
    battery_df.to_csv('data/battery_rul_training_data.csv', index=False)
    print(f"   ✅ Saved {len(battery_df)} samples to data/battery_rul_training_data.csv")
    print(f"   📊 RUL range: {battery_df['rul_hours'].min():.0f} - {battery_df['rul_hours'].max():.0f} hours")
    
    print("\n2️⃣ Generating Solar Panel Degradation data...")
    solar_df = generate_solar_degradation_data(3000)
    solar_df.to_csv('data/solar_degradation_training_data.csv', index=False)
    print(f"   ✅ Saved {len(solar_df)} samples to data/solar_degradation_training_data.csv")
    print(f"   📊 Degradation range: {solar_df['degradation_percent'].min():.2f}% - {solar_df['degradation_percent'].max():.2f}%")
    
    print("\n3️⃣ Generating Energy Loss data...")
    loss_df = generate_energy_loss_data(4000)
    loss_df.to_csv('data/energy_loss_training_data.csv', index=False)
    print(f"   ✅ Saved {len(loss_df)} samples to data/energy_loss_training_data.csv")
    print(f"   📊 Loss range: {loss_df['loss_percent'].min():.2f}% - {loss_df['loss_percent'].max():.2f}%")
    
    # Generate summary
    summary = {
        'battery_rul': {
            'samples': len(battery_df),
            'features': list(battery_df.columns[:-1]),
            'target': 'rul_hours',
            'target_range': [float(battery_df['rul_hours'].min()), float(battery_df['rul_hours'].max())]
        },
        'solar_degradation': {
            'samples': len(solar_df),
            'features': list(solar_df.columns[:-2]),
            'target': 'degradation_percent',
            'target_range': [float(solar_df['degradation_percent'].min()), float(solar_df['degradation_percent'].max())]
        },
        'energy_loss': {
            'samples': len(loss_df),
            'features': list(loss_df.columns[:-2]),
            'target': 'loss_percent',
            'target_range': [float(loss_df['loss_percent'].min()), float(loss_df['loss_percent'].max())]
        },
        'generated_at': datetime.now().isoformat()
    }
    
    with open('data/prediction_models_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ All synthetic data generated successfully!")
    print("📄 Summary saved to data/prediction_models_summary.json")
    print("\n🚀 Next: Run training scripts to create models")

