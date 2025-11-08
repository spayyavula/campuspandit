# Supabase to Azure PostgreSQL Migration Guide

Complete guide for migrating your CampusPandit database from Supabase to Azure PostgreSQL.

## Overview

This guide will help you:
1. Provision Azure PostgreSQL Flexible Server
2. Migrate your database schema from Supabase
3. Update your backend to work with Azure PostgreSQL
4. Deploy and test the migration

**Estimated Time**: 30-45 minutes
**Estimated Cost**: $12-20/month for Azure PostgreSQL (Burstable tier)

---

## Prerequisites

- [ ] Azure account with active subscription
- [ ] Azure CLI installed ([Download](https://docs.microsoft.com/cli/azure/install-azure-cli))
- [ ] `psql` client installed ([PostgreSQL](https://www.postgresql.org/download/))
- [ ] Access to your current Supabase project
- [ ] Git repository access

---

## Part 1: Provision Azure PostgreSQL

### Option A: Automated Script (Recommended)

**For Linux/Mac**:
```bash
chmod +x deploy-azure-postgresql.sh
./deploy-azure-postgresql.sh
```

**For Windows**:
```powershell
.\deploy-azure-postgresql.ps1
```

The script will:
- ✅ Create resource group `campuspandit-rg`
- ✅ Create PostgreSQL server `campuspandit-db`
- ✅ Create database `campuspandit`
- ✅ Configure firewall rules
- ✅ Generate connection strings
- ✅ Save credentials to `azure-postgresql-connection.txt`

**What you'll be asked**:
- Database admin password (min 8 chars, uppercase, lowercase, numbers)
- If database exists: whether to delete and recreate it (type `yes` or `no`)

**Note**: If the database already exists, the script will prompt you to delete and recreate it from scratch. This is useful for resetting during development.

### Option B: Manual Setup via Azure Portal

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Resource** → Search "PostgreSQL"
3. **Select**: Azure Database for PostgreSQL Flexible Server
4. **Configure**:
   - Subscription: Your subscription
   - Resource group: `campuspandit-rg` (create new)
   - Server name: `campuspandit-db`
   - Region: East US (or nearest)
   - PostgreSQL version: 16
   - Workload type: Development
   - Compute + storage: Burstable, B1ms (1 vCore, 2 GiB RAM)
   - Authentication: PostgreSQL authentication only
   - Admin username: `cpandit_admin`
   - Password: (create strong password)
5. **Networking**:
   - Allow public access from Azure services
   - Add your current IP address
6. **Review + Create** → Wait 5-10 minutes

---

## Part 2: Run Database Migration

### Step 1: Get Connection String

From script output or Azure Portal, get your connection string:

```
postgresql://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require
```

### Step 2: Test Connection

```bash
psql "postgresql://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require"
```

You should see:
```
psql (16.x)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

campuspandit=>
```

Type `\q` to exit.

### Step 3: Run Migration Script

```bash
psql "YOUR_CONNECTION_STRING" < database/azure-postgresql-migration.sql
```

**Expected output**:
```
CREATE SCHEMA
CREATE TABLE
CREATE INDEX
CREATE FUNCTION
...
✅ All existing triggers dropped successfully
✅ All existing RLS policies dropped successfully
...
```

**Migration creates**:
- 1 auth schema
- 70+ tables
- 125+ indexes
- 37 triggers
- 80+ RLS policies
- 28 functions
- 15+ views

**Duration**: 30-90 seconds

### Step 4: Verify Migration

Connect to database:
```bash
psql "YOUR_CONNECTION_STRING"
```

Run verification queries:

```sql
-- Check tables were created
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
-- Should show 70+ tables

-- Check auth schema
\dt auth.*
-- Should show: auth.users

-- Test auth.uid() function
SELECT auth.uid();
-- Should return NULL (no user context set yet)

-- Check roles table
SELECT * FROM roles;
-- Should show: student, tutor, admin, moderator, content_creator, parent

-- Check a sample table
\d tutor_profiles
-- Should show table structure

-- Exit
\q
```

---

## Part 3: Update Backend Configuration

### Step 1: Update Environment Variables

Create or update `.env` file in `backend/` directory:

```env
# Database - Azure PostgreSQL
DATABASE_URL=postgresql+asyncpg://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require

# Keep other variables unchanged
SECRET_KEY=your-secret-key
ENVIRONMENT=production
DEBUG=false
```

**Important**: Use `postgresql+asyncpg://` for async SQLAlchemy support!

### Step 2: Add Auth Middleware

Update `backend/main.py`:

```python
# Add import at the top
from app.middleware import AuthContextMiddleware

# Add after CORS middleware (around line 71)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD THIS LINE:
app.add_middleware(AuthContextMiddleware)
```

### Step 3: Update Endpoints to Use Dependencies

Replace manual authentication with dependencies:

**Before**:
```python
@router.get("/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
    # Manual token validation...
    pass
```

**After**:
```python
from app.dependencies import get_current_user

@router.get("/profile")
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return {"email": user.email, "name": user.first_name}
```

See `AZURE_POSTGRESQL_BACKEND_INTEGRATION.md` for complete examples.

### Step 4: Test Locally

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Visit http://localhost:8000/api/docs and test:
- [ ] `/health` endpoint works
- [ ] `/api/v1/auth/signup` can create users
- [ ] `/api/v1/auth/login` returns JWT token
- [ ] Protected endpoints require authentication

---

## Part 4: Deploy to Azure

### Step 1: Update Azure Container App

```bash
# Get your async connection string
ASYNC_DB_URL="postgresql+asyncpg://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require"

# Update Container App
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "DATABASE_URL=${ASYNC_DB_URL}"
```

### Step 2: Update Other Environment Variables

```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "DATABASE_URL=${ASYNC_DB_URL}" \
    "SUPABASE_URL=" \
    "SUPABASE_ANON_KEY=" \
    "SUPABASE_SERVICE_KEY="
```

**Note**: Clear Supabase variables since we're no longer using Supabase.

### Step 3: Rebuild and Deploy Backend

```bash
cd backend

# Build Docker image
docker build -f Dockerfile.azure -t campuspanditcr.azurecr.io/campuspandit-backend:latest .

# Push to Azure Container Registry
az acr login --name campuspanditcr
docker push campuspanditcr.azurecr.io/campuspandit-backend:latest

# Force restart
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --image campuspanditcr.azurecr.io/campuspandit-backend:latest
```

### Step 4: Verify Deployment

```bash
# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test health endpoint
curl https://$BACKEND_URL/health

# Check logs
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --tail 50
```

---

## Part 5: Data Migration (Optional)

If you have existing data in Supabase that needs to be migrated:

### Export from Supabase

```bash
# Using Supabase CLI
npx supabase db dump --data-only > supabase-data.sql

# Or using pg_dump
pg_dump "YOUR_SUPABASE_CONNECTION_STRING" --data-only --inserts > supabase-data.sql
```

### Import to Azure PostgreSQL

```bash
# Import data
psql "YOUR_AZURE_CONNECTION_STRING" < supabase-data.sql
```

**Important**:
- Only import data, not schema (schema is already created)
- Review the SQL file first to ensure compatibility
- Test with a small dataset first

---

## Part 6: Update Frontend

### Update Environment Variables

In your Static Web App or Vercel, update:

```env
# Remove Supabase variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Backend URL stays the same
VITE_API_URL=https://your-backend.azurecontainerapps.io
```

### Remove Supabase Client Code

If your frontend uses Supabase client:

1. Remove Supabase package:
   ```bash
   npm uninstall @supabase/supabase-js
   ```

2. Replace Supabase auth with backend API calls
3. Update all API calls to use your backend

---

## Troubleshooting

### Issue: Cannot connect to database

**Error**: `could not connect to server`

**Solutions**:
1. Check firewall rules in Azure Portal
2. Add your IP address to allowed IPs
3. Verify connection string format
4. Test with `psql` first

### Issue: Migration fails with "already exists"

**Error**: `relation "table_name" already exists`

**Solution 1** (Recommended - Use reset script):
```bash
# Delete and recreate database
./reset-database.sh  # or reset-database.ps1 for Windows

# Then run migration
psql "CONNECTION_STRING" < database/azure-postgresql-migration.sql
```

**Solution 2** (Manual):
```bash
# Drop all tables and re-run
psql "CONNECTION_STRING" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "CONNECTION_STRING" < database/azure-postgresql-migration.sql
```

### Issue: RLS policies blocking queries

**Error**: `permission denied for table`

**Solutions**:
1. Verify middleware is added to `main.py`
2. Check JWT token is sent in requests
3. Test auth.uid() is returning correct value:
   ```sql
   SELECT auth.uid();
   ```

### Issue: Backend container won't start

**Check logs**:
```bash
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --follow
```

**Common issues**:
- DATABASE_URL format incorrect (use `postgresql+asyncpg://`)
- Missing SSL parameter (`?ssl=require`)
- Database not accessible from Azure

---

## Rollback Plan

If you need to rollback to Supabase:

### 1. Keep Supabase Running

Don't delete your Supabase project until migration is verified.

### 2. Revert Backend Environment Variables

```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "DATABASE_URL=YOUR_SUPABASE_CONNECTION" \
    "SUPABASE_URL=YOUR_SUPABASE_URL" \
    "SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY"
```

### 3. Remove Middleware

Comment out the middleware in `main.py`:
```python
# app.add_middleware(AuthContextMiddleware)
```

### 4. Redeploy

Follow deployment steps to push changes.

---

## Post-Migration Checklist

- [ ] Database migration completed successfully
- [ ] Backend deployed with new DATABASE_URL
- [ ] Health endpoint returns 200
- [ ] User signup works
- [ ] User login works
- [ ] JWT authentication works
- [ ] Protected endpoints enforce authorization
- [ ] RLS policies filter data correctly
- [ ] Frontend connects to backend
- [ ] All features tested
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified

---

## Cost Optimization

### Reduce Costs

1. **Use Burstable tier**: B1ms is cheapest (~$12/month)
2. **Stop/Start server**: For dev environments
   ```bash
   # Stop server
   az postgres flexible-server stop --name campuspandit-db --resource-group campuspandit-rg

   # Start server
   az postgres flexible-server start --name campuspandit-db --resource-group campuspandit-rg
   ```
3. **Scale down storage**: Start with 32 GB
4. **Set up auto-shutdown**: For non-production environments

### Monitor Costs

```bash
# View costs
az consumption usage list --output table

# Set budget alerts in Azure Portal
```

---

## Security Best Practices

1. **Rotate passwords regularly**
2. **Use Azure Key Vault** for secrets
3. **Enable SSL/TLS** (already required)
4. **Restrict firewall rules** to specific IPs
5. **Enable Azure AD authentication** (optional)
6. **Set up monitoring** with Azure Monitor
7. **Regular backups** (enabled by default)
8. **Audit logs** for compliance

---

## Backup & Recovery

### Automated Backups

Azure PostgreSQL provides:
- Automatic backups every day
- 7-day retention (default)
- Point-in-time restore

### Manual Backup

```bash
# Backup database
pg_dump "CONNECTION_STRING" > backup-$(date +%Y%m%d).sql

# Backup to Azure Blob Storage
az postgres flexible-server backup create \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --backup-name manual-backup-$(date +%Y%m%d)
```

### Restore

```bash
# Restore from backup
az postgres flexible-server restore \
  --resource-group campuspandit-rg \
  --name campuspandit-db-restored \
  --source-server campuspandit-db \
  --restore-time "2025-01-15T10:00:00Z"
```

---

## Monitoring

### Azure Portal

1. Go to your PostgreSQL server in Azure Portal
2. Navigate to "Monitoring" → "Metrics"
3. Add charts for:
   - CPU percentage
   - Memory percentage
   - Active connections
   - Network bytes

### Query Performance

```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Connection stats
SELECT * FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('campuspandit'));
```

### Alerts

Set up alerts in Azure Portal for:
- High CPU usage (>80%)
- High memory usage (>90%)
- Failed connections
- Long-running queries

---

## Next Steps

1. **Test thoroughly** in staging environment
2. **Run load tests** to ensure performance
3. **Document** any custom changes
4. **Train team** on new infrastructure
5. **Set up monitoring** dashboards
6. **Configure backups** and test restore
7. **Plan** for future scaling

---

## Support & Resources

- **Azure PostgreSQL Docs**: https://learn.microsoft.com/azure/postgresql/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **Azure Support**: Azure Portal → Help + Support

---

## Reset Database (Development)

If you need to reset the database to a fresh state (useful for development and testing):

**Linux/Mac**:
```bash
chmod +x reset-database.sh
./reset-database.sh
```

**Windows**:
```powershell
.\reset-database.ps1
```

This script will:
1. Ask for double confirmation (type `DELETE` and database name)
2. Delete the existing database
3. Create a fresh empty database
4. Provide next steps for running migration

**When to use**:
- Development/testing when you need a clean slate
- After major schema changes
- When troubleshooting migration issues
- Before importing fresh data

---

## Files Reference

| File | Purpose |
|------|---------|
| `deploy-azure-postgresql.sh` | Provision Azure PostgreSQL (Linux/Mac) |
| `deploy-azure-postgresql.ps1` | Provision Azure PostgreSQL (Windows) |
| `reset-database.sh` | Reset database to fresh state (Linux/Mac) |
| `reset-database.ps1` | Reset database to fresh state (Windows) |
| `database/azure-postgresql-migration.sql` | Complete database schema migration |
| `backend/app/middleware/auth_context.py` | RLS user context middleware |
| `backend/app/dependencies/auth.py` | Authentication dependencies |
| `AZURE_POSTGRESQL_BACKEND_INTEGRATION.md` | Backend integration guide |
| `AZURE_POSTGRESQL_MIGRATION_GUIDE.md` | This file |

---

**Migration completed successfully!** 🎉

You've successfully migrated from Supabase to Azure PostgreSQL while maintaining full compatibility with your existing codebase.
