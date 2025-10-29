#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the SQLite database with schema and seed data.
 * Run this script once before starting the application for the first time.
 * 
 * Usage: node database/init-db.js
 */

const { setupDatabase } = require('./db');

console.log('🚀 VidyutAI Database Initialization');
console.log('====================================\n');

setupDatabase();

console.log('\n====================================');
console.log('✅ Database initialization complete!');
console.log('📁 Database file: backend/database/vidyutai.db');
console.log('\nYou can now start the backend server.');

