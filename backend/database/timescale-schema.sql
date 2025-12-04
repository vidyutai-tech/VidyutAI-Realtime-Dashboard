-- TimescaleDB Schema for VidyutAI

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Time-series data table
CREATE TABLE IF NOT EXISTS timeseries_data (
    time TIMESTAMPTZ NOT NULL,
    site_id TEXT NOT NULL,
    asset_id TEXT,
    metric_type TEXT NOT NULL,
    metric_value DOUBLE PRECISION,
    unit TEXT,
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable
SELECT create_hypertable('timeseries_data', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_timeseries_site_time 
    ON timeseries_data (site_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_metric_type 
    ON timeseries_data (metric_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_timeseries_tags 
    ON timeseries_data USING GIN (tags);

-- Retention policy (keep 90 days)
SELECT add_retention_policy('timeseries_data', INTERVAL '90 days', if_not_exists => TRUE);

-- Continuous aggregate (5-minute averages)
CREATE MATERIALIZED VIEW IF NOT EXISTS timeseries_5min
WITH (timescaledb.continuous) AS
SELECT time_bucket('5 minutes', time) AS bucket,
       site_id,
       metric_type,
       AVG(metric_value) as avg_value,
       MIN(metric_value) as min_value,
       MAX(metric_value) as max_value,
       COUNT(*) as count
FROM timeseries_data
GROUP BY bucket, site_id, metric_type;

-- Refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('timeseries_5min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE);

