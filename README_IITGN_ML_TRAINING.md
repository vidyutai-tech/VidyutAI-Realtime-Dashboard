# IITGN Data ML Training Guide

This guide explains how to use the `IMS_HT_EM4_IITGN.xlsx` file to train ML models for AI/ML Insights.

## Overview

The training pipeline analyzes the Excel file, identifies features and targets, generates synthetic data if needed, and trains two types of ML models:

1. **Energy Forecast Model** - Predicts energy consumption/generation
2. **Anomaly Detection Model** - Detects anomalies in energy system data

## Setup

### 1. Install Required Dependencies

Make sure you have the required Python packages:

```bash
cd ai-service
pip install pandas numpy scikit-learn openpyxl
```

Or use the existing requirements:

```bash
pip install -r requirements.txt
```

### 2. Run the Training Script

Execute the training script from the ai-service directory:

```bash
cd ai-service
python data_analysis_and_ml_training.py
```

Or from the project root:

```bash
python ai-service/data_analysis_and_ml_training.py
```

The script will:
- Analyze the Excel file structure
- Identify features and targets automatically
- Generate synthetic data if the dataset is too small
- Train energy forecast and anomaly detection models
- Save models to `ai-service/app/ml-models/`

## Output Files

After training, the following files will be created in `ai-service/app/ml-models/`:

### Energy Forecast Model:
- `iitgn_energy_forecast_model.joblib` - Trained Random Forest model
- `iitgn_energy_forecast_scaler.joblib` - Feature scaler
- `iitgn_energy_forecast_info.json` - Model metadata and feature list

### Anomaly Detection Model:
- `iitgn_anomaly_detection_model.joblib` - Trained Isolation Forest model
- `iitgn_anomaly_detection_scaler.joblib` - Feature scaler
- `iitgn_anomaly_detection_info.json` - Model metadata and feature list

## API Endpoints

Once models are trained, they will be automatically loaded by the AI service and available via:

### Energy Forecast
```
POST /api/v1/predict/iitgn-energy-forecast
```

**Request Body:**
```json
{
  "features": {
    "feature1": 100.5,
    "feature2": 200.0,
    ...
  }
}
```

**Response:**
```json
{
  "prediction": 1500.25,
  "target": "energy_kwh",
  "units": "kWh",
  "model_info": {
    "mae": 50.2,
    "rmse": 75.8,
    "r2": 0.92
  }
}
```

### Anomaly Detection
```
POST /api/v1/predict/iitgn-anomaly
```

**Request Body:**
```json
{
  "features": {
    "feature1": 100.5,
    "feature2": 200.0,
    ...
  }
}
```

**Response:**
```json
{
  "is_anomaly": false,
  "anomaly_score": -0.15,
  "status": "normal",
  "confidence": 0.85
}
```

## Integration with Frontend

The models can be integrated into the AI/ML Insights page by:

1. Adding new prediction cards in `frontend/pages/AIMLInsightsPage.tsx`
2. Creating API service functions in `frontend/services/api.ts`
3. Calling the new endpoints from the Predictions page

## Customization

### Adjusting Model Parameters

Edit `notebooks/data_analysis_and_ml_training.py` to customize:

- **Energy Forecast Model**: Change `n_estimators`, `max_depth` in `RandomForestRegressor`
- **Anomaly Detection Model**: Adjust `contamination` parameter (percentage of anomalies expected)
- **Synthetic Data**: Modify `n_samples` parameter to generate more/less synthetic data

### Feature Selection

The script automatically identifies features, but you can manually specify them by editing the `identify_features_and_targets()` function.

## Troubleshooting

### Issue: "File not found"
- Ensure the Excel file is in the `data/` directory
- Check the filename matches exactly: `IMS_HT_EM4_IITGN.xlsx`

### Issue: "Not enough data"
- The script will generate synthetic data if the dataset is small
- Increase `n_samples` in `generate_synthetic_data()` for more synthetic data

### Issue: "No features identified"
- Check the column names in your Excel file
- Manually specify features in the script if automatic detection fails

### Issue: "Models not loading"
- Restart the AI service after training
- Check that model files are in `ai-service/app/ml-models/`
- Verify file permissions

## Next Steps

1. Train the models using the script
2. Restart the AI service to load the new models
3. Test the endpoints using the API documentation at `http://localhost:8000/docs`
4. Integrate into the frontend for AI/ML Insights

## Notes

- The models are trained on the actual IITGN data structure
- Synthetic data generation preserves statistical properties of real data
- Models are saved in a format compatible with scikit-learn
- All models use feature scaling for better performance

