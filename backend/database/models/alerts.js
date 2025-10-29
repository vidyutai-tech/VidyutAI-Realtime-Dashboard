const { getDatabase } = require('../db');

class AlertModel {
  static getAll() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  }

  static findBySiteId(siteId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM alerts 
      WHERE site_id = ? 
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `).all(siteId);
  }

  static getActive() {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM alerts 
      WHERE status = 'active' 
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `).all();
  }

  static create(alert) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO alerts (id, site_id, asset_id, severity, type, title, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      alert.id, alert.site_id, alert.asset_id, alert.severity,
      alert.type, alert.title, alert.message, alert.status || 'active'
    );
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = db.prepare(`
      UPDATE alerts SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  static acknowledge(id) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE alerts SET status = 'acknowledged', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  }

  static resolve(id) {
    const db = getDatabase();
    return db.prepare(`
      UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
  }

  static getStats() {
    const db = getDatabase();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
      FROM alerts
      WHERE status IN ('active', 'acknowledged')
    `).get();
    
    return stats;
  }
}

module.exports = AlertModel;

