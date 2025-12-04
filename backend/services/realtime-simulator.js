const { getDatabase } = require('../database/db');
const timescale = require('../database/timescale-client');
const redis = require('../database/redis-client');
const mqtt = require('./mqtt-client');

/**
 * Real-time Data Simulator
 * Continuously generates and writes realistic timeseries data to SQLite
 * Perfect for demo purposes - mimics real IoT sensor data
 */
class RealtimeSimulator {
  constructor(intervalMs = 600000) { // Default to 10 minutes (600000ms)
    this.db = getDatabase();
    this.intervalMs = intervalMs;
    this.intervalId = null;
    this.isRunning = false;
    this.siteIds = [];
    
    // Realistic base values and patterns
    this.patterns = {
      'site-1': {
        pv_generation: { base: 500, variance: 300, trend: 0, timeOfDay: true },
        net_load: { base: 400, variance: 200, trend: 0, timeOfDay: true },
        battery_discharge: { base: 50, variance: 100, trend: 0 },
        grid_draw: { base: 100, variance: 150, trend: 0 },
        soc: { base: 70, variance: 20, trend: -0.1 },
        voltage: { base: 415, variance: 15, trend: 0 },
        current: { base: 120, variance: 30, trend: 0 },
        frequency: { base: 50, variance: 0.3, trend: 0 }
      }
    };
    
    // Prepare insert statement for performance
    this.insertStmt = this.db.prepare(`
      INSERT INTO timeseries_data (site_id, asset_id, timestamp, metric_type, metric_value, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  }

  /**
   * Get time-of-day multiplier (solar peaks at noon, load peaks in evening)
   */
  getTimeOfDayMultiplier() {
    const hour = new Date().getHours();
    // Solar: peaks at 12-14 (noon), low at night
    const solarMultiplier = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
    // Load: peaks at 18-20 (evening), lower at night
    const loadMultiplier = 0.5 + 0.5 * Math.sin((hour - 12) * Math.PI / 12);
    return { solar: solarMultiplier, load: loadMultiplier };
  }

  /**
   * Generate realistic value with trend and variance
   */
  generateValue(config, timeMultiplier = 1) {
    const { base, variance, trend } = config;
    const random = (Math.random() * 2 - 1) * variance;
    const trendValue = trend * (this.isRunning ? 1 : 0);
    return Math.max(0, base * timeMultiplier + random + trendValue);
  }

  /**
   * Generate and insert timeseries data for all sites
   */
  async generateData() {
    const now = new Date();
    const timeMultipliers = this.getTimeOfDayMultiplier();
    
    // Get all active sites
    const sites = this.db.prepare('SELECT id FROM sites WHERE status = ?').all('online');
    
    if (sites.length === 0) {
      console.warn('⚠️  No active sites found. Add sites to database first.');
      return;
    }

    const insertMany = this.db.transaction(() => {
      sites.forEach(site => {
        const siteId = site.id;
        const pattern = this.patterns[siteId] || this.patterns['site-1'];
        
        // Generate metrics
        const metrics = [
          { type: 'pv_generation', value: this.generateValue(pattern.pv_generation, timeMultipliers.solar), unit: 'kW' },
          { type: 'net_load', value: this.generateValue(pattern.net_load, timeMultipliers.load), unit: 'kW' },
          { type: 'battery_discharge', value: this.generateValue(pattern.battery_discharge), unit: 'kW' },
          { type: 'grid_draw', value: this.generateValue(pattern.grid_draw), unit: 'kW' },
          { type: 'soc', value: Math.min(100, Math.max(0, this.generateValue(pattern.soc))), unit: '%' },
          { type: 'voltage', value: this.generateValue(pattern.voltage), unit: 'V' },
          { type: 'current', value: this.generateValue(pattern.current), unit: 'A' },
          { type: 'frequency', value: this.generateValue(pattern.frequency), unit: 'Hz' },
          { type: 'thd', value: Math.max(0, Math.min(15, 2.5 + Math.random() * 3)), unit: '%' },
          { type: 'power_factor', value: Math.max(0.75, Math.min(1.0, 0.92 + Math.random() * 0.06)), unit: '' },
          { type: 'voltage_unbalance', value: Math.max(0, Math.min(5, 0.5 + Math.random() * 2)), unit: '%' }
        ];

        // Insert each metric
        metrics.forEach(metric => {
          this.insertStmt.run(
            siteId,
            null, // asset_id
            now.toISOString(),
            metric.type,
            parseFloat(metric.value.toFixed(2)),
            metric.unit
          );
        });
      });
    });

    insertMany();
    
    // Write to new infrastructure if enabled (parallel operation)
    await this.writeToNewInfrastructure(sites, now, timeMultipliers);
  }

  async writeToNewInfrastructure(sites, now, timeMultipliers) {
    for (const site of sites) {
      const siteId = site.id;
      const pattern = this.patterns[siteId] || this.patterns['site-1'];
      
      const metrics = [
        { type: 'pv_generation', value: this.generateValue(pattern.pv_generation, timeMultipliers.solar), unit: 'kW' },
        { type: 'net_load', value: this.generateValue(pattern.net_load, timeMultipliers.load), unit: 'kW' },
        { type: 'battery_discharge', value: this.generateValue(pattern.battery_discharge), unit: 'kW' },
        { type: 'grid_draw', value: this.generateValue(pattern.grid_draw), unit: 'kW' },
        { type: 'soc', value: Math.min(100, Math.max(0, this.generateValue(pattern.soc))), unit: '%' },
        { type: 'voltage', value: this.generateValue(pattern.voltage), unit: 'V' },
        { type: 'current', value: this.generateValue(pattern.current), unit: 'A' },
        { type: 'frequency', value: this.generateValue(pattern.frequency), unit: 'Hz' },
        { type: 'thd', value: Math.max(0, Math.min(15, 2.5 + Math.random() * 3)), unit: '%' },
        { type: 'power_factor', value: Math.max(0.75, Math.min(1.0, 0.92 + Math.random() * 0.06)), unit: '' },
        { type: 'voltage_unbalance', value: Math.max(0, Math.min(5, 0.5 + Math.random() * 2)), unit: '%' }
      ];

      // TimescaleDB
      if (timescale.enabled) {
        try {
          const tsMetrics = metrics.map(m => ({
            timestamp: now,
            site_id: siteId,
            asset_id: `asset-${m.type}`,
            metric_type: m.type,
            metric_value: parseFloat(m.value.toFixed(2)),
            unit: m.unit,
            tags: { source: 'simulator' }
          }));
          await timescale.insertMetrics(tsMetrics);
        } catch (err) {
          console.error('TimescaleDB write error:', err.message);
        }
      }

      // MQTT
      if (mqtt.enabled && mqtt.connected) {
        metrics.forEach(m => {
          mqtt.publish(`vidyutai/${siteId}/asset-${m.type}/${m.type}`, {
            timestamp: now.toISOString(),
            value: parseFloat(m.value.toFixed(2)),
            unit: m.unit,
            source: 'simulator'
          });
        });
      }

      // Redis
      if (redis.enabled) {
        try {
          const cacheData = metrics.reduce((acc, m) => {
            acc[m.type] = { value: m.value, unit: m.unit, timestamp: now };
            return acc;
          }, {});
          await redis.set(`site:${siteId}:latest`, cacheData, 900);
        } catch (err) {
          console.error('Redis cache error:', err.message);
        }
      }
    }
  }
  
  /**
   * Check power quality metrics and generate alerts if issues detected
   */
  checkPowerQualityAndAlert(siteId, metricsArray) {
    // Extract power quality metrics
    const voltageMetric = metricsArray.find(m => m.type === 'voltage');
    const frequencyMetric = metricsArray.find(m => m.type === 'frequency');
    const thdMetric = metricsArray.find(m => m.type === 'thd');
    const pfMetric = metricsArray.find(m => m.type === 'power_factor');
    const unbalanceMetric = metricsArray.find(m => m.type === 'voltage_unbalance');
    
    if (!voltageMetric || !frequencyMetric || !thdMetric || !pfMetric || !unbalanceMetric) {
      return; // Not all metrics available
    }
    
    const voltage = voltageMetric.value;
    const frequency = frequencyMetric.value;
    const thd = thdMetric.value;
    const powerFactor = pfMetric.value;
    const voltageUnbalance = unbalanceMetric.value;
    
    // Voltage quality check
    const voltageDeviation = Math.abs(voltage - 415) / 415 * 100;
    if (voltageDeviation > 7) {
      this.createPowerQualityAlert(siteId, 'critical', 'Voltage Out of Range', 
        `Voltage deviation detected: ${voltage.toFixed(1)}V (${voltageDeviation.toFixed(1)}% deviation from nominal 415V). This may cause equipment damage.`);
    } else if (voltageDeviation > 5) {
      this.createPowerQualityAlert(siteId, 'high', 'Voltage Deviation Warning', 
        `Voltage deviation: ${voltage.toFixed(1)}V (${voltageDeviation.toFixed(1)}% deviation). Monitor closely.`);
    }
    
    // Frequency stability check
    const frequencyDeviation = Math.abs(frequency - 50.0);
    if (frequencyDeviation > 0.5) {
      this.createPowerQualityAlert(siteId, 'critical', 'Frequency Instability', 
        `Frequency deviation: ${frequency.toFixed(2)}Hz (${frequencyDeviation.toFixed(2)}Hz from nominal 50Hz). Grid stability issue detected.`);
    } else if (frequencyDeviation > 0.3) {
      this.createPowerQualityAlert(siteId, 'high', 'Frequency Deviation Warning', 
        `Frequency deviation: ${frequency.toFixed(2)}Hz. Monitor grid stability.`);
    }
    
    // THD check
    if (thd > 10) {
      this.createPowerQualityAlert(siteId, 'critical', 'High Harmonic Distortion', 
        `THD: ${thd.toFixed(2)}% (exceeds 10%). Equipment damage risk. Immediate action recommended.`);
    } else if (thd > 8) {
      this.createPowerQualityAlert(siteId, 'high', 'Elevated Harmonic Distortion', 
        `THD: ${thd.toFixed(2)}% (above 8%). Monitor and investigate source of harmonics.`);
    }
    
    // Power Factor check
    if (powerFactor < 0.80) {
      this.createPowerQualityAlert(siteId, 'high', 'Low Power Factor', 
        `Power factor: ${powerFactor.toFixed(3)} (below 0.80). Energy efficiency reduced. Consider power factor correction.`);
    } else if (powerFactor < 0.85) {
      this.createPowerQualityAlert(siteId, 'medium', 'Power Factor Warning', 
        `Power factor: ${powerFactor.toFixed(3)}. Below optimal range (>0.95).`);
    }
    
    // Voltage Unbalance check
    if (voltageUnbalance > 4) {
      this.createPowerQualityAlert(siteId, 'critical', 'High Voltage Unbalance', 
        `Voltage unbalance: ${voltageUnbalance.toFixed(2)}% (exceeds 4%). Phase imbalance detected. Motor damage risk.`);
    } else if (voltageUnbalance > 3) {
      this.createPowerQualityAlert(siteId, 'high', 'Voltage Unbalance Warning', 
        `Voltage unbalance: ${voltageUnbalance.toFixed(2)}% (above 3%). Monitor three-phase balance.`);
    }
  }
  
  /**
   * Create a power quality alert (with deduplication)
   */
  createPowerQualityAlert(siteId, severity, title, message) {
    try {
      const db = getDatabase();
      const AlertModel = require('../database/models/alerts');
      
      // Check if similar alert already exists (to avoid duplicates)
      const existingAlert = db.prepare(`
        SELECT id FROM alerts 
        WHERE site_id = ? AND title = ? AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
      `).get(siteId, title);
      
      if (existingAlert) {
        // Update existing alert timestamp instead of creating duplicate
        db.prepare(`
          UPDATE alerts SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existingAlert.id);
        return;
      }
      
      // Create new alert
      const alertId = `pq_${siteId}_${Date.now()}`;
      AlertModel.create({
        id: alertId,
        site_id: siteId,
        asset_id: null,
        severity: severity,
        type: 'power_quality',
        title: title,
        message: message,
        status: 'active'
      });
      
      console.log(`⚠️  Power Quality Alert: ${title} (${severity}) for site ${siteId}`);
    } catch (error) {
      console.error('Failed to create power quality alert:', error);
    }
  }

  /**
   * Start the simulator
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Simulator already running');
      return;
    }

    console.log(`🚀 Starting real-time data simulator (interval: ${this.intervalMs}ms / ${this.intervalMs / 60000} minutes)`);
    console.log(`📍 Infrastructure: SQLite=✅ | TimescaleDB=${timescale.enabled} | Redis=${redis.enabled} | MQTT=${mqtt.enabled}`);
    this.isRunning = true;
    
    // Generate initial data point
    this.generateData();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.generateData();
    }, this.intervalMs);
    
    console.log('✅ Real-time simulator started');
  }

  /**
   * Stop the simulator
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('🛑 Real-time simulator stopped');
  }

  /**
   * Clean old data (keep last N hours)
   */
  cleanOldData(hoursToKeep = 48) {
    const cutoff = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000);
    const deleted = this.db.prepare(`
      DELETE FROM timeseries_data 
      WHERE timestamp < ?
    `).run(cutoff.toISOString());
    
    console.log(`🧹 Cleaned ${deleted.changes} old timeseries records`);
    return deleted.changes;
  }
}

// Export singleton instance
let simulatorInstance = null;

function getSimulator(intervalMs = 5000) {
  if (!simulatorInstance) {
    simulatorInstance = new RealtimeSimulator(intervalMs);
  }
  return simulatorInstance;
}

module.exports = { RealtimeSimulator, getSimulator };

