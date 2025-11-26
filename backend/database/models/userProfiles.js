const { getDatabase } = require('../db');

class UserProfileModel {
  static findByUserId(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    return stmt.get(userId);
  }

  static create(profile) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_profiles (id, user_id, site_type, workflow_preference)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
      profile.id,
      profile.user_id,
      profile.site_type || null,
      profile.workflow_preference || null
    );
  }

  static update(userId, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    if (updates.site_type !== undefined) {
      fields.push('site_type = ?');
      values.push(updates.site_type);
    }
    if (updates.workflow_preference !== undefined) {
      fields.push('workflow_preference = ?');
      values.push(updates.workflow_preference);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`
      UPDATE user_profiles 
      SET ${fields.join(', ')}
      WHERE user_id = ?
    `);
    return stmt.run(...values);
  }

  static upsert(profile) {
    const existing = this.findByUserId(profile.user_id);
    if (existing) {
      return this.update(profile.user_id, profile);
    } else {
      return this.create(profile);
    }
  }
}

module.exports = UserProfileModel;

