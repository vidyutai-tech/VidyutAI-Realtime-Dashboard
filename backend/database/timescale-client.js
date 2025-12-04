const { Pool } = require('pg');

class TimescaleClient {
  constructor() {
    this.pool = null;
    this.enabled = process.env.USE_TIMESCALE === 'true';
    
    if (this.enabled) {
      this.pool = new Pool({
        host: process.env.TIMESCALE_HOST || 'localhost',
        port: process.env.TIMESCALE_PORT || 5432,
        database: process.env.TIMESCALE_DB || 'vidyutai',
        user: process.env.TIMESCALE_USER || 'postgres',
        password: process.env.TIMESCALE_PASSWORD || 'vidyutai_password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        console.error('❌ TimescaleDB pool error:', err);
      });

      this.testConnection();
    }
  }

  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW()');
      console.log('✅ TimescaleDB connected:', result.rows[0].now);
    } catch (err) {
      console.error('❌ TimescaleDB connection failed:', err.message);
    }
  }

  async query(text, params) {
    if (!this.enabled || !this.pool) return null;
    
    try {
      const res = await this.pool.query(text, params);
      return res;
    } catch (err) {
      console.error('TimescaleDB query error:', err);
      throw err;
    }
  }

  async insertMetrics(metrics) {
    if (!this.enabled || !this.pool) return;

    const values = metrics.map(m => [
      m.timestamp || new Date(),
      m.site_id,
      m.asset_id || null,
      m.metric_type,
      m.metric_value,
      m.unit || null,
      JSON.stringify(m.tags || {}),
      JSON.stringify(m.metadata || {})
    ]);

    const query = `
      INSERT INTO timeseries_data 
        (time, site_id, asset_id, metric_type, metric_value, unit, tags, metadata)
      SELECT * FROM UNNEST($1::timestamptz[], $2::text[], $3::text[], 
                          $4::text[], $5::double precision[], $6::text[], 
                          $7::jsonb[], $8::jsonb[])
    `;

    const transposed = [
      values.map(v => v[0]),
      values.map(v => v[1]),
      values.map(v => v[2]),
      values.map(v => v[3]),
      values.map(v => v[4]),
      values.map(v => v[5]),
      values.map(v => v[6]),
      values.map(v => v[7])
    ];

    return this.query(query, transposed);
  }

  async getLatestMetrics(siteId, metricTypes = []) {
    if (!this.enabled || !this.pool) return null;

    const typeFilter = metricTypes.length > 0 
      ? 'AND metric_type = ANY($2)' 
      : '';
    
    const query = `
      SELECT DISTINCT ON (metric_type)
        time,
        metric_type,
        metric_value,
        unit
      FROM timeseries_data
      WHERE site_id = $1 ${typeFilter}
      ORDER BY metric_type, time DESC
    `;

    const params = metricTypes.length > 0 ? [siteId, metricTypes] : [siteId];
    const result = await this.query(query, params);
    
    if (!result) return null;

    return result.rows.reduce((acc, row) => {
      acc[row.metric_type] = {
        value: row.metric_value,
        unit: row.unit,
        timestamp: row.time
      };
      return acc;
    }, {});
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = new TimescaleClient();

