const { getDatabase } = require('../db');

class AssetModel {
  static getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  }

  static findBySiteId(siteId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM assets WHERE site_id = ? ORDER BY name').all(siteId);
  }

  static create(asset) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO assets (id, site_id, name, type, status, health_score, manufacturer, model, capacity, installed_date, last_maintenance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      asset.id, asset.site_id, asset.name, asset.type, asset.status,
      asset.health_score || 100, asset.manufacturer, asset.model,
      asset.capacity, asset.installed_date, asset.last_maintenance
    );
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = db.prepare(`
      UPDATE assets SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  }

  static getDigitalTwinData(assetId) {
    const db = getDatabase();
    const asset = this.findById(assetId);
    
    if (!asset) return null;

    // Generate mock digital twin data points
    const dataPoints = [
      {
        label: 'Temperature',
        real_value: 78.5 + Math.random() * 5,
        predicted_value: 80,
        unit: '°C',
        x: 100,
        y: 50
      },
      {
        label: 'Vibration',
        real_value: 0.6 + Math.random() * 0.2,
        predicted_value: 0.5,
        unit: 'mm/s',
        x: 300,
        y: 50
      },
      {
        label: 'Efficiency',
        real_value: asset.health_score - 5 + Math.random() * 5,
        predicted_value: 94,
        unit: '%',
        x: 100,
        y: 150
      },
      {
        label: 'Power Output',
        real_value: (asset.capacity || 500) * (0.9 + Math.random() * 0.1),
        predicted_value: asset.capacity || 500,
        unit: 'kW',
        x: 300,
        y: 150
      }
    ];

    // Get anomalies from timeseries or predictions
    const anomalies = [];
    const now = Date.now();

    if (Math.random() > 0.3) {
      anomalies.push({
        id: '1',
        assetId,
        type: 'temperature_spike',
        severity: 'medium',
        timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
        description: 'Temperature exceeded normal range by 8°C',
        value: 93.5,
        threshold: 85,
        confidence: 0.89
      });
    }

    if (Math.random() > 0.5) {
      anomalies.push({
        id: '2',
        assetId,
        type: 'efficiency_drop',
        severity: 'low',
        timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
        description: 'Efficiency dropped below expected value',
        value: 82.3,
        threshold: 90,
        confidence: 0.76
      });
    }

    return { dataPoints, anomalies };
  }
}

module.exports = AssetModel;

