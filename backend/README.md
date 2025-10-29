# VidyutAI Backend (Node.js)

Node.js/Express backend server for the VidyutAI Realtime Dashboard.

## Overview

This backend provides:
- RESTful API endpoints for sites, metrics, alerts, and assets
- Socket.IO for real-time data streaming
- Proxy to Python AI service for ML predictions
- Mock data for development (database integration ready)
- CORS support for frontend communication

## Technology Stack

- **Express.js**: Fast, minimalist web framework
- **Socket.IO**: Real-time bidirectional communication
- **Axios**: HTTP client for AI service communication
- **Helmet**: Security middleware
- **Morgan**: HTTP request logger
- **dotenv**: Environment variable management

## Project Structure

```
backend/
├── routes/
│   ├── sites.js          # Sites CRUD operations
│   ├── metrics.js        # Real-time and historical metrics
│   ├── alerts.js         # Alerts management
│   ├── assets.js         # Assets management
│   └── predictions.js    # ML predictions (proxy to AI service)
│
├── models/               # Data models (future: MongoDB schemas)
├── controllers/          # Business logic controllers
├── middleware/           # Custom middleware
├── config/               # Configuration files
├── utils/                # Utility functions
│
├── server.js             # Main application file
├── package.json          # Dependencies and scripts
└── .env.example          # Environment variables template
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database (Optional - for future use)
MONGODB_URI=mongodb://localhost:27017/vidyutai

# JWT Secret (for future authentication)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=24h

# AI Service URL
AI_SERVICE_URL=http://localhost:8000

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Expected Output:**
```
🚀 Backend server running on port 5000
📊 API: http://localhost:5000/api/v1
🔌 Socket.IO ready for real-time updates
```

## API Endpoints

### Health Check

```
GET /
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

### Sites API

**List all sites:**
```
GET /api/v1/sites
```

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "1",
      "name": "Solar Plant A",
      "location": "Gujarat, India",
      "type": "Solar",
      "capacity": 2500,
      "status": "active"
    }
  ]
}
```

**Get single site:**
```
GET /api/v1/sites/:id
```

**Create site:**
```
POST /api/v1/sites
Content-Type: application/json

{
  "name": "New Solar Plant",
  "location": "Mumbai, India",
  "type": "Solar",
  "capacity": 3000
}
```

**Update site:**
```
PUT /api/v1/sites/:id
Content-Type: application/json

{
  "capacity": 3500,
  "status": "maintenance"
}
```

**Delete site:**
```
DELETE /api/v1/sites/:id
```

### Metrics API

**Get site metrics:**
```
GET /api/v1/metrics/site/:siteId?period=24h
```

Query parameters:
- `period`: `24h`, `7d`, `30d` (default: `24h`)

Response:
```json
{
  "success": true,
  "data": {
    "siteId": "1",
    "period": "24h",
    "timestamp": "2025-10-29T10:30:00.000Z",
    "current": {
      "power": "1250.50",
      "energy": "15500.25",
      "efficiency": "91.20",
      "cost": "48.75"
    },
    "history": [...]
  }
}
```

**Get real-time metrics:**
```
GET /api/v1/metrics/realtime/:siteId
```

### Alerts API

**List alerts:**
```
GET /api/v1/alerts?severity=high&status=active&siteId=1
```

Query parameters:
- `severity`: `critical`, `high`, `medium`, `low`
- `status`: `active`, `resolved`
- `siteId`: filter by site

**Get single alert:**
```
GET /api/v1/alerts/:id
```

**Acknowledge alert:**
```
POST /api/v1/alerts/:id/acknowledge
Content-Type: application/json

{
  "userId": "user123"
}
```

**Resolve alert:**
```
PUT /api/v1/alerts/:id/resolve
Content-Type: application/json

{
  "resolution": "Issue fixed after maintenance"
}
```

### Assets API

**List assets:**
```
GET /api/v1/assets?siteId=1&type=Solar%20Panel&status=operational
```

**Get single asset:**
```
GET /api/v1/assets/:id
```

**Create asset:**
```
POST /api/v1/assets
Content-Type: application/json

{
  "siteId": "1",
  "name": "Solar Panel Array 2",
  "type": "Solar Panel",
  "model": "SP-600W",
  "manufacturer": "SolarTech",
  "capacity": 600
}
```

**Update asset:**
```
PUT /api/v1/assets/:id
```

**Delete asset:**
```
DELETE /api/v1/assets/:id
```

### Predictions API

These endpoints proxy requests to the Python AI service. If AI service is not available, mock data is returned.

**Anomaly detection:**
```
GET /api/v1/predictions/anomalies?siteId=1
```

**Predictive maintenance:**
```
GET /api/v1/predictions/maintenance?siteId=1&assetId=2
```

**Energy forecast:**
```
GET /api/v1/predictions/forecast?siteId=1&horizon=24h
```

**Optimization recommendations:**
```
GET /api/v1/predictions/optimization?siteId=1
```

## Socket.IO Real-time Communication

### Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to backend');
});
```

### Events

**Subscribe to site updates:**
```javascript
socket.emit('subscribe_site', '1');
```

**Receive real-time metrics:**
```javascript
socket.on('metrics_update', (data) => {
  console.log('Real-time data:', data);
  // {
  //   timestamp: "2025-10-29T10:30:00.000Z",
  //   power: "1250.50",
  //   energy: "15500.25",
  //   efficiency: "91.20",
  //   cost: "48.75"
  // }
});
```

**Receive site-specific data:**
```javascript
socket.on('site_data', (data) => {
  console.log('Site data:', data);
});
```

**Handle disconnection:**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from backend');
});
```

### Server-side Broadcasting

The server automatically broadcasts metrics updates every 5 seconds (in development mode):

```javascript
// In server.js
setInterval(() => {
  const mockData = {
    timestamp: new Date().toISOString(),
    power: (1000 + Math.random() * 500).toFixed(2),
    energy: (15000 + Math.random() * 2000).toFixed(2),
    efficiency: (85 + Math.random() * 10).toFixed(2),
    cost: (45 + Math.random() * 10).toFixed(2)
  };
  
  io.emit('metrics_update', mockData);
}, 5000);
```

## Development

### Adding New Routes

1. Create a new file in `routes/` directory:

```javascript
// routes/newfeature.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

module.exports = router;
```

2. Import and use in `server.js`:

```javascript
const newfeatureRoutes = require('./routes/newfeature');
app.use('/api/v1/newfeature', newfeatureRoutes);
```

### Error Handling

All routes should follow this pattern:

```javascript
router.get('/', async (req, res) => {
  try {
    // Your logic here
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error message',
      message: error.message
    });
  }
});
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Database Integration

### MongoDB Setup (Future)

1. Install MongoDB:
```bash
brew install mongodb-community
brew services start mongodb-community
```

2. Install Mongoose:
```bash
npm install mongoose
```

3. Create models:

```javascript
// models/Site.js
const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: String,
  type: String,
  capacity: Number,
  status: {
    type: String,
    default: 'active'
  },
  installedDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Site', SiteSchema);
```

4. Connect in server.js:

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

## Testing

### Manual Testing

Use curl or Postman:

```bash
# Health check
curl http://localhost:5000/health

# Get all sites
curl http://localhost:5000/api/v1/sites

# Create a site
curl -X POST http://localhost:5000/api/v1/sites \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Site","location":"Test Location","type":"Solar","capacity":1000}'
```

### Automated Testing (Future)

Add tests using Jest:

```javascript
// tests/sites.test.js
const request = require('supertest');
const { app } = require('../server');

describe('Sites API', () => {
  test('GET /api/v1/sites should return all sites', async () => {
    const response = await request(app).get('/api/v1/sites');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

Run tests:
```bash
npm test
```

## Deployment

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up database connection
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Add authentication middleware

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
AI_SERVICE_URL=https://ai.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Running with PM2

```bash
npm install -g pm2
pm2 start server.js --name vidyutai-backend
pm2 logs vidyutai-backend
pm2 restart vidyutai-backend
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -ti:5000

# Kill process
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### AI Service Connection Failed

The backend will automatically fall back to mock data if the AI service is not available. Check:
1. AI service is running on port 8000
2. AI_SERVICE_URL in .env is correct
3. No firewall blocking the connection

### CORS Errors

Update FRONTEND_URL in .env to match your frontend URL.

## Security

### Best Practices

1. **Use environment variables** for secrets
2. **Validate input** on all endpoints
3. **Rate limiting** for API endpoints
4. **Authentication** using JWT (implement in future)
5. **HTTPS** in production
6. **Sanitize** user input
7. **Error handling** without exposing sensitive info

## Contributing

1. Create feature branch
2. Write code following existing patterns
3. Test endpoints manually
4. Submit pull request

## License

See main project LICENSE file.

