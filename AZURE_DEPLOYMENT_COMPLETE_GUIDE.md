# Complete Azure Deployment Guide for CampusPandit

This guide will walk you through deploying the complete CampusPandit application to Azure using modern, production-ready services.

## 📋 Overview

We'll deploy:
- **Frontend**: Azure Static Web Apps (React/Vite PWA)
- **Backend**: Azure Container Apps (FastAPI Python)
- **Database**: Use your existing Supabase PostgreSQL or Azure Database for PostgreSQL

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                            │
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │ Azure Static Web App │─────▶│  Azure Container App │    │
│  │    (Frontend)        │      │     (Backend API)    │    │
│  │  - React/Vite/PWA    │      │   - FastAPI/Python   │    │
│  │  - Auto-scaling      │      │   - Auto-scaling     │    │
│  │  - Global CDN        │      │   - 0-3 replicas     │    │
│  └──────────────────────┘      └──────────┬───────────┘    │
│                                            │                 │
│                                            ▼                 │
│                                  ┌──────────────────────┐   │
│                                  │  Supabase/Azure DB   │   │
│                                  │    (PostgreSQL)      │   │
│                                  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Cost Estimate

### Development/Staging
- Azure Static Web Apps: **FREE** (up to 100GB bandwidth/month)
- Azure Container Apps: **~$15-30/month** (scales to zero when idle)
- **Total: ~$15-30/month**

### Production
- Azure Static Web Apps: **FREE** or Standard ($9/month for advanced features)
- Azure Container Apps: **~$30-100/month** (depends on traffic)
- Azure Database for PostgreSQL: **~$50/month** (if not using Supabase)
- **Total: ~$90-160/month**

## 🚀 Deployment Methods

Choose one:
1. **Automated (Recommended)**: Using the deployment script
2. **Manual**: Step-by-step through Azure Portal
3. **CI/CD**: GitHub Actions (for ongoing deployments)

---

## Method 1: Automated Deployment (Recommended)

### Prerequisites

1. **Azure Account**: Sign up at https://azure.microsoft.com/free/
2. **Azure CLI**: Install from https://docs.microsoft.com/cli/azure/install-azure-cli
3. **Docker**: Install from https://docs.docker.com/get-docker/
4. **Git**: Make sure your code is committed

### Step 1: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-azure.sh

# Run deployment
./deploy-azure.sh
```

The script will:
- ✅ Check Azure CLI installation
- ✅ Log you into Azure
- ✅ Create Resource Group
- ✅ Create Container Registry
- ✅ Build and push Docker image
- ✅ Create Container Apps Environment
- ✅ Deploy backend API
- ✅ Provide instructions for frontend setup

### Step 2: Note Your Backend URL

The script will output something like:
```
Backend deployed at: https://campuspandit-backend.xxx.eastus.azurecontainerapps.io
```

**Save this URL** - you'll need it for the frontend configuration.

### Step 3: Set Up Frontend (Azure Portal)

Since Static Web Apps require GitHub integration, complete this through the Azure Portal:

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create a new Static Web App**:
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

3. **Configuration**:
   - **Resource Group**: Select `campuspandit-rg`
   - **Name**: `campuspandit-frontend`
   - **Plan type**: Free (or Standard for production)
   - **Region**: East US
   - **Deployment source**: GitHub
   - **Authorize**: Connect your GitHub account
   - **Repository**: Select your repo
   - **Branch**: main
   - **Build Presets**: React
   - **App location**: `/`
   - **Output location**: `dist`

4. **Click "Review + Create"** then **"Create"**

5. **Azure will automatically**:
   - Create a GitHub workflow file
   - Deploy your frontend
   - Generate a URL

### Step 4: Configure Environment Variables

#### Backend Environment Variables

```bash
# Update backend environment variables
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "DATABASE_URL=your-database-url" \
    "SUPABASE_URL=your-supabase-url" \
    "SUPABASE_KEY=your-supabase-key" \
    "OPENAI_API_KEY=your-openai-key" \
    "STRIPE_SECRET_KEY=your-stripe-secret" \
    "SENDGRID_API_KEY=your-sendgrid-key" \
    "SECRET_KEY=your-generated-secret-key" \
    "ENVIRONMENT=production" \
    "DEBUG=false" \
    "ALLOWED_ORIGINS=https://your-frontend-url.azurestaticapps.net"
```

#### Frontend Environment Variables

In Azure Portal:
1. Go to your Static Web App
2. Click "Configuration"
3. Add these application settings:
   - `VITE_API_URL`: Your backend URL (from Step 2)
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

4. Click "Save"

---

## Method 2: Manual Deployment via Azure Portal

### Part A: Deploy Backend

#### 1. Create Resource Group
```bash
az group create --name campuspandit-rg --location eastus
```

#### 2. Create Container Registry
```bash
az acr create \
  --resource-group campuspandit-rg \
  --name campuspanditcr \
  --sku Basic \
  --admin-enabled true
```

#### 3. Get Registry Credentials
```bash
az acr credential show --name campuspanditcr
```

Save the username and password.

#### 4. Build and Push Docker Image
```bash
cd backend

# Login to ACR
az acr login --name campuspanditcr

# Build image
docker build -f Dockerfile.azure -t campuspanditcr.azurecr.io/campuspandit-backend:latest .

# Push image
docker push campuspanditcr.azurecr.io/campuspandit-backend:latest
```

#### 5. Create Container Apps Environment
```bash
az containerapp env create \
  --name campuspandit-env \
  --resource-group campuspandit-rg \
  --location eastus
```

#### 6. Create Container App
```bash
az containerapp create \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --environment campuspandit-env \
  --image campuspanditcr.azurecr.io/campuspandit-backend:latest \
  --target-port 8000 \
  --ingress external \
  --registry-server campuspanditcr.azurecr.io \
  --registry-username <USERNAME_FROM_STEP_3> \
  --registry-password <PASSWORD_FROM_STEP_3> \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 3
```

#### 7. Get Backend URL
```bash
az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv
```

### Part B: Deploy Frontend

Follow the same steps as in Method 1, Step 3.

---

## Method 3: GitHub Actions CI/CD (Ongoing Deployments)

### Setup GitHub Secrets

Once you've deployed manually, set up CI/CD for automatic deployments:

#### 1. Get Azure Credentials
```bash
az ad sp create-for-rbac \
  --name "campuspandit-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/campuspandit-rg \
  --sdk-auth
```

Copy the entire JSON output.

#### 2. Get Container Registry Credentials
```bash
az acr credential show --name campuspanditcr
```

#### 3. Get Static Web Apps Token

1. Go to Azure Portal
2. Open your Static Web App
3. Go to "Overview"
4. Click "Manage deployment token"
5. Copy the token

#### 4. Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `AZURE_CREDENTIALS`: JSON from step 1
- `AZURE_REGISTRY_USERNAME`: From step 2
- `AZURE_REGISTRY_PASSWORD`: From step 2
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: From step 3
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_API_URL`: Your backend URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe key

### Workflow Files

The workflow files are already created:
- `.github/workflows/azure-static-web-apps.yml` - Frontend deployment
- `.github/workflows/azure-container-apps-backend.yml` - Backend deployment

These will automatically deploy when you push to the main branch.

---

## 📊 Post-Deployment

### Verify Backend Deployment

```bash
# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test health endpoint
curl https://$BACKEND_URL/health

# Open API docs in browser
echo "API Docs: https://$BACKEND_URL/api/docs"
```

### Verify Frontend Deployment

```bash
# Get frontend URL
az staticwebapp show \
  --name campuspandit-frontend \
  --resource-group campuspandit-rg \
  --query defaultHostname -o tsv
```

Visit the URL in your browser.

---

## 🔧 Management & Monitoring

### View Logs

#### Backend Logs
```bash
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --follow
```

#### Frontend Logs
In Azure Portal:
1. Go to your Static Web App
2. Click "Application Insights"
3. View logs and metrics

### Scaling

#### Backend Scaling
```bash
# Update replica settings
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --min-replicas 1 \
  --max-replicas 5
```

### Update Application

#### Backend Update
```bash
cd backend

# Build new image
docker build -f Dockerfile.azure -t campuspanditcr.azurecr.io/campuspandit-backend:latest .

# Push to registry
docker push campuspanditcr.azurecr.io/campuspandit-backend:latest

# Container Apps will auto-detect and redeploy
# Or force update:
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --image campuspanditcr.azurecr.io/campuspandit-backend:latest
```

#### Frontend Update
Just push to your GitHub repository - the workflow will automatically deploy.

---

## 🔐 Security Best Practices

### 1. Enable Managed Identity
```bash
az containerapp identity assign \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --system-assigned
```

### 2. Use Azure Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create \
  --name campuspandit-kv \
  --resource-group campuspandit-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name campuspandit-kv \
  --name "database-url" \
  --value "your-database-url"

# Reference in Container App
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --secrets database-url=keyvaultref:https://campuspandit-kv.vault.azure.net/secrets/database-url,identityref:system
```

### 3. Restrict CORS

Update the `ALLOWED_ORIGINS` to only include your frontend domain:
```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "ALLOWED_ORIGINS=https://your-app.azurestaticapps.net"
```

### 4. Enable HTTPS Only

Both Static Web Apps and Container Apps use HTTPS by default.

---

## 🚨 Troubleshooting

### Backend Not Starting

```bash
# Check logs
az containerapp logs show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --tail 100

# Check revision status
az containerapp revision list \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --output table
```

### Frontend Build Failing

1. Check GitHub Actions logs
2. Verify environment variables are set
3. Check build command in workflow file

### CORS Errors

Make sure your backend `ALLOWED_ORIGINS` includes your frontend URL:
```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "ALLOWED_ORIGINS=https://your-frontend.azurestaticapps.net,http://localhost:5173"
```

### Database Connection Issues

1. Check if database allows connections from Azure
2. Verify DATABASE_URL format
3. For Supabase, make sure to whitelist Azure IPs (or use connection pooler)

---

## 💾 Backup & Disaster Recovery

### Database Backups

If using Azure Database for PostgreSQL:
```bash
az postgres flexible-server backup list \
  --resource-group campuspandit-rg \
  --name campuspandit-db
```

If using Supabase: Backups are handled automatically.

### Container App Revisions

Container Apps keeps revision history:
```bash
# List revisions
az containerapp revision list \
  --name campuspandit-backend \
  --resource-group campuspandit-rg

# Rollback to previous revision
az containerapp revision activate \
  --revision <revision-name> \
  --resource-group campuspandit-rg
```

---

## 🗑️ Cleanup / Delete Resources

To delete everything and avoid charges:

```bash
# Delete entire resource group (deletes everything)
az group delete --name campuspandit-rg --yes --no-wait

# Or stop individual resources
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --min-replicas 0 \
  --max-replicas 0
```

---

## 📞 Support & Resources

- **Azure Portal**: https://portal.azure.com
- **Azure Status**: https://status.azure.com
- **Container Apps Docs**: https://learn.microsoft.com/azure/container-apps/
- **Static Web Apps Docs**: https://learn.microsoft.com/azure/static-web-apps/
- **Azure Support**: https://azure.microsoft.com/support/

---

## ✅ Deployment Checklist

- [ ] Azure account created
- [ ] Azure CLI installed
- [ ] Docker installed
- [ ] Code committed to GitHub
- [ ] Resource group created
- [ ] Container registry created
- [ ] Backend Docker image built and pushed
- [ ] Container App created for backend
- [ ] Backend environment variables configured
- [ ] Backend health check passing
- [ ] Static Web App created for frontend
- [ ] Frontend environment variables configured
- [ ] GitHub Actions secrets configured
- [ ] CORS configured correctly
- [ ] Custom domain configured (optional)
- [ ] Monitoring/logging set up
- [ ] Backups configured

---

## 🎯 Quick Reference

### Important URLs

After deployment, save these:

```bash
# Backend
echo "Backend: https://$(az containerapp show --name campuspandit-backend --resource-group campuspandit-rg --query properties.configuration.ingress.fqdn -o tsv)"
echo "API Docs: https://$(az containerapp show --name campuspandit-backend --resource-group campuspandit-rg --query properties.configuration.ingress.fqdn -o tsv)/api/docs"

# Frontend
echo "Frontend: https://$(az staticwebapp show --name campuspandit-frontend --resource-group campuspandit-rg --query defaultHostname -o tsv)"
```

### Cost Management

```bash
# View current costs
az consumption usage list --output table

# Set budget alert
az consumption budget create \
  --amount 100 \
  --category Cost \
  --name campuspandit-budget \
  --time-period-start 2025-01-01 \
  --time-period-end 2025-12-31 \
  --time-grain Monthly
```

---

**Congratulations!** Your CampusPandit application is now deployed to Azure! 🎉
