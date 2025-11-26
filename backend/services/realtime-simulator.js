const { getDatabase } = require('../database/db');

/**
 * Real-time Data Simulator
 * Continuously generates and writes realistic timeseries data to SQLite
 * Perfect for demo purposes - mimics real IoT sensor data
 */
class RealtimeSimulator {
  constructor(intervalMs = 5000) {
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
  generateData() {
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
          { type: 'frequency', value: this.generateValue(pattern.frequency), unit: 'Hz' }
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
  }

  /**
   * Start the simulator
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Simulator already running');
      return;
    }

    console.log(`🚀 Starting real-time data simulator (interval: ${this.intervalMs}ms)`);
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

