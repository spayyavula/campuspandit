# Azure PostgreSQL - Common Commands Reference

Quick reference for common Azure PostgreSQL operations.

---

## 🚀 Initial Setup

### 1. Deploy PostgreSQL Server
```bash
# Linux/Mac
./deploy-azure-postgresql.sh

# Windows
.\deploy-azure-postgresql.ps1
```

### 2. Run Database Migration
```bash
# Get connection string from azure-postgresql-connection.txt
psql "CONNECTION_STRING" < database/azure-postgresql-migration.sql
```

---

## 🔄 Database Operations

### Reset Database (Delete & Recreate)
```bash
# Linux/Mac
./reset-database.sh

# Windows
.\reset-database.ps1
```

### Connect to Database
```bash
# Using psql
psql "postgresql://cpandit_admin:PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require"

# Or with environment variable
export PGPASSWORD="YOUR_PASSWORD"
psql -h campuspandit-db.postgres.database.azure.com -U cpandit_admin -d campuspandit
```

### Backup Database
```bash
# Full backup
pg_dump "CONNECTION_STRING" > backup-$(date +%Y%m%d).sql

# Schema only
pg_dump "CONNECTION_STRING" --schema-only > schema-backup.sql

# Data only
pg_dump "CONNECTION_STRING" --data-only > data-backup.sql
```

### Restore Database
```bash
# Restore from backup
psql "CONNECTION_STRING" < backup.sql

# Restore specific table
psql "CONNECTION_STRING" -c "\copy table_name FROM 'data.csv' CSV HEADER"
```

---

## 🔍 Query Database

### List Databases
```sql
\l
-- or
SELECT datname FROM pg_database;
```

### List Tables
```sql
\dt
-- or
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### List All Schemas
```sql
\dn
-- or
SELECT schema_name FROM information_schema.schemata;
```

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('campuspandit'));
```

### Check Table Sizes
```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Check Active Connections
```sql
SELECT * FROM pg_stat_activity;
```

---

## 🛠️ Azure CLI Commands

### Show Server Details
```bash
az postgres flexible-server show \
  --name campuspandit-db \
  --resource-group campuspandit-rg
```

### List All Databases
```bash
az postgres flexible-server db list \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg
```

### Update Server Parameters
```bash
# Example: Increase max_connections
az postgres flexible-server parameter set \
  --name max_connections \
  --value 200 \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg
```

### Start/Stop Server (Save Costs)
```bash
# Stop server
az postgres flexible-server stop \
  --name campuspandit-db \
  --resource-group campuspandit-rg

# Start server
az postgres flexible-server start \
  --name campuspandit-db \
  --resource-group campuspandit-rg
```

### Restart Server
```bash
az postgres flexible-server restart \
  --name campuspandit-db \
  --resource-group campuspandit-rg
```

### Delete Database
```bash
az postgres flexible-server db delete \
  --database-name campuspandit \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg \
  --yes
```

### Delete Server (WARNING: Permanent!)
```bash
az postgres flexible-server delete \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --yes
```

---

## 🔐 Firewall Rules

### List Firewall Rules
```bash
az postgres flexible-server firewall-rule list \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg
```

### Add Firewall Rule
```bash
# Allow specific IP
az postgres flexible-server firewall-rule create \
  --name MyIP \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg \
  --start-ip-address 1.2.3.4 \
  --end-ip-address 1.2.3.4

# Allow IP range
az postgres flexible-server firewall-rule create \
  --name OfficeNetwork \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg \
  --start-ip-address 10.0.0.1 \
  --end-ip-address 10.0.0.255
```

### Remove Firewall Rule
```bash
az postgres flexible-server firewall-rule delete \
  --name MyIP \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg \
  --yes
```

---

## 📊 Monitoring

### View Server Metrics
```bash
# CPU percentage (last hour)
az monitor metrics list \
  --resource /subscriptions/SUBSCRIPTION_ID/resourceGroups/campuspandit-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/campuspandit-db \
  --metric cpu_percent \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T01:00:00Z

# Memory percentage
az monitor metrics list \
  --resource /subscriptions/SUBSCRIPTION_ID/resourceGroups/campuspandit-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/campuspandit-db \
  --metric memory_percent
```

### Check Server Logs
```bash
# List available logs
az postgres flexible-server server-logs list \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg

# Download specific log
az postgres flexible-server server-logs download \
  --name LOG_FILE_NAME \
  --server-name campuspandit-db \
  --resource-group campuspandit-rg
```

---

## 🔧 Database Maintenance

### Vacuum Database (Optimize)
```sql
-- Vacuum all tables
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE table_name;

-- Full vacuum (requires more locks)
VACUUM FULL;
```

### Reindex Database
```sql
-- Reindex all tables in database
REINDEX DATABASE campuspandit;

-- Reindex specific table
REINDEX TABLE table_name;
```

### Check Table Bloat
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

---

## 🧪 Testing & Debugging

### Test Connection
```bash
# Simple connection test
psql "CONNECTION_STRING" -c "SELECT version();"

# Test with specific database
psql "CONNECTION_STRING" -c "SELECT current_database(), current_user;"
```

### Test Auth Schema
```sql
-- Check auth.users table exists
SELECT * FROM auth.users LIMIT 1;

-- Test auth.uid() function
SELECT auth.uid();

-- Set user context and test
SET LOCAL app.current_user_id = 'some-uuid-here';
SELECT auth.uid();
```

### Debug RLS Policies
```sql
-- Disable RLS for testing (requires superuser)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- List policies on a table
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

### Check Query Performance
```sql
-- Enable query timing
\timing on

-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM tutor_profiles WHERE id = 'some-id';

-- Find slow queries
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 📦 Data Import/Export

### Export Data to CSV
```sql
-- Export table to CSV
\copy table_name TO '/path/to/file.csv' CSV HEADER

-- Export query results
\copy (SELECT * FROM users WHERE created_at > '2025-01-01') TO 'users.csv' CSV HEADER
```

### Import Data from CSV
```sql
-- Import CSV to existing table
\copy table_name FROM '/path/to/file.csv' CSV HEADER

-- Import with specific columns
\copy table_name(col1, col2, col3) FROM 'file.csv' CSV HEADER
```

### Export to JSON
```sql
-- Export table as JSON
\o output.json
SELECT json_agg(t) FROM (SELECT * FROM table_name) t;
\o
```

---

## 💰 Cost Management

### View Current Pricing Tier
```bash
az postgres flexible-server show \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --query "{sku:sku.name, tier:sku.tier, storage:storage.storageSizeGB}"
```

### Scale Server (Change Tier)
```bash
# Scale up to Standard
az postgres flexible-server update \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose

# Scale down to Burstable
az postgres flexible-server update \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --sku-name Standard_B1ms \
  --tier Burstable
```

### Increase Storage
```bash
az postgres flexible-server update \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --storage-size 64
```

---

## 🚨 Emergency Operations

### Kill Long-Running Queries
```sql
-- Find long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Kill specific query
SELECT pg_terminate_backend(PID_NUMBER);
```

### Force Disconnect All Users
```sql
-- Terminate all connections except yours
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'campuspandit' AND pid <> pg_backend_pid();
```

### Check Locks
```sql
SELECT * FROM pg_locks WHERE NOT granted;
```

---

## 📚 Useful Queries

### Count Records in All Tables
```sql
SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Find Duplicate Rows
```sql
SELECT column_name, COUNT(*)
FROM table_name
GROUP BY column_name
HAVING COUNT(*) > 1;
```

### List All Indexes
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 🔗 Quick Links

- **Azure Portal**: https://portal.azure.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Azure PostgreSQL Docs**: https://learn.microsoft.com/azure/postgresql/
- **Connection String**: Check `azure-postgresql-connection.txt`

---

## 📝 Notes

- Always backup before major operations
- Test queries in development first
- Monitor costs regularly
- Keep credentials secure
- Use connection pooling in production
- Enable SSL for all connections

---

**Last Updated**: 2025-01-08
