#!/usr/bin/env python3
"""
train_battery_rul.py
Training script for Battery RUL (Remaining Useful Life) model
Trains on synthetic dataset and saves model artifacts to app/ml-models/
"""
import os
import json
import joblib
import math
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, root_mean_squared_error
from sklearn.preprocessing import StandardScaler
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import traceback

# Paths - relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
OUT_MODELS_DIR = os.path.join(PROJECT_ROOT, "ai-service", "app", "ml-models")
DASHBOARD_OUT = os.path.join(PROJECT_ROOT, "ai-service", "app", "ml-models", "dashboard_outputs")

os.makedirs(OUT_MODELS_DIR, exist_ok=True)
os.makedirs(DASHBOARD_OUT, exist_ok=True)

# Load data
csv_path = os.path.join(DATA_DIR, "hourly_timeseries_site_1.csv")
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Dataset not found at {csv_path}. Please run generate_dataset.py first.")

print(f"Loading data from {csv_path}...")
df = pd.read_csv(csv_path, parse_dates=["timestamp"])
df.sort_values("timestamp", inplace=True)
df.reset_index(drop=True, inplace=True)

print(f"Loaded {len(df)} rows")
print(f"Columns: {list(df.columns)[:10]}...")

# Feature engineering: create rolling window statistics for last 24 hours
WINDOW_HOURS = 24

def create_features(df):
    """Create engineered features from raw data"""
    data = df.copy()
    data.set_index("timestamp", inplace=True)
    data = data.sort_index()
    
    # Features to aggregate
    cols = [
        "battery_soc_pct",
        "battery_power_kW",
        "battery_current_A",
        "battery_voltage_V",
        "load_kW",
        "pv_power_kW",
        "ambient_temperature_C",
        "battery_cycle_count"
    ]
    
    # Ensure all columns exist
    for c in cols:
        if c not in data.columns:
            data[c] = 0.0
    
    # Rolling features
    for c in cols:
        data[f"{c}_last"] = data[c]
        data[f"{c}_mean_{WINDOW_HOURS}h"] = data[c].rolling(window=WINDOW_HOURS, min_periods=1).mean()
        data[f"{c}_std_{WINDOW_HOURS}h"] = data[c].rolling(window=WINDOW_HOURS, min_periods=1).std().fillna(0)
        data[f"{c}_min_{WINDOW_HOURS}h"] = data[c].rolling(window=WINDOW_HOURS, min_periods=1).min()
        data[f"{c}_max_{WINDOW_HOURS}h"] = data[c].rolling(window=WINDOW_HOURS, min_periods=1).max()
        data[f"{c}_diff_{WINDOW_HOURS}h"] = data[c] - data[c].rolling(window=WINDOW_HOURS, min_periods=1).mean()
    
    # Additional static features
    if "remaining_capacity_kWh" in data.columns:
        data["remaining_capacity_kWh_last"] = data["remaining_capacity_kWh"]
    else:
        data["remaining_capacity_kWh_last"] = 0.0
    
    if "rul_hours_label" not in data.columns:
        data["rul_hours_label"] = np.nan
    
    data.reset_index(inplace=True)
    return data

print("Creating features...")
feature_df = create_features(df)
feature_df.dropna(subset=["rul_hours_label"], inplace=True)
print(f"Features created. Rows with valid RUL labels: {len(feature_df)}")

# Prepare X, y
exclude_cols = ["timestamp", "site_id", "rul_hours_label", "anomaly_flag", "maintenance_flag"]
X = feature_df.drop(columns=[c for c in exclude_cols if c in feature_df.columns])
y = feature_df["rul_hours_label"].astype(float)

print(f"Feature matrix shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Time-based split: train 70%, val 15%, test 15%
n = len(feature_df)
train_end = int(n * 0.7)
val_end = int(n * 0.85)

X_train = X.iloc[:train_end]
y_train = y.iloc[:train_end]
X_val = X.iloc[train_end:val_end]
y_val = y.iloc[train_end:val_end]
X_test = X.iloc[val_end:]
y_test = y.iloc[val_end:]

print(f"Train/Val/Test sizes: {len(X_train)}/{len(X_val)}/{len(X_test)}")

# Standardize features
print("Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

# Try XGBoost if available, else RandomForest
model = None
model_name = ""
try:
    import xgboost as xgb
    print("XGBoost available. Training XGBoostRegressor...")
    model = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        random_state=42,
        n_jobs=2,
        max_depth=6
    )
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_val_scaled, y_val)],
        early_stopping_rounds=20,
        verbose=False
    )
    model_name = "xgboost"
    print("XGBoost model trained successfully.")
except Exception as e:
    print(f"XGBoost not available or failed: {e}")
    print("Falling back to RandomForest...")
    try:
        model = RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            n_jobs=2,
            max_depth=10
        )
        model.fit(X_train_scaled, y_train)
        model_name = "random_forest"
        print("RandomForest model trained successfully.")
    except Exception as e2:
        raise RuntimeError(f"Failed to train any model: {e2}")

# Evaluate model
def evaluate_model(model, Xs, ys, scaler=None):
    if scaler is not None:
        Xs_scaled = scaler.transform(Xs)
    else:
        Xs_scaled = Xs
    preds = model.predict(Xs_scaled)
    mae = mean_absolute_error(ys, preds)
    try:
        rmse = root_mean_squared_error(ys, preds)
    except:
        # Fallback for older sklearn versions
        rmse = np.sqrt(mean_squared_error(ys, preds))
    r2 = r2_score(ys, preds)
    return preds, mae, rmse, r2

print("Evaluating model...")
preds_val, mae_val, rmse_val, r2_val = evaluate_model(model, X_val, y_val, scaler=scaler)
preds_test, mae_test, rmse_test, r2_test = evaluate_model(model, X_test, y_test, scaler=scaler)

print(f"\nValidation Metrics:")
print(f"  MAE: {mae_val:.3f} hours")
print(f"  RMSE: {rmse_val:.3f} hours")
print(f"  R2: {r2_val:.3f}")
print(f"\nTest Metrics:")
print(f"  MAE: {mae_test:.3f} hours")
print(f"  RMSE: {rmse_test:.3f} hours")
print(f"  R2: {r2_test:.3f}")

# Save model artifacts
print("\nSaving model artifacts...")
model_path = os.path.join(OUT_MODELS_DIR, f"battery_rul_model_{model_name}.joblib")
joblib.dump(model, model_path)
print(f"  Model saved to: {model_path}")

scaler_path = os.path.join(OUT_MODELS_DIR, "battery_rul_scaler.joblib")
joblib.dump(scaler, scaler_path)
print(f"  Scaler saved to: {scaler_path}")

features_path = os.path.join(OUT_MODELS_DIR, "battery_rul_features.json")
with open(features_path, "w") as f:
    json.dump(list(X.columns), f, indent=2)
print(f"  Features saved to: {features_path}")

# Save training summary
summary = {
    "model_name": model_name,
    "model_path": f"battery_rul_model_{model_name}.joblib",
    "scaler_path": "battery_rul_scaler.joblib",
    "features_path": "battery_rul_features.json",
    "val_mae": float(mae_val),
    "val_rmse": float(rmse_val),
    "val_r2": float(r2_val),
    "test_mae": float(mae_test),
    "test_rmse": float(rmse_test),
    "test_r2": float(r2_test),
    "n_train": len(X_train),
    "n_val": len(X_val),
    "n_test": len(X_test),
    "n_features": len(X.columns),
    "window_hours": WINDOW_HOURS
}

summary_path = os.path.join(OUT_MODELS_DIR, "battery_rul_summary.json")
with open(summary_path, "w") as f:
    json.dump(summary, f, indent=2)
print(f"  Summary saved to: {summary_path}")

# Create dashboard outputs: predictions on test set with confidence intervals
residuals = y_val.values - preds_val
res_q_low = np.quantile(residuals, 0.05)
res_q_high = np.quantile(residuals, 0.95)

pred_list = []
test_index = X_test.index if hasattr(X_test, 'index') else list(range(len(preds_test)))
for idx, ts_idx in enumerate(test_index):
    ts = feature_df.loc[ts_idx, "timestamp"] if "timestamp" in feature_df.columns else str(idx)
    pred = float(preds_test[idx])
    ci_low = pred + float(res_q_low)
    ci_high = pred + float(res_q_high)
    
    # Top feature importances
    top_feats = []
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feat_imp = sorted(zip(X.columns, importances), key=lambda x: -x[1])[:5]
            top_feats = [[f, float(v)] for f, v in feat_imp]
    except Exception:
        top_feats = []
    
    pred_list.append({
        "timestamp": str(ts),
        "prediction": pred,
        "ci_lower": ci_low,
        "ci_upper": ci_high,
        "actual": float(y_test.iloc[idx]) if idx < len(y_test) else None,
        "top_features": top_feats
    })

dashboard_json = {
    "site_id": int(feature_df.loc[X_test.index[0], "site_id"]) if "site_id" in feature_df.columns else 1,
    "model": f"battery_rul_{model_name}_v1",
    "predictions": pred_list,
    "summary": {
        "test_mae": float(mae_test),
        "test_rmse": float(rmse_test),
        "test_r2": float(r2_test),
        "last_true": float(y_test.iloc[-1]) if len(y_test) > 0 else None
    }
}

dashboard_file = os.path.join(DASHBOARD_OUT, f"battery_rul_predictions_site_{dashboard_json['site_id']}.json")
with open(dashboard_file, "w") as f:
    json.dump(dashboard_json, f, indent=2)
print(f"  Dashboard JSON saved to: {dashboard_file}")

# Plot actual vs predicted for test set
print("Creating visualization...")
plt.figure(figsize=(12, 6))
plt.plot(y_test.values, label="Actual RUL", linewidth=2, alpha=0.8)
plt.plot(preds_test, label="Predicted RUL", linewidth=2, alpha=0.8)
plt.fill_between(
    range(len(preds_test)),
    preds_test + res_q_low,
    preds_test + res_q_high,
    alpha=0.2,
    label="95% Confidence Interval"
)
plt.legend()
plt.title("Battery RUL - Actual vs Predicted (Test Set)", fontsize=14, fontweight='bold')
plt.xlabel("Test Sample Index (Time-Ordered)", fontsize=12)
plt.ylabel("RUL (Hours)", fontsize=12)
plt.grid(True, alpha=0.3)
plt.tight_layout()

png_path = os.path.join(DASHBOARD_OUT, "battery_rul_act_pred_test.png")
plt.savefig(png_path, dpi=150, bbox_inches='tight')
plt.close()
print(f"  Visualization saved to: {png_path}")

# Try to create SHAP plot if available
try:
    import shap
    print("Creating SHAP feature importance plot...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test_scaled[:100])  # Use subset for speed
    shap.summary_plot(shap_values, X_test.iloc[:100], show=False, plot_size=(10, 6))
    shap_png = os.path.join(DASHBOARD_OUT, "battery_rul_shap_summary.png")
    plt.savefig(shap_png, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  SHAP plot saved to: {shap_png}")
except Exception as e:
    print(f"  SHAP not available or failed: {e}")

print("\n" + "="*60)
print("Training Complete!")
print("="*60)
print(f"Model: {model_name}")
print(f"Test R2 Score: {r2_test:.3f}")
print(f"Test MAE: {mae_test:.3f} hours")
print(f"Test RMSE: {rmse_test:.3f} hours")
print("\nFiles created:")
print(f"  - Model: {model_path}")
print(f"  - Scaler: {scaler_path}")
print(f"  - Features: {features_path}")
print(f"  - Summary: {summary_path}")
print(f"  - Dashboard JSON: {dashboard_file}")
print(f"  - Visualization: {png_path}")

