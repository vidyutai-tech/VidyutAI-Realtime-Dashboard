"""
Train all three AI prediction models:
1. Battery RUL Prediction (Random Forest)
2. Solar Panel Degradation (Gradient Boosting)
3. Energy Loss Analysis (XGBoost)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# Using GradientBoostingRegressor instead of XGBoost for compatibility
import joblib
import json
from pathlib import Path

# Create models directory
models_dir = Path('app/ml-models')
models_dir.mkdir(exist_ok=True)

def train_battery_rul_model():
    """Train Battery RUL prediction model"""
    print("\n" + "="*60)
    print("1️⃣ Training Battery RUL Model")
    print("="*60)
    
    # Load data
    df = pd.read_csv('data/battery_rul_training_data.csv')
    print(f"📊 Loaded {len(df)} samples")
    
    # Features and target
    features = ['cycle_count', 'temperature_c', 'voltage_v', 'current_a', 
                'soc_percent', 'discharge_rate', 'charge_rate', 'age_days']
    X = df[features]
    y = df['rul_hours']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest model
    print("🤖 Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ Model trained successfully!")
    print(f"   MAE: {mae:.2f} hours")
    print(f"   RMSE: {rmse:.2f} hours")
    print(f"   R²: {r2:.4f}")
    
    # Save model
    joblib.dump(model, models_dir / 'battery_rul_model.joblib')
    joblib.dump(scaler, models_dir / 'battery_rul_scaler.joblib')
    
    # Save metadata
    metadata = {
        'model_type': 'RandomForestRegressor',
        'features': features,
        'target': 'rul_hours',
        'n_samples': len(df),
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        },
        'trained_at': pd.Timestamp.now().isoformat()
    }
    
    with open(models_dir / 'battery_rul_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

def train_solar_degradation_model():
    """Train Solar Panel Degradation model"""
    print("\n" + "="*60)
    print("2️⃣ Training Solar Panel Degradation Model")
    print("="*60)
    
    # Load data
    df = pd.read_csv('data/solar_degradation_training_data.csv')
    print(f"📊 Loaded {len(df)} samples")
    
    # Features and target
    features = ['age_years', 'irradiance_wm2', 'temperature_c', 'dust_index', 
                'humidity_percent', 'tilt_angle_deg', 'efficiency_initial']
    X = df[features]
    y = df['degradation_percent']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Gradient Boosting model
    print("🤖 Training Gradient Boosting model...")
    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ Model trained successfully!")
    print(f"   MAE: {mae:.4f}%")
    print(f"   RMSE: {rmse:.4f}%")
    print(f"   R²: {r2:.4f}")
    
    # Save model
    joblib.dump(model, models_dir / 'solar_degradation_model.joblib')
    joblib.dump(scaler, models_dir / 'solar_degradation_scaler.joblib')
    
    # Save metadata
    metadata = {
        'model_type': 'GradientBoostingRegressor',
        'features': features,
        'target': 'degradation_percent',
        'n_samples': len(df),
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        },
        'trained_at': pd.Timestamp.now().isoformat()
    }
    
    with open(models_dir / 'solar_degradation_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

def train_energy_loss_model():
    """Train Energy Loss Analysis model"""
    print("\n" + "="*60)
    print("3️⃣ Training Energy Loss Analysis Model")
    print("="*60)
    
    # Load data
    df = pd.read_csv('data/energy_loss_training_data.csv')
    print(f"📊 Loaded {len(df)} samples")
    
    # Features and target
    features = ['load_kw', 'voltage_v', 'current_a', 'power_factor', 
                'cable_length_m', 'transformer_load_percent', 'ambient_temp_c', 'frequency_hz']
    X = df[features]
    y = df['loss_percent']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Gradient Boosting model (using sklearn instead of xgboost for compatibility)
    print("🤖 Training Gradient Boosting model...")
    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ Model trained successfully!")
    print(f"   MAE: {mae:.4f}%")
    print(f"   RMSE: {rmse:.4f}%")
    print(f"   R²: {r2:.4f}")
    
    # Save model
    joblib.dump(model, models_dir / 'energy_loss_model.joblib')
    joblib.dump(scaler, models_dir / 'energy_loss_scaler.joblib')
    
    # Save metadata
    metadata = {
        'model_type': 'GradientBoostingRegressor',
        'features': features,
        'target': 'loss_percent',
        'n_samples': len(df),
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2)
        },
        'trained_at': pd.Timestamp.now().isoformat()
    }
    
    with open(models_dir / 'energy_loss_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

if __name__ == '__main__':
    print("🚀 VidyutAI Prediction Models Training")
    print("Training 3 models for AI Predictions dashboard\n")
    
    try:
        # Train all models
        battery_meta = train_battery_rul_model()
        solar_meta = train_solar_degradation_model()
        loss_meta = train_energy_loss_model()
        
        # Create summary
        print("\n" + "="*60)
        print("✅ ALL MODELS TRAINED SUCCESSFULLY!")
        print("="*60)
        
        summary = {
            'battery_rul': battery_meta,
            'solar_degradation': solar_meta,
            'energy_loss': loss_meta,
            'total_training_time': 'Complete',
            'status': 'ready_for_inference'
        }
        
        with open(models_dir / 'prediction_models_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print("\n📦 Models saved to:", models_dir)
        print("\n🎯 Next Steps:")
        print("   1. Start ai-service backend")
        print("   2. API endpoints will automatically load models")
        print("   3. Frontend can now make predictions!")
        
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

