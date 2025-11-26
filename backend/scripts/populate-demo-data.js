#!/usr/bin/env node

/**
 * Demo Data Population Script
 * Populates SQLite database with realistic demo data for presentation
 * 
 * Usage: node backend/scripts/populate-demo-data.js
 */

const { getDatabase, ensureInitialized } = require('../database/db');

// Simple UUID generator (or use crypto.randomUUID() in Node 14.17+)
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function populateDemoData() {
  console.log('🎬 Populating demo data...');
  
  ensureInitialized();
  const db = getDatabase();
  
  // Clear existing data (optional - comment out to keep existing data)
  console.log('🧹 Cleaning existing demo data...');
  db.prepare('DELETE FROM timeseries_data').run();
  db.prepare('DELETE FROM alerts WHERE severity != ?').run('critical');
  db.prepare('UPDATE assets SET health_score = ? WHERE health_score < ?').run(100, 85);
  
  // Generate comprehensive timeseries data for last 7 days
  console.log('📊 Generating 7 days of timeseries data...');
  const insertStmt = db.prepare(`
    INSERT INTO timeseries_data (site_id, asset_id, timestamp, metric_type, metric_value, unit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const now = new Date();
  const daysBack = 7;
  const intervalMinutes = 5; // 5-minute intervals
  const totalPoints = (daysBack * 24 * 60) / intervalMinutes; // ~2016 points
  
  const insertMany = db.transaction(() => {
    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalMinutes * 60 * 1000);
      const hour = timestamp.getHours();
      
      // Time-of-day patterns
      const solarMultiplier = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
      const loadMultiplier = 0.5 + 0.5 * Math.sin((hour - 12) * Math.PI / 12);
      
      // Add some realistic variation
      const dayVariation = 1 + (Math.sin(i / 100) * 0.2); // Weekly patterns
      
      const metrics = [
        { type: 'pv_generation', value: (500 * solarMultiplier * dayVariation) + (Math.random() * 200), unit: 'kW' },
        { type: 'net_load', value: (400 * loadMultiplier * dayVariation) + (Math.random() * 150), unit: 'kW' },
        { type: 'battery_discharge', value: Math.max(0, (50 + Math.random() * 100) * (1 - solarMultiplier)), unit: 'kW' },
        { type: 'grid_draw', value: Math.max(0, (100 + Math.random() * 150) * loadMultiplier), unit: 'kW' },
        { type: 'soc', value: Math.min(100, Math.max(20, 70 + (Math.random() * 20) - (i * 0.01))), unit: '%' },
        { type: 'voltage', value: 415 + (Math.random() * 15 - 7.5), unit: 'V' },
        { type: 'current', value: 120 + (Math.random() * 30 - 15), unit: 'A' },
        { type: 'frequency', value: 50 + (Math.random() * 0.3 - 0.15), unit: 'Hz' }
      ];
      
      metrics.forEach(metric => {
        insertStmt.run(
          'site-1',
          null,
          timestamp.toISOString(),
          metric.type,
          parseFloat(metric.value.toFixed(2)),
          metric.unit
        );
      });
    }
  });
  
  insertMany();
  console.log(`✅ Generated ${totalPoints} data points (${daysBack} days)`);
  
  // Add some realistic alerts
  console.log('🚨 Generating demo alerts...');
  const alertStmt = db.prepare(`
    INSERT INTO alerts (id, site_id, asset_id, severity, type, title, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const alerts = [
    {
      siteId: 'site-1',
      assetId: null,
      severity: 'high',
      type: 'performance',
      title: 'Battery SOC Below Optimal',
      message: 'Battery state of charge is at 45%. Consider charging during off-peak hours.',
      status: 'active'
    },
    {
      siteId: 'site-1',
      assetId: null,
      severity: 'medium',
      type: 'efficiency',
      title: 'Grid Import Increased',
      message: 'Grid import has increased by 15% compared to last week. Review solar generation.',
      status: 'active'
    },
    {
      siteId: 'site-1',
      assetId: null,
      severity: 'low',
      type: 'maintenance',
      title: 'Scheduled Maintenance Reminder',
      message: 'Quarterly maintenance due in 5 days for Solar Panel Array 1.',
      status: 'active'
    }
  ];
  
  alerts.forEach(alert => {
    alertStmt.run(
      generateId(),
      alert.siteId,
      alert.assetId,
      alert.severity,
      alert.type,
      alert.title,
      alert.message,
      alert.status,
      new Date().toISOString()
    );
  });
  
  console.log(`✅ Created ${alerts.length} demo alerts`);
  
  // Update site statistics
  console.log('📈 Updating site statistics...');
  const statsStmt = db.prepare(`
    UPDATE sites 
    SET energy_saved = ?, cost_reduced = ?, updated_at = ?
    WHERE id = ?
  `);
  
  // Calculate realistic savings
  const energySaved = (totalPoints * 50 * 0.3).toFixed(2); // 30% savings
  const costReduced = (totalPoints * 10 * 0.25).toFixed(2); // 25% cost reduction
  
  statsStmt.run(energySaved, costReduced, new Date().toISOString(), 'site-1');
  console.log(`✅ Updated site statistics: ${energySaved} kWh saved, ₹${costReduced} cost reduced`);
  
  console.log('\n✨ Demo data population complete!');
  console.log('\n📋 Summary:');
  console.log(`   - ${totalPoints} timeseries data points (${daysBack} days)`);
  console.log(`   - ${alerts.length} active alerts`);
  console.log(`   - Site statistics updated`);
  console.log('\n🚀 Start the backend server to begin real-time simulation!');
}

// Run if called directly
if (require.main === module) {
  try {
    populateDemoData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating demo data:', error);
    process.exit(1);
  }
}

module.exports = { populateDemoData };

