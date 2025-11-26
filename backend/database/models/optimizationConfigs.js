const { getDatabase } = require('../db');

class OptimizationConfigModel {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM optimization_configs WHERE id = ?');
    const result = stmt.get(id);
    if (result) {
      result.load_data = JSON.parse(result.load_data);
      result.tariff_data = JSON.parse(result.tariff_data);
      result.pv_parameters = result.pv_parameters ? JSON.parse(result.pv_parameters) : null;
      result.battery_parameters = result.battery_parameters ? JSON.parse(result.battery_parameters) : null;
      result.grid_parameters = result.grid_parameters ? JSON.parse(result.grid_parameters) : null;
    }
    return result;
  }

  static findByUserId(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM optimization_configs WHERE user_id = ? ORDER BY created_at DESC');
    const results = stmt.all(userId);
    return results.map(r => ({
      ...r,
      load_data: JSON.parse(r.load_data),
      tariff_data: JSON.parse(r.tariff_data),
      pv_parameters: r.pv_parameters ? JSON.parse(r.pv_parameters) : null,
      battery_parameters: r.battery_parameters ? JSON.parse(r.battery_parameters) : null,
      grid_parameters: r.grid_parameters ? JSON.parse(r.grid_parameters) : null
    }));
  }

  static findBySiteId(siteId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM optimization_configs WHERE site_id = ? ORDER BY created_at DESC');
    const results = stmt.all(siteId);
    return results.map(r => ({
      ...r,
      load_data: JSON.parse(r.load_data),
      tariff_data: JSON.parse(r.tariff_data),
      pv_parameters: r.pv_parameters ? JSON.parse(r.pv_parameters) : null,
      battery_parameters: r.battery_parameters ? JSON.parse(r.battery_parameters) : null,
      grid_parameters: r.grid_parameters ? JSON.parse(r.grid_parameters) : null
    }));
  }

  static create(config) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO optimization_configs (
        id, user_id, site_id, load_profile_id, planning_recommendation_id,
        load_data, tariff_data, pv_parameters, battery_parameters, 
        grid_parameters, objective
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      config.id,
      config.user_id,
      config.site_id || null,
      config.load_profile_id || null,
      config.planning_recommendation_id || null,
      JSON.stringify(config.load_data),
      JSON.stringify(config.tariff_data),
      config.pv_parameters ? JSON.stringify(config.pv_parameters) : null,
      config.battery_parameters ? JSON.stringify(config.battery_parameters) : null,
      config.grid_parameters ? JSON.stringify(config.grid_parameters) : null,
      config.objective || 'combination'
    );
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.load_data !== undefined) {
      fields.push('load_data = ?');
      values.push(JSON.stringify(updates.load_data));
    }
    if (updates.tariff_data !== undefined) {
      fields.push('tariff_data = ?');
      values.push(JSON.stringify(updates.tariff_data));
    }
    if (updates.pv_parameters !== undefined) {
      fields.push('pv_parameters = ?');
      values.push(updates.pv_parameters ? JSON.stringify(updates.pv_parameters) : null);
    }
    if (updates.battery_parameters !== undefined) {
      fields.push('battery_parameters = ?');
      values.push(updates.battery_parameters ? JSON.stringify(updates.battery_parameters) : null);
    }
    if (updates.grid_parameters !== undefined) {
      fields.push('grid_parameters = ?');
      values.push(updates.grid_parameters ? JSON.stringify(updates.grid_parameters) : null);
    }
    if (updates.objective !== undefined) {
      fields.push('objective = ?');
      values.push(updates.objective);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE optimization_configs 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    return stmt.run(...values);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM optimization_configs WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = OptimizationConfigModel;

