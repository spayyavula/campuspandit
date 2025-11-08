# Azure Deployment - Quick Start

Get your CampusPandit app deployed to Azure in 30 minutes!

## 🚀 Option 1: Automated Deployment (Recommended)

### Prerequisites
- Azure account (https://azure.microsoft.com/free/)
- Azure CLI installed
- Docker installed

### Steps

**1. Login to Azure**
```bash
az login
```

**2. Run deployment script**

**Linux/Mac:**
```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

**Windows:**
```powershell
.\deploy-azure.ps1
```

**3. Follow prompts to enter:**
- Database URL (optional for initial deployment)
- Secret key (or auto-generate)

**4. Save the backend URL** displayed at the end

**5. Create Static Web App** via Azure Portal:
- Go to https://portal.azure.com
- Create → Static Web App
- Connect GitHub repo
- Set: App location: `/`, Output: `dist`

**6. Configure environment variables:**

See `AZURE_ENV_VARS_SETUP.md` for details.

**Backend:**
```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "ALLOWED_ORIGINS=https://YOUR-FRONTEND.azurestaticapps.net" \
    "SUPABASE_URL=YOUR_SUPABASE_URL" \
    "SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY"
```

**Frontend** (in Azure Portal → Static Web App → Configuration):
- `VITE_API_URL`: Your backend URL
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase key

**7. Done!** 🎉

---

## 📚 Option 2: Manual Step-by-Step

Follow the complete guide: `AZURE_DEPLOYMENT_COMPLETE_GUIDE.md`

---

## 🔗 Important Files Created

| File | Purpose |
|------|---------|
| `deploy-azure.sh` | Automated deployment script (Linux/Mac) |
| `deploy-azure.ps1` | Automated deployment script (Windows) |
| `AZURE_DEPLOYMENT_COMPLETE_GUIDE.md` | Complete deployment guide |
| `AZURE_ENV_VARS_SETUP.md` | Environment variables reference |
| `.github/workflows/azure-static-web-apps.yml` | Frontend CI/CD |
| `.github/workflows/azure-container-apps-backend.yml` | Backend CI/CD |
| `backend/Dockerfile.azure` | Optimized Docker image |
| `staticwebapp.config.json` | Static Web App configuration |

---

## 📊 What Gets Deployed

### Frontend
- **Service**: Azure Static Web Apps
- **URL**: `https://<your-app>.azurestaticapps.net`
- **Cost**: FREE tier
- **Features**: Global CDN, auto-scaling, HTTPS

### Backend
- **Service**: Azure Container Apps
- **URL**: `https://campuspandit-backend.<region>.azurecontainerapps.io`
- **Cost**: ~$15-30/month (scales to zero)
- **Features**: Auto-scaling (0-3 replicas), HTTPS, container-based

### Database
- **Option 1**: Keep using Supabase (recommended)
- **Option 2**: Azure Database for PostgreSQL (~$50/month)

---

## ✅ Quick Verification

**Test Backend:**
```bash
# Get URL
BACKEND_URL=$(az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test health
curl https://$BACKEND_URL/health

# Open API docs
echo "https://$BACKEND_URL/api/docs"
```

**Test Frontend:**
Open your Static Web App URL and check:
- [ ] App loads
- [ ] Can login/signup
- [ ] API calls work
- [ ] No CORS errors

---

## 🐛 Common Issues & Fixes

### Backend won't start
```bash
# Check logs
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --tail 50
```

### CORS errors
```bash
# Update ALLOWED_ORIGINS with your frontend URL
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "ALLOWED_ORIGINS=https://YOUR-FRONTEND.azurestaticapps.net"
```

### Frontend build failing
1. Check GitHub Actions logs
2. Verify secrets are set in GitHub
3. Check `VITE_*` environment variables

### Can't connect to database
1. Verify `DATABASE_URL` format: `postgresql+asyncpg://...`
2. Check Supabase allows connections from Azure
3. Test connection locally first

---

## 🔄 Making Updates

### Update Backend Code
```bash
cd backend
docker build -f Dockerfile.azure -t campuspanditcr.azurecr.io/campuspandit-backend:latest .
docker push campuspanditcr.azurecr.io/campuspandit-backend:latest
```

Container Apps will auto-deploy, or force update:
```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --image campuspanditcr.azurecr.io/campuspandit-backend:latest
```

### Update Frontend Code
Just push to GitHub - workflow will auto-deploy!

---

## 💰 Cost Breakdown

**Free Tier Eligible:**
- Static Web Apps: FREE
- Container Apps: First 180,000 vCPU-seconds + 360,000 GiB-seconds free/month

**Estimated Monthly Cost:**
- **Development**: $0-15/month
- **Production**: $50-150/month (depending on traffic)

**To reduce costs:**
- Use Supabase free tier for database
- Set Container Apps to scale to zero when idle
- Use Static Web Apps free tier

---

## 🆘 Need Help?

1. **Check logs:**
   - Backend: `az containerapp logs show ...`
   - Frontend: Azure Portal → Static Web App → Application Insights

2. **Troubleshooting guides:**
   - Complete guide: `AZURE_DEPLOYMENT_COMPLETE_GUIDE.md`
   - Environment vars: `AZURE_ENV_VARS_SETUP.md`

3. **Azure Support:**
   - Portal: https://portal.azure.com
   - Docs: https://learn.microsoft.com/azure/

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (optional):
   ```bash
   az staticwebapp hostname set \
     --name campuspandit-frontend \
     --hostname campuspandit.com
   ```

2. **Set up CI/CD**:
   - GitHub secrets already configured in workflows
   - Just add secrets to GitHub repo

3. **Enable monitoring**:
   - Application Insights auto-enabled
   - Set up alerts in Azure Portal

4. **Configure backups**:
   - Database backups (if using Azure DB)
   - Container Apps keeps revision history

5. **Security hardening**:
   - Use Azure Key Vault for secrets
   - Enable WAF (Web Application Firewall)
   - Set up managed identities

---

## 🗑️ Delete Everything

To clean up and avoid charges:

```bash
# Delete entire resource group
az group delete --name campuspandit-rg --yes

# Or just stop services
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --min-replicas 0 \
  --max-replicas 0
```

---

## 📞 Quick Reference Commands

```bash
# View all resources
az resource list --resource-group campuspandit-rg --output table

# Get backend URL
az containerapp show --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv

# Get frontend URL
az staticwebapp show --name campuspandit-frontend \
  --resource-group campuspandit-rg \
  --query defaultHostname -o tsv

# View backend logs
az containerapp logs show --name campuspandit-backend \
  --resource-group campuspandit-rg --follow

# Restart backend
az containerapp revision restart \
  --name campuspandit-backend \
  --resource-group campuspandit-rg

# View costs
az consumption usage list --output table
```

---

**Good luck with your deployment! 🚀**
