const { getDatabase } = require('../db');

class SiteModel {
  static getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
  }

  static create(site) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sites (id, name, location, latitude, longitude, capacity, status, energy_saved, cost_reduced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      site.id, site.name, site.location, site.latitude, site.longitude,
      site.capacity, site.status, site.energy_saved || 0, site.cost_reduced || 0
    );
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = db.prepare(`
      UPDATE sites SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM sites WHERE id = ?').run(id);
  }

  static getHealthStatus(siteId) {
    const db = getDatabase();
    
    // Get assets health for this site
    const assets = db.prepare('SELECT type, health_score FROM assets WHERE site_id = ?').all(siteId);
    
    const healthStatus = {
      siteId,
      timestamp: new Date().toISOString(),
      site_health: 92 + Math.random() * 8,
      pv_health: 92 + Math.random() * 8,
      battery_soh: 88 + Math.random() * 10,
      battery_soc: 75 + Math.random() * 15,
      inverter_health: 95 + Math.random() * 5,
      ev_charger_health: 90 + Math.random() * 8,
      motor_health: 85 + Math.random() * 12,
      grid_draw: 150 + Math.random() * 100,
      pv_generation_today: 850 + Math.random() * 200,
      overall_health: 90 + Math.random() * 8
    };

    // Use actual asset health scores if available
    assets.forEach(asset => {
      if (asset.type === 'solar') healthStatus.pv_health = asset.health_score;
      if (asset.type === 'battery') healthStatus.battery_soh = asset.health_score;
      if (asset.type === 'inverter') healthStatus.inverter_health = asset.health_score;
      if (asset.type === 'ev_charger') healthStatus.ev_charger_health = asset.health_score;
      if (asset.type === 'motor') healthStatus.motor_health = asset.health_score;
    });

    return healthStatus;
  }

  static getTimeseries(siteId, range = 'last_6h') {
    const db = getDatabase();
    
    // Calculate time range
    const now = new Date();
    let hoursBack = 6;
    if (range === 'last_24h') hoursBack = 24;
    if (range === 'last_7d') hoursBack = 24 * 7;
    
    const startTime = new Date(now - hoursBack * 60 * 60 * 1000).toISOString();
    
    const data = db.prepare(`
      SELECT timestamp, metric_type, metric_value
      FROM timeseries_data
      WHERE site_id = ? AND timestamp >= ?
      ORDER BY timestamp ASC
    `).all(siteId, startTime);
    
    // Group by timestamp
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.timestamp]) {
        grouped[row.timestamp] = { timestamp: row.timestamp, metrics: {} };
      }
      grouped[row.timestamp].metrics[row.metric_type] = row.metric_value;
    });
    
    return Object.values(grouped);
  }
}

module.exports = SiteModel;

