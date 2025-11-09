# Frontend CORS Issue - Fixed! ✅

## 🔍 Problem

Your frontend at `https://www.campuspandit.ai` was trying to connect to the wrong backend:
- ❌ **Old/Wrong**: `campuspandit-api.azurewebsites.net` (404 errors, CORS blocked)
- ✅ **New/Correct**: `campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io`

## ✅ What Was Fixed

### 1. Backend CORS Configuration
Updated Container App to allow requests from your frontend:
```bash
ALLOWED_ORIGINS=https://www.campuspandit.ai,https://campuspandit.ai,https://ambitious-river-04fdcd510.3.azurestaticapps.net
```

### 2. Frontend Environment Variables
Set all required environment variables in Azure Static Web App:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1` |
| `VITE_BACKEND_API_URL` | `https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1` |
| `VITE_APP_ENVIRONMENT` | `production` |
| `VITE_APP_TITLE` | `CampusPandit` |

### 3. GitHub Workflow Fixed
Updated workflow to deploy from `main` branch (was incorrectly set to `master`)

**File**: `.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml`

### 4. Auto-Deployment Triggered
✅ Changes pushed to GitHub
✅ GitHub Actions will automatically redeploy frontend with new settings

---

## 📊 Current Configuration

### Frontend
- **URL**: https://www.campuspandit.ai
- **Deployment**: Azure Static Web App (`campuspandit-web`)
- **Auto-deploy**: Yes (from `main` branch)

### Backend
- **URL**: https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io
- **Service**: Azure Container App (`campuspandit-backend`)
- **CORS**: Configured for www.campuspandit.ai
- **Status**: Running (scales from 0 to 3 replicas)

### Database
- **Service**: Azure PostgreSQL Flexible Server
- **Server**: campuspandit-db.postgres.database.azure.com
- **Database**: campuspandit
- **Version**: PostgreSQL 15

---

## 🧪 Testing Your Fix

### Wait for Deployment (5-10 minutes)
GitHub Actions is now deploying your frontend with the new backend URL.

**Check deployment status**:
1. Go to: https://github.com/spayyavula/campuspandit/actions
2. Look for the latest workflow run
3. Wait for it to complete (green checkmark)

### Test the Fix

**1. Health Check**:
```bash
curl https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

**2. Test Signup Endpoint**:
```bash
curl https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.campuspandit.ai" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

**3. Visit Your Site**:
Open https://www.campuspandit.ai and try to sign up. The CORS error should be gone!

---

## 🔄 What Happens Now

1. ✅ **Automatic Deployment** - GitHub Actions builds and deploys your frontend
2. ✅ **Environment Variables Applied** - New backend URL is used
3. ✅ **CORS Allowed** - Backend accepts requests from www.campuspandit.ai
4. ✅ **Cold Start** - First request may take 10-20 seconds (backend waking up)

---

## ⚠️ Important Notes

### Backend Cold Start
Your Container App is configured to scale to 0 when idle to save costs. This means:
- **First request**: Takes 10-20 seconds (backend waking up)
- **Subsequent requests**: Fast (backend stays warm)

This is normal and expected behavior!

### Database Configuration
Your backend currently has an **empty DATABASE_URL**. If you want to use Azure PostgreSQL:

```bash
# Replace YOUR_PASSWORD with your actual password
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://cpandit_admin:YOUR_PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require"
```

### Still Using Supabase?
Your frontend code still references Supabase in several places:
- `src/utils/supabase.ts`
- `src/utils/stripePayment.ts`

If you've migrated to Azure PostgreSQL, you may want to remove these Supabase dependencies.

---

## 📋 Quick Reference

### View Current Settings
```bash
az staticwebapp appsettings list \
  --name campuspandit-web \
  --resource-group campuspandit-rg \
  --output json
```

### Update Settings
```bash
az staticwebapp appsettings set \
  --name campuspandit-web \
  --resource-group campuspandit-rg \
  --setting-names VARIABLE_NAME="value"
```

### Check Deployment
```bash
# Check Static Web App
az staticwebapp show \
  --name campuspandit-web \
  --resource-group campuspandit-rg

# Check Container App
az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg
```

### View Logs
```bash
# Backend logs
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --tail 50
```

---

## 🐛 Troubleshooting

### Still Getting CORS Errors?
1. **Wait for deployment** - Check GitHub Actions is complete
2. **Clear browser cache** - Hard refresh with Ctrl+Shift+R
3. **Check browser console** - Verify it's using the new backend URL
4. **Test backend directly** - Use curl to test endpoints

### Backend Not Responding?
1. **Wait 20 seconds** - Backend is waking up from sleep
2. **Check replicas** - May need to increase min replicas:
   ```bash
   az containerapp update \
     --name campuspandit-backend \
     --resource-group campuspandit-rg \
     --min-replicas 1
   ```

### Database Errors?
1. **Configure DATABASE_URL** - See section above
2. **Run migration** - Use the Azure PostgreSQL migration scripts
3. **Check connection** - Test with psql

---

## 📞 Support Resources

- **Azure Portal**: https://portal.azure.com
- **GitHub Actions**: https://github.com/spayyavula/campuspandit/actions
- **Frontend URL**: https://www.campuspandit.ai
- **Backend URL**: https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io

---

## ✅ Success Indicators

You'll know the fix worked when:
- ✅ No more CORS errors in browser console
- ✅ Signup/login works on www.campuspandit.ai
- ✅ Network tab shows requests to `campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io`
- ✅ Backend returns 200 OK (not 404)

---

**Fixed**: 2025-11-08
**Deployment**: Automatic via GitHub Actions
**Status**: ✅ Complete - waiting for deployment
