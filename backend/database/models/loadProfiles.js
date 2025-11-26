const { getDatabase } = require('../db');

class LoadProfileModel {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM load_profiles WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM load_profiles WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  static findBySiteId(siteId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM load_profiles WHERE site_id = ? ORDER BY created_at DESC');
    return stmt.all(siteId);
  }

  static create(profile) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO load_profiles (id, user_id, site_id, name, category_totals, total_daily_energy_kwh, appliances)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      profile.id,
      profile.user_id,
      profile.site_id || null,
      profile.name,
      JSON.stringify(profile.category_totals),
      profile.total_daily_energy_kwh,
      JSON.stringify(profile.appliances)
    );
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category_totals !== undefined) {
      fields.push('category_totals = ?');
      values.push(JSON.stringify(updates.category_totals));
    }
    if (updates.total_daily_energy_kwh !== undefined) {
      fields.push('total_daily_energy_kwh = ?');
      values.push(updates.total_daily_energy_kwh);
    }
    if (updates.appliances !== undefined) {
      fields.push('appliances = ?');
      values.push(JSON.stringify(updates.appliances));
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE load_profiles 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    return stmt.run(...values);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM load_profiles WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = LoadProfileModel;

