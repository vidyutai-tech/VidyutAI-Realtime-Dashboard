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
const mlAlertsRoutes = require('./routes/ml-alerts');
const assetsRoutes = require('./routes/assets');
const predictionsRoutes = require('./routes/predictions');
const mlPredictionsRoutes = require('./routes/ml-predictions');
const actionsRoutes = require('./routes/actions');
const wizardRoutes = require('./routes/wizard');
const planningRoutes = require('./routes/planning');

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
app.use('/api/v1/ml-alerts', mlAlertsRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/predictions', predictionsRoutes);
app.use('/api/v1/predict', mlPredictionsRoutes);
app.use('/api/v1/actions', actionsRoutes);
app.use('/api/v1/wizard', wizardRoutes);
app.use('/api/v1/planning', planningRoutes);

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

// Import real-time simulator
const { getSimulator } = require('./services/realtime-simulator');
const { getDatabase } = require('./database/db');

// Socket.IO real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribe_site', (siteId) => {
    socket.join(`site_${siteId}`);
    console.log(`Client ${socket.id} subscribed to site ${siteId}`);

    // Send initial data from database (latest available, not necessarily from last minute)
    const db = getDatabase();
    const latestData = db.prepare(`
      SELECT metric_type, metric_value, unit
      FROM timeseries_data
      WHERE site_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(siteId);

    const metrics = {};
    latestData.forEach(row => {
      metrics[row.metric_type] = {
        value: row.metric_value,
        unit: row.unit
      };
    });

    // Only send initial data if we have metrics, otherwise will be updated by broadcast interval
    if (Object.keys(metrics).length > 0) {
      socket.emit('site_data', {
        siteId,
        timestamp: new Date().toISOString(),
        metrics,
        message: 'Connected to site updates - updates every 10 minutes'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Real-time data updates from SQLite database
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SIMULATOR === 'true') {
  // Start the real-time simulator
  const simulator = getSimulator(600000); // 10 minute intervals
  simulator.start();

  // Broadcast latest data from database every 10 minutes
  setInterval(() => {
    const db = getDatabase();
    const sites = db.prepare('SELECT id FROM sites WHERE status = ?').all('online');

    sites.forEach(site => {
      const siteId = site.id;

      // Get latest metrics from database
      const latestData = db.prepare(`
        SELECT metric_type, metric_value, unit
        FROM timeseries_data
        WHERE site_id = ? AND timestamp >= datetime('now', '-10 minutes')
        ORDER BY timestamp DESC
        LIMIT 10
      `).all(siteId);

      if (latestData.length > 0) {
        const metrics = {};
        latestData.forEach(row => {
          metrics[row.metric_type] = {
            value: row.metric_value,
            unit: row.unit
          };
        });

        // Calculate derived metrics
        const pvGen = metrics.pv_generation?.value || 0;
        const netLoad = metrics.net_load?.value || 0;
        const gridDraw = metrics.grid_draw?.value || 0;
        const batteryDischarge = metrics.battery_discharge?.value || 0;

        const realtimeData = {
          timestamp: new Date().toISOString(),
          siteId,
          power: (pvGen + gridDraw + batteryDischarge).toFixed(2),
          energy: (netLoad * 0.5).toFixed(2), // Approximate energy
          efficiency: metrics.soc?.value ? (85 + (metrics.soc.value / 100) * 10).toFixed(2) : '85.00',
          cost: ((gridDraw * 0.1) + (batteryDischarge * 0.05)).toFixed(2),
          metrics: metrics
        };

        // Broadcast to site-specific room
        io.to(`site_${siteId}`).emit('metrics_update', realtimeData);

        // Also broadcast globally
        io.emit('metrics_update', realtimeData);
        
        // Check for power quality alerts and emit them
        try {
          const { checkPowerQualityForAlerts } = require('./services/power-quality-monitor');
          const alerts = checkPowerQualityForAlerts(siteId, metrics);
          alerts.forEach(alert => {
            io.to(`site_${siteId}`).emit('alert', alert);
            io.emit('alert', alert);
          });
        } catch (error) {
          console.error('Error checking power quality alerts:', error);
        }
      }
    });
  }, 600000); // 10 minutes

  // Clean old data every 24 hours (keep last 48 hours)
  setInterval(() => {
    simulator.cleanOldData(48);
  }, 60 * 60 * 1000);
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

// Export for Vercel serverless
module.exports = app;

// Start server (only when not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/v1`);
    console.log(`🔌 Socket.IO ready for real-time updates`);
  });
}

// For local imports that need io
module.exports.io = io;

