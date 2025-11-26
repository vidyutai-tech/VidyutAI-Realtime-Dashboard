const { getDatabase } = require('../db');

class PlanningRecommendationModel {
  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM planning_recommendations WHERE id = ?');
    const result = stmt.get(id);
    if (result) {
      result.preferred_sources = JSON.parse(result.preferred_sources);
      result.technical_sizing = JSON.parse(result.technical_sizing);
      result.economic_analysis = JSON.parse(result.economic_analysis);
      result.emissions_analysis = JSON.parse(result.emissions_analysis);
    }
    return result;
  }

  static findByUserId(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM planning_recommendations WHERE user_id = ? ORDER BY created_at DESC');
    const results = stmt.all(userId);
    return results.map(r => ({
      ...r,
      preferred_sources: JSON.parse(r.preferred_sources),
      technical_sizing: JSON.parse(r.technical_sizing),
      economic_analysis: JSON.parse(r.economic_analysis),
      emissions_analysis: JSON.parse(r.emissions_analysis)
    }));
  }

  static findBySiteId(siteId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM planning_recommendations WHERE site_id = ? ORDER BY created_at DESC');
    const results = stmt.all(siteId);
    return results.map(r => ({
      ...r,
      preferred_sources: JSON.parse(r.preferred_sources),
      technical_sizing: JSON.parse(r.technical_sizing),
      economic_analysis: JSON.parse(r.economic_analysis),
      emissions_analysis: JSON.parse(r.emissions_analysis)
    }));
  }

  static findByLoadProfileId(loadProfileId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM planning_recommendations WHERE load_profile_id = ? ORDER BY created_at DESC');
    const results = stmt.all(loadProfileId);
    return results.map(r => ({
      ...r,
      preferred_sources: JSON.parse(r.preferred_sources),
      technical_sizing: JSON.parse(r.technical_sizing),
      economic_analysis: JSON.parse(r.economic_analysis),
      emissions_analysis: JSON.parse(r.emissions_analysis)
    }));
  }

  static create(recommendation) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO planning_recommendations (
        id, user_id, site_id, load_profile_id, preferred_sources, primary_goal, 
        allow_diesel, technical_sizing, economic_analysis, emissions_analysis, 
        scenario_link, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      recommendation.id,
      recommendation.user_id,
      recommendation.site_id || null,
      recommendation.load_profile_id,
      JSON.stringify(recommendation.preferred_sources),
      recommendation.primary_goal,
      recommendation.allow_diesel ? 1 : 0,
      JSON.stringify(recommendation.technical_sizing),
      JSON.stringify(recommendation.economic_analysis),
      JSON.stringify(recommendation.emissions_analysis),
      recommendation.scenario_link || null,
      recommendation.status || 'draft'
    );
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.preferred_sources !== undefined) {
      fields.push('preferred_sources = ?');
      values.push(JSON.stringify(updates.preferred_sources));
    }
    if (updates.primary_goal !== undefined) {
      fields.push('primary_goal = ?');
      values.push(updates.primary_goal);
    }
    if (updates.allow_diesel !== undefined) {
      fields.push('allow_diesel = ?');
      values.push(updates.allow_diesel ? 1 : 0);
    }
    if (updates.technical_sizing !== undefined) {
      fields.push('technical_sizing = ?');
      values.push(JSON.stringify(updates.technical_sizing));
    }
    if (updates.economic_analysis !== undefined) {
      fields.push('economic_analysis = ?');
      values.push(JSON.stringify(updates.economic_analysis));
    }
    if (updates.emissions_analysis !== undefined) {
      fields.push('emissions_analysis = ?');
      values.push(JSON.stringify(updates.emissions_analysis));
    }
    if (updates.scenario_link !== undefined) {
      fields.push('scenario_link = ?');
      values.push(updates.scenario_link);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE planning_recommendations 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    return stmt.run(...values);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM planning_recommendations WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = PlanningRecommendationModel;

