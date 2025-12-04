const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path - Use in-memory on Vercel (read-only filesystem)
const DB_PATH = process.env.VERCEL ? ':memory:' : path.join(__dirname, 'vidyutai.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

// Initialize database connection
let db;

function initializeDatabase() {
  try {
    // Create database connection
    db = new Database(DB_PATH, { verbose: console.log });
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log('✅ Database connection established');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

function createTables() {
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    throw error;
  }
}

function seedDatabase() {
  try {
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seed);
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

function insertTimeseriesData() {
  try {
    // Generate sample timeseries data for the last 24 hours
    const insertStmt = db.prepare(`
      INSERT INTO timeseries_data (site_id, asset_id, timestamp, metric_type, metric_value, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const metrics = [
      { type: 'voltage', base: 415, variance: 15, unit: 'V' },
      { type: 'current', base: 120, variance: 30, unit: 'A' },
      { type: 'frequency', base: 50, variance: 0.3, unit: 'Hz' },
      { type: 'pv_generation', base: 500, variance: 300, unit: 'kW' },
      { type: 'net_load', base: 400, variance: 200, unit: 'kW' },
      { type: 'battery_discharge', base: 50, variance: 100, unit: 'kW' },
      { type: 'grid_draw', base: 100, variance: 150, unit: 'kW' },
      { type: 'soc', base: 70, variance: 20, unit: '%' }
    ];

    const insertMany = db.transaction(() => {
      // Generate data points for last 24 hours (10-minute intervals = 144 points)
      for (let i = 144; i >= 0; i--) {
        const timestamp = new Date(now - i * 10 * 60 * 1000);
        
        metrics.forEach(metric => {
          const value = metric.base + (Math.random() * metric.variance * 2 - metric.variance);
          insertStmt.run('site-1', null, timestamp.toISOString(), metric.type, value, metric.unit);
        });
      }
    });

    insertMany();
    console.log('✅ Timeseries data inserted successfully');
  } catch (error) {
    console.error('❌ Failed to insert timeseries data:', error);
    throw error;
  }
}

function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    initializeDatabase();
    createTables();
    seedDatabase();
    insertTimeseriesData();
    
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

function getDatabase() {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

// Check if a table exists
function tableExists(tableName) {
  const database = getDatabase();
  const row = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
  return !!row;
}

// Determine if the core schema has been created
function isInitialized() {
  try {
    // Check for core tables and new wizard tables
    return tableExists('users') && 
           tableExists('sites') && 
           tableExists('assets') &&
           tableExists('load_profiles') &&
           tableExists('user_profiles') &&
           tableExists('planning_recommendations') &&
           tableExists('optimization_configs');
  } catch (e) {
    return false;
  }
}

// Ensure database is initialized; if not, run full setup once
function ensureInitialized() {
  initializeDatabase();
  if (!isInitialized()) {
    console.log('🗄️ Database not initialized. Running setup...');
    createTables();
    seedDatabase();
    insertTimeseriesData();
    console.log('🗄️ Database initialization finished.');
  } else {
    // Even if core tables exist, ensure all tables from schema exist
    // This handles cases where new tables were added to the schema
    console.log('🗄️ Core tables exist. Running migration to ensure all tables are up to date...');
    try {
      // Run migration to fix any schema mismatches
      const { migrate } = require('./migrate');
      migrate();
      // Also run schema to ensure everything is in sync
      createTables(); // This uses CREATE TABLE IF NOT EXISTS, so it's safe
      console.log('🗄️ All schema tables verified and migrated.');
    } catch (error) {
      console.error('⚠️ Warning: Error during migration:', error.message);
      // Fallback: try to create tables anyway
      try {
        createTables();
        console.log('🗄️ Fallback: Schema tables created.');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
      }
    }
  }
}

function closeDatabase() {
  if (db) {
    db.close();
    console.log('✅ Database connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  setupDatabase,
  getDatabase,
  closeDatabase,
  initializeDatabase,
  ensureInitialized,
  isInitialized
};

