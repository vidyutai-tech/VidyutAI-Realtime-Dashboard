# VidyutAI Realtime Dashboard

A full-stack web application for real-time energy monitoring and AI-powered insights for energy management systems.

## 🌟 Project Overview

VidyutAI Realtime Dashboard provides:
- **Real-time monitoring** of energy data with Socket.IO connections
- **AI-powered analytics** including anomaly detection and predictive maintenance
- **Interactive visualizations** with modern, responsive UI
- **Site management** for multiple energy facilities
- **Historical data analysis** and reporting
- **Smart alerts** and notifications

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast development and building
- Recharts for data visualization
- React Router for navigation
- Lucide React for icons

**Backend (Node.js):**
- Express.js for REST API
- Socket.IO for real-time data streaming
- SQLite for database (with better-sqlite3)
- JWT for authentication (future)

**AI Service (Python):**
- Python FastAPI for high-performance ML API
- TensorFlow & Scikit-learn for ML models
- Pandas for data processing
- Uvicorn ASGI server

## 📂 Project Structure

```
VidyutAI-Realtime-Dashboard/
├── frontend/                      # React + TypeScript frontend
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components
│   ├── services/                 # API services
│   ├── types.ts                  # TypeScript definitions
│   └── package.json
│
├── backend/                       # Node.js Express backend
│   ├── routes/                   # API route handlers
│   │   ├── sites.js              # Sites endpoints
│   │   ├── metrics.js            # Metrics endpoints
│   │   ├── alerts.js             # Alerts endpoints
│   │   ├── assets.js             # Assets endpoints
│   │   └── predictions.js        # ML predictions proxy
│   ├── server.js                 # Express application
│   └── package.json
│
├── ai-service/                    # Python FastAPI AI/ML service
│   ├── app/
│   │   ├── api/                  # ML API endpoints
│   │   ├── models/               # Data models
│   │   ├── services/             # Business logic
│   │   └── main.py               # FastAPI application
│   └── requirements.txt
│
├── notebooks/                     # Jupyter notebooks
│   ├── anomaly_detection/        # Anomaly detection experiments
│   ├── predictive_maintenance/   # Maintenance prediction
│   └── energy_optimization/      # Optimization algorithms
│
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **macOS**: 10.15 (Catalina) or later
- **Node.js**: v18 or later
  ```bash
  node --version  # Should be v18+
  ```
- **npm**: v9 or later (comes with Node.js)
  ```bash
  npm --version
  ```
- **Python**: 3.9 or later (for AI service)
  ```bash
  python3 --version  # Should be 3.9+
  ```

### Installation & Setup

#### Step 1: Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

**AI Service (Optional):**
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# Or on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Step 2: Configuration

**Backend (.env file):**

Create a file `backend/.env`:
```bash
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=your-secret-key-change-this
```

**Note:** Port 5000 is used by macOS AirPlay Receiver by default, so we use port 5001 for the backend.

**Frontend (.env file):**

Create a file `frontend/.env`:
```bash
VITE_API_URL=http://localhost:5001
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_WS_URL=ws://localhost:5001
```

**AI Service (.env file):**

Create a file `ai-service/.env`:
```bash
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

#### Step 3: Initialize the Database

**Important:** Initialize the SQLite database before starting the backend for the first time:

```bash
cd backend
npm run init-db
```

This will:
- ✅ Create the `vidyutai.db` SQLite database file
- ✅ Set up all tables (users, sites, assets, alerts, predictions, etc.)
- ✅ Insert seed data for testing (3 users, 3 sites, 9 assets, 3 alerts)
- ✅ Generate 24 hours of sample timeseries data

**Test Users:**
- **Admin:** `admin@vidhyut.ai` / `password123`
- **Operator:** `operator@vidhyut.ai` / `password123`
- **Viewer:** `viewer@vidhyut.ai` / `password123`

**Note:** You only need to run `npm run init-db` once. The database will persist between restarts.

To reset the database, simply delete `backend/database/vidyutai.db` and run `npm run init-db` again.

## 🎯 Starting the Application

You need to start three services. Open **THREE separate terminal windows**:

### Terminal 1: Start Backend (Node.js)

```bash
# Navigate to backend folder
cd backend

# Start the server
npm start

# Expected output:
# 🚀 Backend server running on port 5001
# 📊 API: http://localhost:5001/api/v1
# 🔌 Socket.IO ready for real-time updates
```

**Backend will be available at:** http://localhost:5001

### Terminal 2: Start Frontend (React)

```bash
# Navigate to frontend folder
cd frontend

# Start the development server
npm run dev

# Expected output:
# VITE v6.2.0  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/
```

**Frontend will be available at:** http://localhost:5173

Your browser should automatically open to the dashboard!

### Terminal 3: Start AI Service (Python - Optional)

The AI service provides machine learning predictions. The backend will work without it using mock data.

```bash
# Navigate to ai-senpm rvice folder
cd ai-service

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# Or on Windows: venv\Scripts\activate

# Start the FastAPI server
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete.
```

**AI Service will be available at:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs

## 🌐 Access URLs

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend Dashboard** | http://localhost:5173 | Main dashboard interface |
| **Backend API** | http://localhost:5001 | Node.js REST API |
| **Backend Health** | http://localhost:5001/health | Health check endpoint |
| **AI Service API** | http://localhost:8000 | Python ML API (optional) |
| **AI Service Docs** | http://localhost:8000/docs | Interactive API documentation |

## 📊 API Endpoints

### Backend (Node.js) - Port 5001

#### Sites
```
GET    /api/v1/sites               # List all sites
GET    /api/v1/sites/:id           # Get site details
POST   /api/v1/sites               # Create new site
PUT    /api/v1/sites/:id           # Update site
DELETE /api/v1/sites/:id           # Delete site
```

#### Metrics
```
GET    /api/v1/metrics/site/:siteId           # Get site metrics
GET    /api/v1/metrics/realtime/:siteId       # Get real-time data
```

#### Alerts
```
GET    /api/v1/alerts                    # List all alerts
GET    /api/v1/alerts/:id                # Get alert details
POST   /api/v1/alerts/:id/acknowledge    # Acknowledge alert
PUT    /api/v1/alerts/:id/resolve        # Resolve alert
```

#### Assets
```
GET    /api/v1/assets              # List all assets
GET    /api/v1/assets/:id          # Get asset details
POST   /api/v1/assets              # Create asset
PUT    /api/v1/assets/:id          # Update asset
DELETE /api/v1/assets/:id          # Delete asset
```

#### Predictions (proxied to AI Service)
```
GET    /api/v1/predictions/anomalies       # Anomaly detection
GET    /api/v1/predictions/maintenance     # Predictive maintenance
GET    /api/v1/predictions/forecast        # Energy forecast
GET    /api/v1/predictions/optimization    # Optimization recommendations
```

### Socket.IO Real-time Events

Connect to: `ws://localhost:5001`

**Events:**
- `connection` - Client connected
- `subscribe_site` - Subscribe to site updates
- `metrics_update` - Real-time metrics (emitted every 5 seconds)
- `disconnect` - Client disconnected

**Example:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('metrics_update', (data) => {
  console.log('Real-time metrics:', data);
});

socket.emit('subscribe_site', '1'); // Subscribe to site 1
```

## 🔧 Development

### Running in Development Mode

**Backend with auto-reload:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

**Frontend with hot-reload:**
```bash
cd frontend
npm run dev  # Vite HMR enabled by default
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output will be in: frontend/dist/
```

**Backend:**
```bash
cd backend
# Set NODE_ENV=production in .env
npm start
```

## 🛠️ Troubleshooting

### Port Already in Use

**Backend (Port 5001):**
```bash
# Find and kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

**Note:** If you see port 5000 in use, it's likely macOS AirPlay Receiver. We use port 5001 to avoid this conflict.

**Frontend (Port 5173):**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**AI Service (Port 8000):**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Module Not Found Errors

**Backend:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**AI Service:**
```bash
cd ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Backend Connects to AI Service

The backend will automatically fall back to mock data if the AI service is not running. To enable AI features:

1. Start the AI service (Terminal 3)
2. Ensure AI_SERVICE_URL in backend/.env points to http://localhost:8000
3. Restart the backend

### CORS Issues

If you encounter CORS errors:
1. Check that FRONTEND_URL in backend/.env matches your frontend URL
2. Ensure the backend is running before starting the frontend

### Database Connection (Future)

Currently, the app uses in-memory mock data. To connect to MongoDB:

1. Install MongoDB
2. Update MONGODB_URI in backend/.env
3. Uncomment database connection code in server.js

## 📚 Features

### Dashboard
- Real-time energy consumption monitoring
- Multi-site overview
- Performance metrics and KPIs
- Cost tracking and analysis

### Analytics
- Historical data visualization
- Trend analysis
- Custom date range selection

### AI-Powered Insights
- Anomaly detection with alerts
- Predictive maintenance recommendations
- Energy optimization suggestions
- Pattern recognition

### Site Management
- Add/edit/delete sites
- Site configuration
- Asset management
- Maintenance scheduling

### Digital Twin
- Virtual representation of energy systems
- Real-time simulation
- Scenario testing

## 🎨 UI Pages

- `/` - Site selection
- `/dashboard/:id` - Main dashboard
- `/site/:id` - Site details
- `/alerts` - Alerts list
- `/predictions` - AI predictions
- `/sites/manage` - Manage sites
- `/assets/manage` - Manage assets
- `/maintenance` - Maintenance
- `/digital-twin` - Digital twin
- `/simulator` - Simulator
- `/settings` - Settings
- `/profile` - User profile

## 🔑 Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 19.x |
| Frontend Build | Vite | 6.x |
| Frontend Language | TypeScript | 5.x |
| Backend | Node.js + Express | 18.x / 4.x |
| Real-time | Socket.IO | 4.x |
| AI Service | Python + FastAPI | 3.9+ / 0.103+ |
| ML Libraries | TensorFlow, Scikit-learn | Latest |
| Charts | Recharts | 3.x |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Information]

## 👥 Team

VidyutAI Development Team

---

## 🎬 Demo Setup & Real-time Data

### Populate Demo Data (One-time)

Before your demo, populate the database with realistic data:

```bash
cd backend
node scripts/populate-demo-data.js
```

This generates:
- 7 days of realistic timeseries data (~16,000+ records)
- Demo alerts
- Updated site statistics

### Real-time Data Simulation

The dashboard includes a **real-time data simulator** that:

1. **Generates realistic IoT sensor data** every 5 seconds
2. **Writes to SQLite database** (`timeseries_data` table)
3. **Uses time-of-day patterns**:
   - Solar generation peaks at noon
   - Load demand peaks in evening
   - Realistic variance and trends

4. **Broadcasts via Socket.IO** to all connected clients

**How it works:**
- Simulator (`backend/services/realtime-simulator.js`) writes to SQLite
- Socket.IO server (`backend/server.js`) reads from SQLite every 5 seconds
- Frontend receives `metrics_update` events and updates UI in real-time

**Verify real-time updates:**
```bash
# Check database writes
sqlite3 backend/database/vidyutai.db "SELECT COUNT(*) FROM timeseries_data WHERE timestamp >= datetime('now', '-1 minute');"
```

### Demo Checklist

**Pre-Demo (30 min before):**
- [ ] Run `node backend/scripts/populate-demo-data.js`
- [ ] Start all three services (Backend, Frontend, AI Service)
- [ ] Verify Socket.IO connection in browser console
- [ ] Check real-time updates are flowing

**During Demo:**
- [ ] Show real-time metrics updating every 5 seconds
- [ ] Highlight SQLite database for fast, local storage
- [ ] Demonstrate time-of-day patterns (solar/load peaks)
- [ ] Run Source/Demand optimization features
- [ ] Show enhanced input boxes and smooth UI

**Key Talking Points:**
- Real-time SQLite-based data simulation
- Socket.IO WebSocket updates
- Time-of-day realistic patterns
- Enhanced UI with smooth input boxes
- Comprehensive optimization tools

## 📝 Quick Reference Commands

### Start Everything
```bash
# Terminal 1 - Backend (Port 5001)
cd backend && npm start

# Terminal 2 - Frontend (Port 5173)
cd frontend && npm run dev

# Terminal 3 - AI Service (Port 8000)
cd ai-service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Check Services are Running
```bash
# Backend health check
curl http://localhost:5001/health

# Frontend (open in browser)
open http://localhost:5173

# AI Service (open in browser)
open http://localhost:8000/docs
```

### Stop Services
- Press `Ctrl+C` in each terminal window

### Clean Old Data (Optional)

If your database gets too large, clean old timeseries data:

```bash
# Keep last 48 hours (default)
cd backend
node scripts/clean-old-data.js

# Or specify hours to keep (e.g., 24 hours)
node scripts/clean-old-data.js 24
```

Or manually:
```bash
sqlite3 backend/database/vidyutai.db "DELETE FROM timeseries_data WHERE timestamp < datetime('now', '-7 days');"
```

---

**Note:** This is a development setup. For production deployment, please configure proper environment variables, enable authentication, and use a production-grade database.

**Last Updated:** October 29, 2025  
**Version:** 1.0.0
