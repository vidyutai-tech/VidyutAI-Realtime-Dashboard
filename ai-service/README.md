# VidyutAI AI Service (Python)

Python FastAPI service providing AI/ML capabilities for the VidyutAI Realtime Dashboard.

## Overview

This service provides:
- **Anomaly Detection**: Identify unusual patterns in energy consumption
- **Predictive Maintenance**: Forecast equipment failures and maintenance needs
- **Energy Forecasting**: Predict future energy consumption and generation
- **Optimization**: Provide recommendations for energy efficiency
- **Real-time Processing**: WebSocket support for streaming predictions
- **ML Model Management**: Load, train, and serve machine learning models

## Technology Stack

- **FastAPI**: High-performance Python web framework
- **Uvicorn**: ASGI server for production
- **TensorFlow**: Deep learning models
- **Scikit-learn**: Classical machine learning
- **Pandas**: Data manipulation
- **NumPy**: Numerical computing
- **Pydantic**: Data validation

## Project Structure

```
ai-service/
├── app/
│   ├── api/
│   │   ├── endpoints/          # API endpoint modules
│   │   │   ├── sites.py        # Sites endpoints
│   │   │   ├── prediction.py   # ML predictions
│   │   │   ├── data.py         # Data endpoints
│   │   │   └── ...
│   │   ├── api.py              # Main API router
│   │   └── deps.py             # Dependencies
│   │
│   ├── core/
│   │   ├── config.py           # Configuration
│   │   └── security.py         # Security utilities
│   │
│   ├── models/
│   │   └── pydantic_models.py  # Pydantic data models
│   │
│   ├── services/
│   │   └── websocket_manager.py # WebSocket handling
│   │
│   ├── data/
│   │   └── mock_data.py        # Mock data generators
│   │
│   ├── ml-models/              # Trained ML models
│   │   ├── *.joblib            # Scikit-learn models
│   │   ├── *.keras             # TensorFlow models
│   │   └── *.json              # Model metadata
│   │
│   └── main.py                 # FastAPI application
│
├── requirements.txt            # Python dependencies
├── venv/                       # Virtual environment
└── README.md                   # This file
```

## Setup

### 1. Create Virtual Environment

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# Or on Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI & Uvicorn (API framework)
- TensorFlow (deep learning)
- Scikit-learn (ML algorithms)
- Pandas & NumPy (data processing)
- And other required packages

**Note:** Installation may take several minutes due to large packages like TensorFlow.

### 3. Configuration

Create a `.env` file in the ai-service directory:

```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ENVIRONMENT=development

# CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000

# ML Model Configuration
MODEL_PATH=./app/ml-models/
ENABLE_MODEL_CACHE=True

# Logging
LOG_LEVEL=INFO
```

### 4. Start the Server

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

## API Endpoints

### Health & Info

**Root endpoint:**
```
GET /
```

Response:
```json
{
  "message": "Welcome to the EMS Backend API"
}
```

### Sites API

```
GET    /api/v1/sites               # List all sites
GET    /api/v1/sites/{id}          # Get site details
POST   /api/v1/sites               # Create site
PUT    /api/v1/sites/{id}          # Update site
DELETE /api/v1/sites/{id}          # Delete site
```

### Metrics API

```
GET    /api/v1/sites/{id}/metrics  # Get site metrics
```

### Anomaly Detection

```
GET    /api/v1/anomalies?siteId=1
```

Response:
```json
{
  "success": true,
  "siteId": "1",
  "timestamp": "2025-10-29T10:30:00Z",
  "data": [
    {
      "id": "1",
      "type": "power_drop",
      "severity": "high",
      "timestamp": "2025-10-29T08:15:00Z",
      "value": 850,
      "expectedValue": 1200,
      "deviation": -29.2,
      "confidence": 0.94
    }
  ]
}
```

### Predictive Maintenance

```
GET    /api/v1/maintenance?siteId=1&assetId=2
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "assetId": "2",
      "assetName": "Inverter Unit A",
      "type": "preventive",
      "priority": "medium",
      "predictedFailureDate": "2025-11-05T00:00:00Z",
      "daysUntilMaintenance": 7,
      "confidence": 0.87,
      "recommendation": "Schedule inspection of inverter cooling system"
    }
  ]
}
```

### Energy Forecasting

```
GET    /api/v1/forecast?siteId=1&horizon=24h
```

Response:
```json
{
  "success": true,
  "siteId": "1",
  "horizon": "24h",
  "data": [
    {
      "timestamp": "2025-10-29T11:00:00Z",
      "predictedPower": "1250.50",
      "confidence": "0.89",
      "lower95": "1000.00",
      "upper95": "1500.00"
    }
  ]
}
```

### Optimization Recommendations

```
GET    /api/v1/optimization?siteId=1
```

Response:
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "load_shift",
      "title": "Shift Non-Critical Loads to Off-Peak Hours",
      "potentialSavings": 15000,
      "savingsPercentage": 12.5,
      "priority": "high",
      "confidence": 0.92
    }
  ]
}
```

## WebSocket Support

Connect to real-time data streams:

```
WS    /ws/site/{site_id}
```

Example client code:
```python
import asyncio
import websockets

async def subscribe():
    async with websockets.connect('ws://localhost:8000/ws/site/1') as ws:
        while True:
            data = await ws.recv()
            print(f"Received: {data}")

asyncio.run(subscribe())
```

## API Documentation

Once the server is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide:
- Complete API reference
- Interactive testing interface
- Request/response schemas
- Authentication details

## ML Models

### Pre-trained Models

The service includes several pre-trained models:

1. **Anomaly Detection** (`vibration_model.joblib`)
   - Isolation Forest algorithm
   - Detects unusual patterns in energy data

2. **Solar Forecast** (`lstm_solar_forecast_model.keras`)
   - LSTM neural network
   - Predicts solar energy generation

3. **Vibration Analysis** (`vibration_model.joblib`)
   - Random Forest classifier
   - Predicts equipment health from vibration data

### Loading Models

Models are automatically loaded on startup. To manually load:

```python
import joblib

model = joblib.load('app/ml-models/vibration_model.joblib')
predictions = model.predict(data)
```

### Training New Models

See the Jupyter notebooks in `/notebooks` for examples:
- `notebooks/anomaly_detection/energy_anomaly_detection.ipynb`
- `notebooks/predictive_maintenance/`
- `notebooks/energy_optimization/`

## Development

### Adding New Endpoints

1. Create a new file in `app/api/endpoints/`:

```python
# app/api/endpoints/newfeature.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_feature():
    return {"message": "New feature"}
```

2. Import in `app/api/api.py`:

```python
from app.api.endpoints import newfeature

api_router.include_router(
    newfeature.router,
    prefix="/newfeature",
    tags=["newfeature"]
)
```

### Data Validation

Use Pydantic models for request/response validation:

```python
from pydantic import BaseModel

class PredictionRequest(BaseModel):
    siteId: str
    timestamp: str
    features: dict

@router.post("/predict")
async def predict(request: PredictionRequest):
    # Auto-validated!
    return {"prediction": model.predict(request.features)}
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:8000/

# Get anomalies
curl http://localhost:8000/api/v1/anomalies?siteId=1

# Using httpie (prettier output)
pip install httpie
http GET http://localhost:8000/api/v1/anomalies siteId==1
```

### Automated Testing

```bash
pytest tests/
```

## Deployment

### Production Configuration

Create `.env` for production:

```bash
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=WARNING
```

### Running in Production

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t vidyutai-ai-service .
docker run -p 8000:8000 vidyutai-ai-service
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Module Import Errors

Ensure you're in the ai-service directory and virtual environment is activated:
```bash
cd ai-service
source venv/bin/activate
cd app
python -c "import fastapi; print('OK')"
```

### TensorFlow Installation Issues

**On Apple Silicon Macs:**
```bash
pip install tensorflow-macos tensorflow-metal
```

**On Linux with GPU:**
```bash
pip install tensorflow-gpu
```

### Memory Issues

Large models may require significant RAM. To reduce memory:
1. Use model quantization
2. Load models on-demand instead of startup
3. Implement model caching with LRU

### CORS Errors

Update ALLOWED_ORIGINS in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000,https://yourdomain.com
```

## Performance Optimization

### Model Caching

```python
from functools import lru_cache

@lru_cache(maxsize=10)
def load_model(model_name: str):
    return joblib.load(f'ml-models/{model_name}.joblib')
```

### Async Operations

Use async/await for I/O operations:
```python
import asyncio

@router.get("/data")
async def get_data():
    data = await fetch_from_database()
    return data
```

### Background Tasks

For long-running predictions:
```python
from fastapi import BackgroundTasks

def train_model(model_id: str):
    # Training logic
    pass

@router.post("/train")
async def start_training(background_tasks: BackgroundTasks):
    background_tasks.add_task(train_model, "model_1")
    return {"status": "Training started"}
```

## Security

### Best Practices

1. **API Key Authentication** (implement in production)
2. **Rate Limiting** to prevent abuse
3. **Input Validation** using Pydantic
4. **HTTPS** in production
5. **Environment Variables** for secrets

## Integration with Backend

The Node.js backend proxies requests to this AI service:

```javascript
// backend/routes/predictions.js
const AI_SERVICE_URL = 'http://localhost:8000';

router.get('/anomalies', async (req, res) => {
  const response = await axios.get(`${AI_SERVICE_URL}/api/v1/anomalies`);
  res.json(response.data);
});
```

This provides:
- Unified API for frontend
- Fallback to mock data if AI service is down
- Request aggregation and caching

## Contributing

1. Create feature branch
2. Add tests for new features
3. Update API documentation
4. Submit pull request

## License

See main project LICENSE file.

---

**Ready to start?** Run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` and visit http://localhost:8000/docs!
