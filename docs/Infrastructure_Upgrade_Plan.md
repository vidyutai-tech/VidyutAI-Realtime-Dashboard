# VidyutAI Infrastructure Upgrade Plan
## Production-Ready Architecture with Demo Data

**Objective:** Upgrade to production-grade infrastructure while maintaining 10-minute intervals and synthetic data for demo purposes.

**Strategy:** "Production-Ready, Demo-Friendly"
- When ready for real IoT: Just swap data source, everything else is ready!

---

## Phase 1: Database Migration (Week 1-2)

### 1.1 Migrate SQLite → TimescaleDB

**Why:** Production-grade time-series database, ready for high-frequency data when needed.

#### Installation

```bash
# Using Docker (Recommended for development)
docker run -d \
  --name timescaledb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=vidyutai_password \
  -e POSTGRES_DB=vidyutai \
  -v timescaledb_data:/var/lib/postgresql/data \
  timescale/timescaledb:latest-pg14

# OR Install locally (Production)
# Ubuntu/Debian
sudo apt install postgresql-14-timescaledb

# Initialize TimescaleDB extension
sudo -u postgres psql -d vidyutai -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
```

#### Schema Migration

```sql
-- backend/database/timescale-schema.sql

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create time-series table (optimized for frequent inserts)
CREATE TABLE IF NOT EXISTS timeseries_data (
    time TIMESTAMPTZ NOT NULL,
    site_id TEXT NOT NULL,
    asset_id TEXT,
    metric_type TEXT NOT NULL,
    metric_value DOUBLE PRECISION,
    unit TEXT,
    tags JSONB,
    metadata JSONB
);

-- Convert to hypertable (TimescaleDB magic)
SELECT create_hypertable('timeseries_data', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_timeseries_site_time 
    ON timeseries_data (site_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_metric_type 
    ON timeseries_data (metric_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_tags 
    ON timeseries_data USING GIN (tags);

-- Automatic data retention (keep 90 days)
SELECT add_retention_policy('timeseries_data', INTERVAL '90 days');

-- Continuous aggregates for faster queries
CREATE MATERIALIZED VIEW timeseries_5min
WITH (timescaledb.continuous) AS
SELECT time_bucket('5 minutes', time) AS bucket,
       site_id,
       metric_type,
       AVG(metric_value) as avg_value,
       MIN(metric_value) as min_value,
       MAX(metric_value) as max_value,
       COUNT(*) as count
FROM timeseries_data
GROUP BY bucket, site_id, metric_type
WITH NO DATA;

-- Refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('timeseries_5min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    capacity_kw DOUBLE PRECISION,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'solar_inverter', 'battery', 'meter', etc.
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    asset_id TEXT,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_site_status 
    ON alerts(site_id, status, created_at DESC);
```

#### Backend Database Client

```javascript
// backend/database/timescale-client.js
const { Pool } = require('pg');

class TimescaleClient {
  constructor() {
    this.pool = new Pool({
      host: process.env.TIMESCALE_HOST || 'localhost',
      port: process.env.TIMESCALE_PORT || 5432,
      database: process.env.TIMESCALE_DB || 'vidyutai',
      user: process.env.TIMESCALE_USER || 'postgres',
      password: process.env.TIMESCALE_PASSWORD || 'vidyutai_password',
      max: 20, // connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text, params) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  // Insert time-series data (optimized for bulk inserts)
  async insertMetrics(metrics) {
    const values = metrics.map(m => [
      m.timestamp || new Date(),
      m.site_id,
      m.asset_id,
      m.metric_type,
      m.metric_value,
      m.unit,
      JSON.stringify(m.tags || {}),
      JSON.stringify(m.metadata || {})
    ]);

    const query = `
      INSERT INTO timeseries_data 
        (time, site_id, asset_id, metric_type, metric_value, unit, tags, metadata)
      SELECT * FROM UNNEST($1::timestamptz[], $2::text[], $3::text[], 
                          $4::text[], $5::double precision[], $6::text[], 
                          $7::jsonb[], $8::jsonb[])
    `;

    // Transpose the values array
    const transposed = [
      values.map(v => v[0]),
      values.map(v => v[1]),
      values.map(v => v[2]),
      values.map(v => v[3]),
      values.map(v => v[4]),
      values.map(v => v[5]),
      values.map(v => v[6]),
      values.map(v => v[7])
    ];

    return this.query(query, transposed);
  }

  // Get latest metrics for a site
  async getLatestMetrics(siteId, metricTypes = []) {
    const typeFilter = metricTypes.length > 0 
      ? 'AND metric_type = ANY($2)' 
      : '';
    
    const query = `
      SELECT DISTINCT ON (metric_type)
        time,
        metric_type,
        metric_value,
        unit
      FROM timeseries_data
      WHERE site_id = $1 ${typeFilter}
      ORDER BY metric_type, time DESC
    `;

    const params = metricTypes.length > 0 ? [siteId, metricTypes] : [siteId];
    const result = await this.query(query, params);
    
    return result.rows.reduce((acc, row) => {
      acc[row.metric_type] = {
        value: row.metric_value,
        unit: row.unit,
        timestamp: row.time
      };
      return acc;
    }, {});
  }

  // Get time-series data for charts
  async getTimeSeriesData(siteId, metricType, startTime, endTime, interval = '5 minutes') {
    const query = `
      SELECT 
        time_bucket($4, time) AS bucket,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value
      FROM timeseries_data
      WHERE site_id = $1 
        AND metric_type = $2
        AND time BETWEEN $5 AND $6
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const result = await this.query(query, [
      siteId, 
      metricType, 
      interval,
      startTime,
      endTime
    ]);

    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new TimescaleClient();
```

#### Update Simulator to Use TimescaleDB

```javascript
// backend/services/realtime-simulator.js (Updated)
const timescale = require('../database/timescale-client');

class RealtimeSimulator {
  constructor(intervalMs = 600000) { // Still 10 minutes
    this.intervalMs = intervalMs;
    this.intervalId = null;
    this.isRunning = false;
  }

  async generateAndStore(siteId) {
    const timestamp = new Date();
    
    // Generate synthetic metrics (same as before)
    const metrics = [
      { 
        timestamp,
        site_id: siteId,
        asset_id: 'solar-1',
        metric_type: 'pv_generation',
        metric_value: this.generateSolarPower(),
        unit: 'kW',
        tags: { source: 'simulator' }
      },
      {
        timestamp,
        site_id: siteId,
        asset_id: 'battery-1',
        metric_type: 'battery_soc',
        metric_value: this.generateBatterySoC(),
        unit: '%',
        tags: { source: 'simulator' }
      },
      {
        timestamp,
        site_id: siteId,
        asset_id: 'meter-1',
        metric_type: 'grid_power',
        metric_value: this.generateGridPower(),
        unit: 'kW',
        tags: { source: 'simulator' }
      },
      // ... more metrics
    ];

    // Bulk insert to TimescaleDB
    await timescale.insertMetrics(metrics);
    
    return metrics;
  }

  start(siteIds) {
    if (this.isRunning) return;

    console.log(`🚀 Starting simulator with ${this.intervalMs}ms interval`);
    this.isRunning = true;

    // Immediate first run
    siteIds.forEach(siteId => this.generateAndStore(siteId));

    // Then repeat every 10 minutes
    this.intervalId = setInterval(() => {
      siteIds.forEach(siteId => this.generateAndStore(siteId));
    }, this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏹️ Simulator stopped');
    }
  }

  // Generate realistic synthetic data methods
  generateSolarPower() {
    const hour = new Date().getHours();
    const basePower = Math.max(0, Math.sin((hour - 6) * Math.PI / 12)) * 500;
    return basePower + (Math.random() - 0.5) * 100;
  }

  generateBatterySoC() {
    return 50 + Math.random() * 40; // 50-90%
  }

  generateGridPower() {
    return 100 + Math.random() * 200;
  }
}

module.exports = new RealtimeSimulator();
```

---

## Phase 2: MQTT Integration (Week 2-3)

### 2.1 Install MQTT Broker

```bash
# Using Docker (Recommended)
docker run -d \
  --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  -v mosquitto_data:/mosquitto/data \
  -v mosquitto_logs:/mosquitto/log \
  eclipse-mosquitto:latest
```

#### MQTT Configuration

```conf
# mosquitto.conf
listener 1883
allow_anonymous true  # For demo; use authentication in production

# WebSocket support (optional)
listener 9001
protocol websockets

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type all

# Persistence
persistence true
persistence_location /mosquitto/data/
```

### 2.2 MQTT Publisher Service

```javascript
// backend/services/mqtt-publisher.js
const mqtt = require('mqtt');
const timescale = require('../database/timescale-client');

class MQTTPublisher {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect() {
    const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    
    this.client = mqtt.connect(mqttUrl, {
      clientId: `vidyutai_server_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT Publisher connected');
      this.connected = true;
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
      this.connected = false;
    });
  }

  // Publish synthetic data to MQTT (simulating IoT devices)
  publishSyntheticData(siteId, metrics) {
    if (!this.connected) {
      console.warn('MQTT not connected, skipping publish');
      return;
    }

    metrics.forEach(metric => {
      const topic = `vidyutai/${siteId}/${metric.asset_id}/${metric.metric_type}`;
      const payload = JSON.stringify({
        timestamp: metric.timestamp,
        value: metric.metric_value,
        unit: metric.unit,
        source: 'simulator'
      });

      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
        }
      });
    });

    console.log(`📤 Published ${metrics.length} metrics to MQTT for site ${siteId}`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = new MQTTPublisher();
```

### 2.3 MQTT Subscriber Service (Ready for Real IoT)

```javascript
// backend/services/mqtt-subscriber.js
const mqtt = require('mqtt');
const timescale = require('../database/timescale-client');
const { io } = require('../server'); // Socket.IO instance

class MQTTSubscriber {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect() {
    const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    
    this.client = mqtt.connect(mqttUrl, {
      clientId: `vidyutai_subscriber_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT Subscriber connected');
      this.connected = true;

      // Subscribe to all VidyutAI topics
      this.client.subscribe('vidyutai/#', { qos: 1 }, (err) => {
        if (err) {
          console.error('Failed to subscribe:', err);
        } else {
          console.log('📡 Subscribed to vidyutai/# topics');
        }
      });
    });

    // Handle incoming messages (from real IoT devices or simulator)
    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Parse topic: vidyutai/{siteId}/{assetId}/{metricType}
        const parts = topic.split('/');
        if (parts.length !== 4) return;

        const [, siteId, assetId, metricType] = parts;

        // Store to TimescaleDB
        await timescale.insertMetrics([{
          timestamp: data.timestamp || new Date(),
          site_id: siteId,
          asset_id: assetId,
          metric_type: metricType,
          metric_value: data.value,
          unit: data.unit,
          tags: { source: data.source || 'unknown' },
          metadata: data.metadata || {}
        }]);

        // Broadcast to WebSocket clients (throttled by client)
        io.to(`site_${siteId}`).emit('metrics_update', {
          siteId,
          assetId,
          metricType,
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp || new Date()
        });

        console.log(`📥 Received and stored: ${topic} = ${data.value} ${data.unit}`);

      } catch (err) {
        console.error('Error processing MQTT message:', err);
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Subscriber Error:', err);
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = new MQTTSubscriber();
```

### 2.4 Update Simulator to Publish to MQTT

```javascript
// backend/services/realtime-simulator.js (Updated)
const timescale = require('../database/timescale-client');
const mqttPublisher = require('./mqtt-publisher');

class RealtimeSimulator {
  // ... existing code ...

  async generateAndStore(siteId) {
    const metrics = [/* ... generate metrics ... */];

    // Store to TimescaleDB
    await timescale.insertMetrics(metrics);
    
    // Publish to MQTT (simulating IoT devices)
    mqttPublisher.publishSyntheticData(siteId, metrics);
    
    return metrics;
  }

  // ... rest of the code ...
}
```

---

## Phase 3: Redis Cache Layer (Week 3-4)

### 3.1 Install Redis

```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes
```

### 3.2 Redis Client

```javascript
// backend/database/redis-client.js
const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis Error:', err);
    });

    this.client.connect();
  }

  // Cache latest metrics (fast reads)
  async cacheLatestMetrics(siteId, metrics) {
    const key = `site:${siteId}:latest_metrics`;
    await this.client.set(key, JSON.stringify(metrics), {
      EX: 900 // Expire in 15 minutes
    });
  }

  async getLatestMetrics(siteId) {
    const key = `site:${siteId}:latest_metrics`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache for API responses
  async cacheResponse(cacheKey, data, ttlSeconds = 300) {
    await this.client.set(cacheKey, JSON.stringify(data), {
      EX: ttlSeconds
    });
  }

  async getCachedResponse(cacheKey) {
    const cached = await this.client.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  // Pub/Sub for real-time events
  async publishEvent(channel, message) {
    await this.client.publish(channel, JSON.stringify(message));
  }

  subscribeToEvents(channel, callback) {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
    return subscriber;
  }

  async close() {
    await this.client.quit();
  }
}

module.exports = new RedisClient();
```

---

## Phase 4: Updated Server Architecture (Week 4)

### 4.1 Main Server Integration

```javascript
// backend/server.js (Updated)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Database clients
const timescale = require('./database/timescale-client');
const redis = require('./database/redis-client');

// Services
const mqttPublisher = require('./services/mqtt-publisher');
const mqttSubscriber = require('./services/mqtt-subscriber');
const simulator = require('./services/realtime-simulator');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Initialize services
async function initializeServices() {
  console.log('🚀 Initializing VidyutAI services...');

  // 1. Connect to MQTT
  mqttPublisher.connect();
  mqttSubscriber.connect();

  // 2. Start simulator (still 10-minute intervals)
  simulator.start(['site-1', 'site-2']);

  console.log('✅ All services initialized');
}

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribe_site', async (siteId) => {
    socket.join(`site_${siteId}`);
    console.log(`Client ${socket.id} subscribed to site ${siteId}`);

    // Send cached latest data immediately
    const cachedMetrics = await redis.getLatestMetrics(siteId);
    if (cachedMetrics) {
      socket.emit('site_data', cachedMetrics);
    } else {
      // Fetch from TimescaleDB
      const metrics = await timescale.getLatestMetrics(siteId);
      socket.emit('site_data', metrics);
      
      // Cache for next time
      await redis.cacheLatestMetrics(siteId, metrics);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
app.get('/api/sites/:siteId/metrics/latest', async (req, res) => {
  try {
    const { siteId } = req.params;
    
    // Try cache first
    let metrics = await redis.getLatestMetrics(siteId);
    
    if (!metrics) {
      // Fetch from database
      metrics = await timescale.getLatestMetrics(siteId);
      
      // Cache for 5 minutes
      await redis.cacheLatestMetrics(siteId, metrics);
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sites/:siteId/metrics/timeseries', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { metric_type, start_time, end_time, interval } = req.query;

    // Check cache
    const cacheKey = `timeseries:${siteId}:${metric_type}:${start_time}:${end_time}:${interval}`;
    let data = await redis.getCachedResponse(cacheKey);

    if (!data) {
      data = await timescale.getTimeSeriesData(
        siteId,
        metric_type,
        new Date(start_time),
        new Date(end_time),
        interval || '5 minutes'
      );

      // Cache for 5 minutes
      await redis.cacheResponse(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  simulator.stop();
  mqttPublisher.disconnect();
  mqttSubscriber.disconnect();
  await timescale.close();
  await redis.close();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeServices();
});

module.exports = { app, server, io };
```

---

## Phase 5: Environment Configuration

### 5.1 Environment Variables

```env
# .env (Backend)

# Server
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# TimescaleDB
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=vidyutai
TIMESCALE_USER=postgres
TIMESCALE_PASSWORD=vidyutai_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MQTT
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Simulator
SIMULATOR_INTERVAL=600000  # 10 minutes (600,000 ms)
SIMULATOR_ENABLED=true

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
```

### 5.2 Package Dependencies

```json
// package.json (Backend - Add these)
{
  "dependencies": {
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "mqtt": "^5.3.0",
    "dotenv": "^16.3.0"
  }
}
```

```bash
# Install new dependencies
cd backend
npm install pg redis mqtt
```

---

## Phase 6: Docker Compose (Complete Stack)

```yaml
# docker-compose.dev.yml (Updated)
version: '3.8'

services:
  # TimescaleDB
  timescaledb:
    image: timescale/timescaledb:latest-pg14
    container_name: vidyutai_timescaledb
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: vidyutai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: vidyutai_password
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./backend/database/timescale-schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: vidyutai_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # MQTT Broker
  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: vidyutai_mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_logs:/mosquitto/log
    healthcheck:
      test: ["CMD-SHELL", "mosquitto_sub -t '$$SYS/#' -C 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vidyutai_backend
    ports:
      - "5001:5001"
    environment:
      TIMESCALE_HOST: timescaledb
      TIMESCALE_PORT: 5432
      TIMESCALE_DB: vidyutai
      TIMESCALE_USER: postgres
      TIMESCALE_PASSWORD: vidyutai_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
      MQTT_URL: mqtt://mosquitto:1883
      SIMULATOR_INTERVAL: 600000
      SIMULATOR_ENABLED: "true"
    depends_on:
      timescaledb:
        condition: service_healthy
      redis:
        condition: service_healthy
      mosquitto:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: vidyutai_frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:5001
      VITE_SOCKET_URL: http://localhost:5001
      VITE_AI_BASE_URL: http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  timescale_data:
  redis_data:
  mosquitto_data:
  mosquitto_logs:
```

---

## Phase 7: Migration Scripts

### 7.1 Data Migration from SQLite to TimescaleDB

```javascript
// backend/scripts/migrate-sqlite-to-timescale.js
const sqlite3 = require('sqlite3').verbose();
const timescale = require('../database/timescale-client');

async function migrateSQLiteToTimescale() {
  console.log('🔄 Starting migration from SQLite to TimescaleDB...');

  const db = new sqlite3.Database('./database/vidyutai.db');

  // Migrate timeseries_data
  db.all('SELECT * FROM timeseries_data ORDER BY timestamp', async (err, rows) => {
    if (err) {
      console.error('Error reading SQLite:', err);
      return;
    }

    console.log(`Found ${rows.length} records to migrate`);

    // Batch insert for performance
    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const metrics = batch.map(row => ({
        timestamp: new Date(row.timestamp),
        site_id: row.site_id,
        asset_id: row.asset_id,
        metric_type: row.metric_type,
        metric_value: row.metric_value,
        unit: row.unit,
        tags: { migrated: true }
      }));

      await timescale.insertMetrics(metrics);
      console.log(`Migrated ${i + batch.length}/${rows.length} records`);
    }

    console.log('✅ Migration completed!');
    db.close();
    process.exit(0);
  });
}

migrateSQLiteToTimescale();
```

---

## Summary: What You'll Have

### ✅ Production-Ready Infrastructure
1. **TimescaleDB** - Enterprise time-series database
2. **Redis** - Fast caching and pub/sub
3. **MQTT Broker** - IoT communication layer
4. **Docker Compose** - One-command deployment

### ✅ Still Demo-Friendly
1. **10-minute intervals** - Same as now
2. **Synthetic data** - Simulator still active
3. **No real IoT required** - Everything simulated

### ✅ IoT-Ready Architecture
When you get real devices:
```javascript
// Just change this:
SIMULATOR_ENABLED=true  → SIMULATOR_ENABLED=false

// And real IoT devices publish to:
mqtt://your-broker:1883/vidyutai/{siteId}/{assetId}/{metric}

// System automatically:
// 1. Receives real data via MQTT
// 2. Stores to TimescaleDB
// 3. Broadcasts to frontend
// 4. NO CODE CHANGES NEEDED!
```

---

## Timeline & Effort

| Phase | Task | Duration | Complexity |
|-------|------|----------|------------|
| 1 | TimescaleDB Setup | 2-3 days | Medium |
| 2 | MQTT Integration | 2-3 days | Medium |
| 3 | Redis Cache | 1-2 days | Easy |
| 4 | Server Updates | 2 days | Medium |
| 5 | Testing | 3-4 days | Medium |
| **Total** | | **10-14 days** | |

---

## Cost Analysis

### Development Environment
- **TimescaleDB (Docker):** Free
- **Redis (Docker):** Free
- **MQTT (Docker):** Free
- **Total:** ₹0/month

### Production Cloud
- **TimescaleDB Cloud:** ₹8,000/month
- **Redis Cloud:** ₹3,000/month
- **MQTT Cloud (HiveMQ):** ₹5,000/month
- **Total:** ₹16,000/month

---

## Next Steps

### This Week
1. Set up Docker containers (TimescaleDB, Redis, MQTT)
2. Create schema and test connections
3. Verify data flow with simulator

### Next Week
1. Migrate SQLite data to TimescaleDB
2. Integrate MQTT publisher/subscriber
3. Test end-to-end with synthetic data

### Week 3
1. Add Redis caching
2. Performance testing
3. Documentation

**Result:** Production-ready infrastructure running with demo data! 🎉

When you get real IoT devices → Just flip a switch (env variable) and plug them in!

