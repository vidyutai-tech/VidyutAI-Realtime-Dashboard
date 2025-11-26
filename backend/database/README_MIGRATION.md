# Database Migration Guide

## Overview
This migration script ensures all wizard-related tables are created with the correct schema.

## Tables Created/Updated
1. **user_profiles** - Stores user site type and workflow preferences
2. **load_profiles** - Stores appliance data and load calculations
3. **planning_recommendations** - Stores planning wizard recommendations
4. **optimization_configs** - Stores optimization setup configurations

## Running Migration

### Automatic (Recommended)
The migration runs automatically when the backend server starts via `ensureInitialized()` in `db.js`.

### Manual
```bash
cd backend/database
node migrate.js
```

## Schema Changes
- **load_profiles**: Updated from old schema (site_type, appliances_data) to new schema (site_id, category_totals, appliances)
- All tables now use consistent naming and structure

## Troubleshooting
If you encounter "table has no column" errors:
1. Stop the backend server
2. Run `node backend/database/migrate.js` manually
3. Restart the backend server

