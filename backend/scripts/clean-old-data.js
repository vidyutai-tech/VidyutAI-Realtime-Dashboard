#!/usr/bin/env node

/**
 * Clean Old Data Script
 * Removes old timeseries data to keep database size manageable
 * 
 * Usage: node backend/scripts/clean-old-data.js [hoursToKeep]
 * Default: Keeps last 48 hours
 */

const { getDatabase, ensureInitialized } = require('../database/db');

function cleanOldData(hoursToKeep = 48) {
  console.log(`🧹 Cleaning timeseries data older than ${hoursToKeep} hours...`);
  
  ensureInitialized();
  const db = getDatabase();
  
  const cutoff = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000);
  const cutoffISO = cutoff.toISOString();
  
  // Get count before deletion
  const countBefore = db.prepare(`
    SELECT COUNT(*) as count FROM timeseries_data WHERE timestamp < ?
  `).get(cutoffISO);
  
  // Delete old data
  const result = db.prepare(`
    DELETE FROM timeseries_data 
    WHERE timestamp < ?
  `).run(cutoffISO);
  
  // Get count after deletion
  const countAfter = db.prepare('SELECT COUNT(*) as count FROM timeseries_data').get();
  
  console.log(`✅ Deleted ${result.changes} old records`);
  console.log(`📊 Remaining records: ${countAfter.count}`);
  console.log(`📅 Kept data from: ${cutoff.toLocaleString()}`);
  
  return {
    deleted: result.changes,
    remaining: countAfter.count,
    cutoff: cutoffISO
  };
}

// Run if called directly
if (require.main === module) {
  const hoursToKeep = process.argv[2] ? parseInt(process.argv[2]) : 48;
  
  try {
    cleanOldData(hoursToKeep);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    process.exit(1);
  }
}

module.exports = { cleanOldData };

