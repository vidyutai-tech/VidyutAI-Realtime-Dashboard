const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { ensureInitialized } = require('./database/db');

// Import routes
const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const assetsRoutes = require('./routes/assets');
const predictionsRoutes = require('./routes/predictions');
const mlPredictionsRoutes = require('./routes/ml-predictions');
const actionsRoutes = require('./routes/actions');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Ensure database is initialized (tables + seed) before routes
ensureInitialized();

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VidyutAI Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sites', sitesRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/predictions', predictionsRoutes);
app.use('/api/v1/predict', mlPredictionsRoutes);
app.use('/api/v1/actions', actionsRoutes);

// Simulator endpoint (also available as /api/v1/simulate for convenience)
app.post('/api/v1/simulate', async (req, res) => {
  const { pvCurtail = 0, batteryTarget = 80, gridPrice = 5 } = req.body;
  
  // Generate mock simulation results
  const hours = 24;
  const cost = [];
  const emissions = [];
  
  for (let i = 0; i < hours; i++) {
    // Simulate cost based on parameters
    const baseCost = gridPrice * (100 + Math.random() * 50);
    const pvSavings = pvCurtail * 2;
    const batterySavings = (batteryTarget - 50) * 0.5;
    
    cost.push(parseFloat((baseCost - pvSavings - batterySavings).toFixed(2)));
    
    // Simulate emissions (kg CO2)
    const baseEmissions = 50 + Math.random() * 20;
    emissions.push(parseFloat((baseEmissions * (1 - pvCurtail / 100)).toFixed(2)));
  }
  
  res.json({
    success: true,
    cost,
    emissions,
    parameters: {
      pvCurtail,
      batteryTarget,
      gridPrice
    },
    summary: {
      totalCost: cost.reduce((a, b) => a + b, 0).toFixed(2),
      totalEmissions: emissions.reduce((a, b) => a + b, 0).toFixed(2),
      avgCostPerHour: (cost.reduce((a, b) => a + b, 0) / hours).toFixed(2)
    }
  });
});

// Socket.IO real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribe_site', (siteId) => {
    socket.join(`site_${siteId}`);
    console.log(`Client ${socket.id} subscribed to site ${siteId}`);
    
    // Send initial data
    socket.emit('site_data', {
      siteId,
      timestamp: new Date().toISOString(),
      message: 'Connected to site updates'
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate real-time data updates (for development)
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const mockData = {
      timestamp: new Date().toISOString(),
      power: (1000 + Math.random() * 500).toFixed(2),
      energy: (15000 + Math.random() * 2000).toFixed(2),
      efficiency: (85 + Math.random() * 10).toFixed(2),
      cost: (45 + Math.random() * 10).toFixed(2)
    };
    
    // Broadcast to all connected clients
    io.emit('metrics_update', mockData);
  }, 5000);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/v1`);
  console.log(`🔌 Socket.IO ready for real-time updates`);
});

module.exports = { app, io };

