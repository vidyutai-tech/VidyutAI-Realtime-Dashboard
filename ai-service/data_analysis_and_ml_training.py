"""
Data Analysis and ML Training Pipeline for IITGN Energy Data
This script analyzes the Excel file and creates ML models for AI/ML Insights
"""

import pandas as pd
import numpy as np
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Paths - Updated for ai-service location
# From ai-service/, data is in ../data and models go to ./app/ml-models
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR = Path(__file__).parent / "app" / "ml-models"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def analyze_excel_file():
    """Analyze the structure of the Excel file"""
    excel_path = DATA_DIR / "IMS_HT_EM4_IITGN.xlsx"
    
    if not excel_path.exists():
        print(f"❌ File not found: {excel_path}")
        return None
    
    try:
        # Read Excel file - try multiple sheets if available
        excel_file = pd.ExcelFile(excel_path)
        print(f"📊 Excel file found: {excel_path}")
        print(f"📑 Available sheets: {excel_file.sheet_names}")
        
        # Read first sheet
        df = pd.read_excel(excel_path, sheet_name=0)
        print(f"\n✅ Loaded data: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"\n📋 Column names:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        
        print(f"\n📈 Data types:")
        print(df.dtypes)
        
        print(f"\n🔍 First few rows:")
        print(df.head())
        
        print(f"\n📊 Basic statistics:")
        print(df.describe())
        
        print(f"\n🔎 Missing values:")
        missing = df.isnull().sum()
        print(missing[missing > 0])
        
        return df, excel_file.sheet_names
        
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return None, None

def identify_features_and_targets(df):
    """Identify potential features and targets for ML models"""
    print("\n🔍 Identifying features and targets...")
    
    # Common energy-related column patterns
    power_patterns = ['power', 'watt', 'kw', 'mw', 'load', 'demand', 'consumption']
    voltage_patterns = ['voltage', 'volt', 'v_']
    current_patterns = ['current', 'amp', 'ampere', 'i_']
    energy_patterns = ['energy', 'kwh', 'mwh', 'consumption', 'generation']
    time_patterns = ['time', 'date', 'timestamp', 'datetime', 'hour', 'day']
    temp_patterns = ['temp', 'temperature', 't_']
    
    features = []
    targets = []
    time_cols = []
    
    for col in df.columns:
        col_lower = str(col).lower()
        
        # Time columns
        if any(pattern in col_lower for pattern in time_patterns):
            time_cols.append(col)
        # Energy/power targets
        elif any(pattern in col_lower for pattern in energy_patterns + power_patterns):
            if df[col].dtype in ['int64', 'float64']:
                targets.append(col)
        # Features (voltage, current, temperature, etc.)
        elif any(pattern in col_lower for pattern in voltage_patterns + current_patterns + temp_patterns):
            if df[col].dtype in ['int64', 'float64']:
                features.append(col)
        # Numeric columns as features
        elif df[col].dtype in ['int64', 'float64']:
            features.append(col)
    
    # Remove targets from features
    features = [f for f in features if f not in targets]
    
    print(f"\n✅ Identified:")
    print(f"  Features: {len(features)} columns")
    print(f"  Targets: {len(targets)} columns")
    print(f"  Time columns: {len(time_cols)} columns")
    
    return features, targets, time_cols

def generate_synthetic_data(df, features, targets, n_samples=10000):
    """Generate synthetic data based on real data distributions"""
    print(f"\n🔄 Generating synthetic data ({n_samples} samples)...")
    
    synthetic_data = pd.DataFrame()
    
    # Generate synthetic features
    for feature in features:
        if feature in df.columns:
            # Use real data statistics to generate synthetic data
            mean_val = df[feature].mean()
            std_val = df[feature].std()
            
            if pd.isna(mean_val) or pd.isna(std_val):
                synthetic_data[feature] = np.random.normal(0, 1, n_samples)
            else:
                # Generate data with similar distribution
                synthetic_data[feature] = np.random.normal(mean_val, std_val, n_samples)
                # Keep within reasonable bounds
                if df[feature].min() is not None and df[feature].max() is not None:
                    synthetic_data[feature] = np.clip(
                        synthetic_data[feature],
                        df[feature].min() * 0.5,
                        df[feature].max() * 1.5
                    )
        else:
            synthetic_data[feature] = np.random.normal(0, 1, n_samples)
    
    # Generate synthetic targets based on feature relationships
    for target in targets:
        if target in df.columns:
            # Simple linear relationship with some noise
            target_values = np.zeros(n_samples)
            
            # Use first few features to create relationship
            for i, feature in enumerate(features[:5], 1):
                if feature in synthetic_data.columns:
                    weight = np.random.uniform(-0.5, 0.5)
                    target_values += weight * synthetic_data[feature]
            
            # Add base value and noise
            if df[target].mean() is not None:
                target_values += df[target].mean()
            target_values += np.random.normal(0, df[target].std() * 0.3, n_samples)
            
            # Keep within reasonable bounds
            if df[target].min() is not None and df[target].max() is not None:
                target_values = np.clip(
                    target_values,
                    df[target].min() * 0.7,
                    df[target].max() * 1.3
                )
            
            synthetic_data[target] = target_values
        else:
            synthetic_data[target] = np.random.normal(0, 1, n_samples)
    
    print(f"✅ Generated synthetic dataset: {synthetic_data.shape}")
    return synthetic_data

def train_energy_forecast_model(df, features, targets):
    """Train energy forecasting model"""
    print("\n🤖 Training Energy Forecast Model...")
    
    if not targets:
        print("❌ No target columns found for forecasting")
        return None
    
    # Use first target for forecasting
    target_col = targets[0]
    print(f"  Target: {target_col}")
    
    # Prepare data
    X = df[features].fillna(df[features].mean())
    y = df[target_col].fillna(df[target_col].mean())
    
    # Remove any remaining NaN
    mask = ~(X.isnull().any(axis=1) | y.isnull())
    X = X[mask]
    y = y[mask]
    
    if len(X) < 10:
        print("❌ Not enough data for training")
        return None
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"  ✅ Model trained!")
    print(f"     MAE: {mae:.4f}")
    print(f"     RMSE: {rmse:.4f}")
    print(f"     R²: {r2:.4f}")
    
    # Save model
    model_path = OUTPUT_DIR / "iitgn_energy_forecast_model.joblib"
    scaler_path = OUTPUT_DIR / "iitgn_energy_forecast_scaler.joblib"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Save feature names
    import json
    feature_info = {
        "features": list(features),
        "target": target_col,
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2)
    }
    with open(OUTPUT_DIR / "iitgn_energy_forecast_info.json", 'w') as f:
        json.dump(feature_info, f, indent=2)
    
    print(f"  💾 Model saved to: {model_path}")
    
    return model, scaler

def train_anomaly_detection_model(df, features):
    """Train anomaly detection model"""
    print("\n🤖 Training Anomaly Detection Model...")
    
    # Prepare data
    X = df[features].fillna(df[features].mean())
    
    # Remove any remaining NaN
    mask = ~X.isnull().any(axis=1)
    X = X[mask]
    
    if len(X) < 10:
        print("❌ Not enough data for training")
        return None
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    model = IsolationForest(
        contamination=0.05,  # Expect 5% anomalies
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)
    
    # Evaluate
    predictions = model.predict(X_scaled)
    n_anomalies = (predictions == -1).sum()
    anomaly_rate = n_anomalies / len(predictions) * 100
    
    print(f"  ✅ Model trained!")
    print(f"     Detected {n_anomalies} anomalies ({anomaly_rate:.2f}%)")
    
    # Save model
    model_path = OUTPUT_DIR / "iitgn_anomaly_detection_model.joblib"
    scaler_path = OUTPUT_DIR / "iitgn_anomaly_detection_scaler.joblib"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Save feature names
    import json
    feature_info = {
        "features": list(features),
        "contamination": 0.05,
        "n_samples": len(X)
    }
    with open(OUTPUT_DIR / "iitgn_anomaly_detection_info.json", 'w') as f:
        json.dump(feature_info, f, indent=2)
    
    print(f"  💾 Model saved to: {model_path}")
    
    return model, scaler

def main():
    """Main execution function"""
    print("=" * 60)
    print("🚀 IITGN Energy Data Analysis & ML Training Pipeline")
    print("=" * 60)
    
    # Step 1: Analyze Excel file
    result = analyze_excel_file()
    if result is None:
        print("\n❌ Failed to load Excel file")
        return
    
    df, sheet_names = result
    
    # Step 2: Identify features and targets
    features, targets, time_cols = identify_features_and_targets(df)
    
    if not features:
        print("\n❌ No features identified. Using all numeric columns...")
        features = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        features = [f for f in features if f not in targets]
    
    if len(features) == 0:
        print("\n❌ No suitable features found")
        return
    
    # Step 3: Generate synthetic data (if needed)
    print("\n" + "=" * 60)
    if len(df) < 100:
        print("📊 Dataset is small. Generating synthetic data for better training...")
        synthetic_df = generate_synthetic_data(df, features, targets, n_samples=5000)
        # Combine real and synthetic data
        combined_df = pd.concat([df, synthetic_df], ignore_index=True)
        print(f"✅ Combined dataset: {combined_df.shape}")
    else:
        print("📊 Dataset is sufficient for training")
        combined_df = df
    
    # Step 4: Train models
    print("\n" + "=" * 60)
    print("🎯 Training ML Models")
    print("=" * 60)
    
    # Train energy forecast model
    if targets:
        train_energy_forecast_model(combined_df, features, targets)
    
    # Train anomaly detection model
    train_anomaly_detection_model(combined_df, features)
    
    print("\n" + "=" * 60)
    print("✅ Training Complete!")
    print(f"📁 Models saved to: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()

