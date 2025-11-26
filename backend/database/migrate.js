// Migration script to update database schema for wizard tables
const { getDatabase } = require('./db');

function migrate() {
  console.log('🔄 Starting database migration...');
  
  const db = getDatabase();
  db.pragma('foreign_keys = OFF'); // Disable foreign keys during migration
  
  try {
    // Check if old load_profiles table exists with wrong schema
    const oldTableInfo = db.prepare("PRAGMA table_info(load_profiles)").all();
    const hasOldSchema = oldTableInfo.some(col => col.name === 'site_type' || col.name === 'appliances_data');
    
    if (hasOldSchema) {
      console.log('📋 Detected old load_profiles schema. Migrating...');
      
      // Backup existing data
      const oldData = db.prepare('SELECT * FROM load_profiles').all();
      console.log(`📦 Backing up ${oldData.length} load profile records...`);
      
      // Drop old table
      db.exec('DROP TABLE IF EXISTS load_profiles');
      console.log('✅ Dropped old load_profiles table');
    }
    
    // Check and create/update user_profiles table
    const userProfilesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'").get();
    if (!userProfilesExists) {
      console.log('📋 Creating user_profiles table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          site_type TEXT CHECK(site_type IN ('home', 'college', 'small_industry', 'large_industry', 'power_plant', 'other')),
          workflow_preference TEXT CHECK(workflow_preference IN ('plan_new', 'optimize_existing')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)');
      console.log('✅ Created user_profiles table');
    }
    
    // Create load_profiles table with correct schema
    const loadProfilesInfo = db.prepare("PRAGMA table_info(load_profiles)").all();
    const hasCorrectSchema = loadProfilesInfo.some(col => col.name === 'site_id' && col.name === 'category_totals');
    
    if (!hasCorrectSchema || loadProfilesInfo.length === 0) {
      console.log('📋 Creating/updating load_profiles table with correct schema...');
      // Drop if exists (will recreate)
      db.exec('DROP TABLE IF EXISTS load_profiles');
      db.exec(`
        CREATE TABLE load_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          site_id TEXT,
          name TEXT NOT NULL,
          category_totals TEXT NOT NULL,
          total_daily_energy_kwh REAL NOT NULL,
          appliances TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_load_profiles_user_id ON load_profiles(user_id)');
      console.log('✅ Created/updated load_profiles table');
    } else {
      console.log('✅ load_profiles table already has correct schema');
    }
    
    // Create/update planning_recommendations table
    const planningExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='planning_recommendations'").get();
    
    if (!planningExists) {
      console.log('📋 Creating planning_recommendations table...');
      db.exec(`
        CREATE TABLE planning_recommendations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          site_id TEXT,
          load_profile_id TEXT NOT NULL,
          preferred_sources TEXT NOT NULL,
          primary_goal TEXT CHECK(primary_goal IN ('savings', 'self_sustainability', 'reliability', 'carbon_reduction')),
          allow_diesel BOOLEAN DEFAULT 0,
          technical_sizing TEXT NOT NULL,
          economic_analysis TEXT NOT NULL,
          emissions_analysis TEXT NOT NULL,
          scenario_link TEXT,
          status TEXT CHECK(status IN ('draft', 'saved', 'applied')) DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
          FOREIGN KEY (load_profile_id) REFERENCES load_profiles(id) ON DELETE CASCADE
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_planning_recommendations_user_id ON planning_recommendations(user_id)');
      console.log('✅ Created planning_recommendations table');
    } else {
      // Check if table has correct schema
      const planningColumns = db.prepare("PRAGMA table_info(planning_recommendations)").all();
      const columnNames = planningColumns.map(col => col.name);
      const requiredColumns = ['id', 'user_id', 'site_id', 'load_profile_id', 'preferred_sources', 'primary_goal', 'allow_diesel', 'technical_sizing', 'economic_analysis', 'emissions_analysis', 'status', 'created_at', 'updated_at'];
      const hasCorrectSchema = requiredColumns.every(col => columnNames.includes(col));
      
      if (!hasCorrectSchema) {
        console.log('📋 planning_recommendations table has old schema. Migrating to new schema...');
        try {
          // Backup existing data (if any)
          const oldData = db.prepare('SELECT * FROM planning_recommendations').all();
          console.log(`📦 Backing up ${oldData.length} planning recommendation records...`);
          
          // Drop old table
          db.exec('DROP TABLE IF EXISTS planning_recommendations');
          
          // Recreate with correct schema
          db.exec(`
            CREATE TABLE planning_recommendations (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              site_id TEXT,
              load_profile_id TEXT NOT NULL,
              preferred_sources TEXT NOT NULL,
              primary_goal TEXT CHECK(primary_goal IN ('savings', 'self_sustainability', 'reliability', 'carbon_reduction')),
              allow_diesel BOOLEAN DEFAULT 0,
              technical_sizing TEXT NOT NULL,
              economic_analysis TEXT NOT NULL,
              emissions_analysis TEXT NOT NULL,
              scenario_link TEXT,
              status TEXT CHECK(status IN ('draft', 'saved', 'applied')) DEFAULT 'draft',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
              FOREIGN KEY (load_profile_id) REFERENCES load_profiles(id) ON DELETE CASCADE
            )
          `);
          db.exec('CREATE INDEX IF NOT EXISTS idx_planning_recommendations_user_id ON planning_recommendations(user_id)');
          
          // Note: We can't restore old data because the schema is completely different
          // Old data would have different column names (scenario_name, technical_analysis vs technical_sizing, etc.)
          if (oldData.length > 0) {
            console.log(`⚠️  Note: ${oldData.length} old planning recommendation records were not migrated due to schema mismatch.`);
            console.log('   Old schema had: scenario_name, technical_analysis');
            console.log('   New schema has: preferred_sources, primary_goal, technical_sizing, etc.');
          }
          
          console.log('✅ Recreated planning_recommendations table with correct schema');
        } catch (error) {
          console.error('❌ Error migrating planning_recommendations table:', error);
          throw error;
        }
      } else {
        console.log('✅ planning_recommendations table already has correct schema');
      }
    }
    
    // Create optimization_configs table
    const optimizationExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='optimization_configs'").get();
    if (!optimizationExists) {
      console.log('📋 Creating optimization_configs table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS optimization_configs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          site_id TEXT,
          load_profile_id TEXT,
          planning_recommendation_id TEXT,
          load_data TEXT NOT NULL,
          tariff_data TEXT NOT NULL,
          pv_parameters TEXT,
          battery_parameters TEXT,
          grid_parameters TEXT,
          objective TEXT CHECK(objective IN ('cost', 'co2', 'combination')) DEFAULT 'combination',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
          FOREIGN KEY (load_profile_id) REFERENCES load_profiles(id) ON DELETE SET NULL,
          FOREIGN KEY (planning_recommendation_id) REFERENCES planning_recommendations(id) ON DELETE SET NULL
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_optimization_configs_user_id ON optimization_configs(user_id)');
      console.log('✅ Created optimization_configs table');
    }
    
    db.pragma('foreign_keys = ON'); // Re-enable foreign keys
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
  // Note: Don't close the database connection as it's managed by db.js
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

