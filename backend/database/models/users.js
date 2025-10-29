const { getDatabase } = require('../db');

class UserModel {
  static findByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static getAll() {
    const db = getDatabase();
    return db.prepare('SELECT id, email, name, role, created_at FROM users').all();
  }

  static create(user) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(user.id, user.email, user.password, user.name, user.role);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = db.prepare(`
      UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(...values, id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
}

module.exports = UserModel;

