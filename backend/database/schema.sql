-- VidyutAI Database Schema
-- SQLite Database Schema for the entire application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'viewer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    capacity REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('online', 'offline', 'maintenance')),
    energy_saved REAL DEFAULT 0,
    cost_reduced REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('solar', 'battery', 'inverter', 'meter', 'transformer', 'ev_charger', 'motor')),
    status TEXT NOT NULL CHECK(status IN ('online', 'offline', 'maintenance', 'warning', 'error')),
    health_score REAL DEFAULT 100,
    manufacturer TEXT,
    model TEXT,
    capacity REAL,
    installed_date DATE,
    last_maintenance DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    asset_id TEXT,
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'acknowledged', 'resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- Timeseries data table (for metrics like voltage, current, power, etc.)
CREATE TABLE IF NOT EXISTS timeseries_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    asset_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metric_type TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Create index for faster timeseries queries
CREATE INDEX IF NOT EXISTS idx_timeseries_site_time ON timeseries_data(site_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_asset_time ON timeseries_data(asset_id, timestamp DESC);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    asset_id TEXT,
    prediction_type TEXT NOT NULL,
    predicted_value REAL,
    confidence REAL,
    prediction_data TEXT, -- JSON string for complex predictions
    prediction_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    description TEXT,
    performed_by TEXT,
    performed_at DATETIME NOT NULL,
    next_scheduled DATE,
    cost REAL,
    status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Energy flow data (for power flow visualization)
CREATE TABLE IF NOT EXISTS energy_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    from_component TEXT NOT NULL,
    to_component TEXT NOT NULL,
    power_kw REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- RL Suggestions table (for reinforcement learning optimization suggestions)
CREATE TABLE IF NOT EXISTS rl_suggestions (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    suggestion_type TEXT NOT NULL,
    current_config TEXT, -- JSON string
    suggested_config TEXT, -- JSON string
    expected_savings REAL,
    confidence REAL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    applied_at DATETIME,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Simulation results table
CREATE TABLE IF NOT EXISTS simulation_results (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    simulation_type TEXT NOT NULL,
    parameters TEXT NOT NULL, -- JSON string
    results TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Chatbot conversations table (for AI assistant history)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    site_id TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Profile table (extends users with site type and preferences)
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    site_type TEXT CHECK(site_type IN ('home', 'college', 'small_industry', 'large_industry', 'power_plant', 'other')),
    workflow_preference TEXT CHECK(workflow_preference IN ('plan_new', 'optimize_existing')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Load Profile table (for appliance and load data)
CREATE TABLE IF NOT EXISTS load_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    site_id TEXT,
    name TEXT NOT NULL,
    category_totals TEXT NOT NULL, -- JSON string: {lighting: {...}, fans: {...}, etc.}
    total_daily_energy_kwh REAL NOT NULL,
    appliances TEXT NOT NULL, -- JSON string: array of appliance objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

-- Planning Recommendation table (output from planning wizard)
CREATE TABLE IF NOT EXISTS planning_recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    site_id TEXT,
    load_profile_id TEXT NOT NULL,
    preferred_sources TEXT NOT NULL, -- JSON string: array of sources
    primary_goal TEXT CHECK(primary_goal IN ('savings', 'self_sustainability', 'reliability', 'carbon_reduction')),
    allow_diesel BOOLEAN DEFAULT 0,
    technical_sizing TEXT NOT NULL, -- JSON string
    economic_analysis TEXT NOT NULL, -- JSON string
    emissions_analysis TEXT NOT NULL, -- JSON string
    scenario_link TEXT, -- Link to optimization scenario
    status TEXT CHECK(status IN ('draft', 'saved', 'applied')) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    FOREIGN KEY (load_profile_id) REFERENCES load_profiles(id) ON DELETE CASCADE
);

-- Optimization Config table (for optimization setup)
CREATE TABLE IF NOT EXISTS optimization_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    site_id TEXT,
    load_profile_id TEXT,
    planning_recommendation_id TEXT,
    load_data TEXT NOT NULL, -- JSON string
    tariff_data TEXT NOT NULL, -- JSON string
    pv_parameters TEXT, -- JSON string
    battery_parameters TEXT, -- JSON string
    grid_parameters TEXT, -- JSON string
    objective TEXT CHECK(objective IN ('cost', 'co2', 'combination')) DEFAULT 'combination',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    FOREIGN KEY (load_profile_id) REFERENCES load_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (planning_recommendation_id) REFERENCES planning_recommendations(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_load_profiles_user_id ON load_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_recommendations_user_id ON planning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_configs_user_id ON optimization_configs(user_id);

