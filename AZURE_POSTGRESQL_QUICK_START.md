# Azure PostgreSQL - Quick Start Guide

**Migrate from Supabase to Azure PostgreSQL in 3 steps!**

---

## Step 1: Provision Azure PostgreSQL (5-10 minutes)

Run the deployment script:

**Linux/Mac**:
```bash
chmod +x deploy-azure-postgresql.sh
./deploy-azure-postgresql.sh
```

**Windows**:
```powershell
.\deploy-azure-postgresql.ps1
```

**What it does**:
- Creates PostgreSQL server in Azure
- Sets up firewall rules
- Creates database
- Generates connection strings
- Saves credentials to `azure-postgresql-connection.txt`

**If database already exists**, the script will ask if you want to delete and recreate it from scratch. Type `yes` to reset the database or `no` to keep it.

---

## Step 2: Migrate Database Schema (2-3 minutes)

After Step 1 completes, run the migration:

```bash
# Get your connection string from azure-postgresql-connection.txt
# Then run:

psql "postgresql://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require" < database/azure-postgresql-migration.sql
```

**What it does**:
- Creates auth schema for compatibility
- Creates 70+ tables
- Sets up indexes, triggers, RLS policies
- Migrates entire database structure

---

## Step 3: Update Backend (5 minutes)

### A. Add Middleware to main.py

```python
# backend/main.py
from app.middleware import AuthContextMiddleware

# Add after CORS middleware (line 71)
app.add_middleware(AuthContextMiddleware)
```

### B. Update .env

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require
```

### C. Deploy to Azure

```bash
# Update Container App
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require"
```

---

## That's it! 🎉

Your database is now running on Azure PostgreSQL!

**Test it**:
```bash
curl https://your-backend.azurecontainerapps.io/health
```

---

## What Changed?

✅ **Database**: Supabase → Azure PostgreSQL
✅ **Auth Schema**: Created compatibility layer
✅ **RLS Policies**: Still work with auth.uid()
✅ **Backend**: Added middleware for user context
✅ **Cost**: ~$12-20/month (vs Supabase free tier limits)

## What Stayed the Same?

✅ All table structures
✅ All RLS policies
✅ All triggers and functions
✅ All indexes
✅ Your application code (minimal changes)

---

## Next Steps

1. **Read the full guide**: `AZURE_POSTGRESQL_MIGRATION_GUIDE.md`
2. **Backend integration**: `AZURE_POSTGRESQL_BACKEND_INTEGRATION.md`
3. **Test thoroughly**: Verify all features work
4. **Set up monitoring**: Azure Portal → Metrics
5. **Configure backups**: (Automatic by default)

---

## Files Created

| File | Purpose |
|------|---------|
| `deploy-azure-postgresql.sh` | Provision Azure PostgreSQL (Linux/Mac) |
| `deploy-azure-postgresql.ps1` | Provision Azure PostgreSQL (Windows) |
| `reset-database.sh` | Reset database to fresh state (Linux/Mac) |
| `reset-database.ps1` | Reset database to fresh state (Windows) |
| `database/azure-postgresql-migration.sql` | Database schema migration (4,348 lines) |
| `backend/app/middleware/auth_context.py` | RLS user context middleware |
| `backend/app/dependencies/auth.py` | Authentication dependencies |
| `AZURE_POSTGRESQL_MIGRATION_GUIDE.md` | Complete migration guide |
| `AZURE_POSTGRESQL_BACKEND_INTEGRATION.md` | Backend integration examples |
| `AZURE_POSTGRESQL_QUICK_START.md` | This quick start guide |

---

## Reset Database (Development)

If you need to start fresh (delete all data and recreate):

**Linux/Mac**:
```bash
chmod +x reset-database.sh
./reset-database.sh
```

**Windows**:
```powershell
.\reset-database.ps1
```

**Warning**: This will permanently delete all data! You'll be asked to confirm twice.

---

## Troubleshooting

**Can't connect to database?**
- Check firewall rules in Azure Portal
- Verify connection string format
- Add your IP to allowed IPs

**Migration fails?**
- Check psql is installed
- Verify connection works first: `psql "CONNECTION_STRING"`
- Review error messages

**Need to start over?**
- Run `./reset-database.sh` (or `.ps1` for Windows)
- Then run migration script again

**Backend won't start?**
- Check DATABASE_URL format (must use `postgresql+asyncpg://`)
- Verify SSL parameter (`?ssl=require`)
- Check logs: `az containerapp logs show --name campuspandit-backend`

**RLS not working?**
- Verify middleware is added to main.py
- Use `get_current_user` dependency
- Check JWT token is sent in requests

---

## Support

📖 **Full Documentation**: `AZURE_POSTGRESQL_MIGRATION_GUIDE.md`
🔧 **Backend Integration**: `AZURE_POSTGRESQL_BACKEND_INTEGRATION.md`
🌐 **Azure Docs**: https://learn.microsoft.com/azure/postgresql/

---

**Happy migrating! 🚀**
