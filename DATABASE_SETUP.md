# VidyutAI Database Setup Guide

## 📊 Database Overview

The VidyutAI Realtime Dashboard now uses **SQLite** as the primary database for storing all application data. SQLite was chosen for its simplicity, zero configuration, and perfect suitability for development and small to medium-scale deployments.

## 🏗️ Database Architecture

### Technology Stack
- **Database**: SQLite 3
- **Node.js Driver**: `better-sqlite3` (synchronous, high-performance)
- **Python Driver**: Built-in `sqlite3` module

### Database File Location
```
backend/database/vidyutai.db
```

## 📋 Database Schema

The database contains the following tables:

### 1. **users** - User Authentication & Authorization
```sql
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)
- password (TEXT) - Plain text for development, hash with bcrypt in production
- name (TEXT)
- role (TEXT) - 'admin', 'operator', 'viewer'
- created_at (DATETIME)
- updated_at (DATETIME)
```

### 2. **sites** - Energy Management Sites
```sql
- id (TEXT, PRIMARY KEY)
- name (TEXT)
- location (TEXT)
- latitude (REAL)
- longitude (REAL)
- capacity (REAL) - kW
- status (TEXT) - 'online', 'offline', 'maintenance'
- energy_saved (REAL) - kWh
- cost_reduced (REAL) - INR
- created_at (DATETIME)
- updated_at (DATETIME)
```

### 3. **assets** - Physical Assets at Sites
```sql
- id (TEXT, PRIMARY KEY)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- name (TEXT)
- type (TEXT) - 'solar', 'battery', 'inverter', 'meter', 'transformer', 'ev_charger', 'motor'
- status (TEXT) - 'online', 'offline', 'maintenance', 'warning', 'error'
- health_score (REAL) - 0-100
- manufacturer (TEXT)
- model (TEXT)
- capacity (REAL)
- installed_date (DATE)
- last_maintenance (DATE)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### 4. **alerts** - System Alerts & Notifications
```sql
- id (TEXT, PRIMARY KEY)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- asset_id (TEXT, FOREIGN KEY -> assets.id, nullable)
- severity (TEXT) - 'critical', 'high', 'medium', 'low'
- type (TEXT)
- title (TEXT)
- message (TEXT)
- status (TEXT) - 'active', 'acknowledged', 'resolved'
- created_at (DATETIME)
- updated_at (DATETIME)
- resolved_at (DATETIME, nullable)
```

### 5. **timeseries_data** - Real-time Metrics
```sql
- id (INTEGER, PRIMARY KEY AUTOINCREMENT)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- asset_id (TEXT, FOREIGN KEY -> assets.id, nullable)
- timestamp (DATETIME)
- metric_type (TEXT) - 'voltage', 'current', 'frequency', 'pv_generation', etc.
- metric_value (REAL)
- unit (TEXT)
```

**Indexes:**
- `idx_timeseries_site_time` on (site_id, timestamp DESC)
- `idx_timeseries_asset_time` on (asset_id, timestamp DESC)

### 6. **predictions** - AI/ML Predictions
```sql
- id (TEXT, PRIMARY KEY)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- asset_id (TEXT, FOREIGN KEY -> assets.id, nullable)
- prediction_type (TEXT)
- predicted_value (REAL)
- confidence (REAL) - 0-1
- prediction_data (TEXT) - JSON string
- prediction_date (DATETIME)
- created_at (DATETIME)
```

### 7. **maintenance_records** - Maintenance History
```sql
- id (TEXT, PRIMARY KEY)
- asset_id (TEXT, FOREIGN KEY -> assets.id)
- maintenance_type (TEXT)
- description (TEXT)
- performed_by (TEXT)
- performed_at (DATETIME)
- next_scheduled (DATE)
- cost (REAL) - INR
- status (TEXT) - 'scheduled', 'completed', 'cancelled'
- created_at (DATETIME)
```

### 8. **energy_flows** - Power Flow Visualization Data
```sql
- id (INTEGER, PRIMARY KEY AUTOINCREMENT)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- timestamp (DATETIME)
- from_component (TEXT)
- to_component (TEXT)
- power_kw (REAL)
- is_active (BOOLEAN)
```

### 9. **rl_suggestions** - Reinforcement Learning Optimization Suggestions
```sql
- id (TEXT, PRIMARY KEY)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- suggestion_type (TEXT)
- current_config (TEXT) - JSON string
- suggested_config (TEXT) - JSON string
- expected_savings (REAL) - INR
- confidence (REAL) - 0-1
- status (TEXT) - 'pending', 'accepted', 'rejected', 'expired'
- created_at (DATETIME)
- expires_at (DATETIME)
- applied_at (DATETIME, nullable)
```

### 10. **simulation_results** - Scenario Simulation Results
```sql
- id (TEXT, PRIMARY KEY)
- site_id (TEXT, FOREIGN KEY -> sites.id)
- simulation_type (TEXT)
- parameters (TEXT) - JSON string
- results (TEXT) - JSON string
- created_at (DATETIME)
```

### 11. **chatbot_conversations** - AI Assistant Chat History
```sql
- id (INTEGER, PRIMARY KEY AUTOINCREMENT)
- user_id (TEXT, FOREIGN KEY -> users.id)
- site_id (TEXT, FOREIGN KEY -> sites.id, nullable)
- question (TEXT)
- answer (TEXT)
- created_at (DATETIME)
```

### 12. **system_settings** - Application Configuration
```sql
- key (TEXT, PRIMARY KEY)
- value (TEXT)
- description (TEXT)
- updated_at (DATETIME)
```

## 🚀 Quick Start

### Initialize the Database

**First-time setup:**
```bash
cd backend
npm run init-db
```

This command will:
1. Create `backend/database/vidyutai.db`
2. Create all tables with proper schema
3. Insert seed data (users, sites, assets, alerts)
4. Generate 24 hours of sample timeseries data

### Reset the Database

To reset the database to its initial state:
```bash
cd backend
rm database/vidyutai.db
npm run init-db
```

## 👥 Default Test Users

| Email | Password | Role |
|-------|----------|------|
| `admin@vidhyut.ai` | `password123` | admin |
| `operator@vidhyut.ai` | `password123` | operator |
| `viewer@vidhyut.ai` | `password123` | viewer |

## 🏭 Default Test Sites

| Site ID | Name | Location | Capacity | Status |
|---------|------|----------|----------|--------|
| `site-1` | IIT Gandhinagar Campus | Gandhinagar, Gujarat | 2500 kW | online |
| `site-2` | Naroda Industrial Estate | Ahmedabad, Gujarat | 1800 kW | online |
| `site-3` | Vadodara Solar Farm | Vadodara, Gujarat | 3200 kW | maintenance |

## 📝 Using the Database in Code

### Node.js Backend

**Importing Models:**
```javascript
const UserModel = require('./database/models/users');
const SiteModel = require('./database/models/sites');
const AssetModel = require('./database/models/assets');
const AlertModel = require('./database/models/alerts');
```

**Example Usage:**
```javascript
// Get all sites
const sites = SiteModel.getAll();

// Get single site
const site = SiteModel.findById('site-1');

// Create new site
SiteModel.create({
  id: 'site-4',
  name: 'New Solar Farm',
  location: 'Mumbai, Maharashtra',
  capacity: 5000,
  status: 'online'
});

// Update site
SiteModel.update('site-1', {
  status: 'maintenance'
});

// Get site timeseries data
const timeseries = SiteModel.getTimeseries('site-1', 'last_24h');
```

### Python AI Service

```python
import sqlite3

# Connect to database
conn = sqlite3.connect('../backend/database/vidyutai.db')
cursor = conn.cursor()

# Query data
cursor.execute('SELECT * FROM sites WHERE status = ?', ('online',))
sites = cursor.fetchall()

# Close connection
conn.close()
```

## 🛠️ Database Management

### Backup Database

```bash
cp backend/database/vidyutai.db backend/database/vidyutai-backup-$(date +%Y%m%d).db
```

### View Database Contents

Use SQLite browser or command line:
```bash
sqlite3 backend/database/vidyutai.db

# Common commands
.tables                    # List all tables
.schema users              # Show table schema
SELECT * FROM users;       # Query data
.quit                      # Exit
```

### Database Size

SQLite databases are single files. Current database with seed data is approximately:
- **Initial size**: ~50 KB
- **With 24h timeseries**: ~2-3 MB
- **Expected growth**: ~100 MB/month with real data

## 🔄 Migration to Production Database

When scaling to production, you can migrate to PostgreSQL or MySQL:

1. **Export data from SQLite:**
```bash
sqlite3 backend/database/vidyutai.db .dump > dump.sql
```

2. **Convert and import to PostgreSQL/MySQL:**
Use migration tools like `pgloader` or manual SQL conversion

3. **Update Node.js driver:**
   - Replace `better-sqlite3` with `pg` (PostgreSQL) or `mysql2` (MySQL)
   - Update database models to use async/await instead of sync calls

## 🔒 Security Considerations

### Development (Current)
- ✅ SQLite file with no network exposure
- ⚠️ Passwords stored in plain text
- ⚠️ No connection encryption needed (local file)

### Production (Recommended)
- ✅ Use bcrypt for password hashing
- ✅ Implement JWT token expiration
- ✅ Add database backup schedule
- ✅ Use environment variables for sensitive config
- ✅ Consider PostgreSQL/MySQL for concurrent users
- ✅ Implement connection pooling
- ✅ Enable SSL/TLS for database connections

## 📈 Performance Optimization

### Indexes
Already created:
- Timeseries data: Indexed on `(site_id, timestamp)` and `(asset_id, timestamp)`

### Query Optimization Tips
```javascript
// ✅ Good: Use indexed columns
SiteModel.getTimeseries('site-1', 'last_24h');

// ❌ Avoid: Full table scans without WHERE
SELECT * FROM timeseries_data;

// ✅ Better: Use time range filters
SELECT * FROM timeseries_data 
WHERE site_id = 'site-1' AND timestamp >= datetime('now', '-24 hours');
```

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### Database Integrity Check
```bash
sqlite3 backend/database/vidyutai.db "PRAGMA integrity_check;"
```

## 📚 Additional Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3/wiki)
- [Database Design Best Practices](https://www.sqlite.org/bestpractice.html)

## 🆘 Troubleshooting

### Issue: "Database is locked"
**Solution:** Only one process can write to SQLite at a time. Ensure no other processes are accessing the database.

### Issue: "Cannot find module './database/models/...'"
**Solution:** Run from the `backend` directory or use absolute paths.

### Issue: "SQLITE_ERROR: no such table"
**Solution:** Run `npm run init-db` to create tables.

### Issue: "Database file is too large"
**Solution:** Consider data retention policies or migrate to PostgreSQL.

---

**Last Updated:** October 29, 2025  
**Database Version:** 1.0.0  
**Schema Version:** 1.0.0

