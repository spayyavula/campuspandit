# Azure Deployment Guide for CampusPandit Backend

This guide will help you deploy the FastAPI backend to Azure App Service.

## Prerequisites

1. **Azure Account**: Create one at [azure.microsoft.com](https://azure.microsoft.com)
2. **Azure CLI**: Install from [docs.microsoft.com/cli/azure/install-azure-cli](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **Git**: Ensure Git is installed and configured

## Quick Deployment Steps

### 1. Install Azure CLI (if not already installed)

**Windows (PowerShell):**
```powershell
winget install Microsoft.AzureCLI
```

**Or download installer from:** https://aka.ms/installazurecliwindows

### 2. Login to Azure

```bash
az login
```

This will open a browser window for authentication.

### 3. Set Your Subscription (if you have multiple)

```bash
# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"
```

### 4. Run Deployment Script

```bash
cd backend
bash deploy-to-azure.sh
```

**Or follow manual steps below:**

### Manual Deployment Steps

#### Step 1: Create Resource Group

```bash
az group create \
  --name campuspandit-rg \
  --location eastus
```

#### Step 2: Create App Service Plan

```bash
az appservice plan create \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku B1 \
  --is-linux
```

**Pricing Tiers:**
- `B1` (Basic): ~$13/month - Good for development
- `P1V2` (Premium): ~$73/month - Recommended for production
- `F1` (Free): Limited features, good for testing

#### Step 3: Create Web App

```bash
az webapp create \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --plan campuspandit-plan \
  --runtime "PYTHON:3.11"
```

**Note:** App name must be globally unique. If `campuspandit-api` is taken, use `campuspandit-api-yourname` or similar.

#### Step 4: Configure Deployment from Local Git

```bash
# Enable local git deployment
az webapp deployment source config-local-git \
  --name campuspandit-api \
  --resource-group campuspandit-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --name campuspandit-api \
  --resource-group campuspandit-rg
```

#### Step 5: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --settings \
    ENVIRONMENT="production" \
    DEBUG="false" \
    DATABASE_URL="your-database-url" \
    SECRET_KEY="your-secret-key-here" \
    ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com" \
    OPENAI_API_KEY="your-openai-key" \
    ANTHROPIC_API_KEY="your-anthropic-key" \
    STRIPE_SECRET_KEY="your-stripe-key" \
    TWILIO_ACCOUNT_SID="your-twilio-sid" \
    TWILIO_AUTH_TOKEN="your-twilio-token" \
    SENDGRID_API_KEY="your-sendgrid-key"
```

**Important:** Replace all placeholder values with your actual credentials!

#### Step 6: Configure Startup Command

```bash
az webapp config set \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --startup-file "startup.sh"
```

#### Step 7: Deploy Code

**Option A: Using Local Git**

```bash
# Add Azure remote
az webapp deployment source config-local-git \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --query url --output tsv

# This returns a Git URL like: https://username@campuspandit-api.scm.azurewebsites.net/campuspandit-api.git

# Add as remote (from backend directory)
git remote add azure <GIT_URL_FROM_ABOVE>

# Deploy
git add .
git commit -m "Deploy to Azure"
git push azure master
```

**Option B: Using ZIP Deploy (Recommended)**

```bash
# Create ZIP of backend directory (excluding unnecessary files)
cd backend
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc" -x "venv/*"

# Deploy ZIP
az webapp deployment source config-zip \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --src deploy.zip
```

**Option C: Using GitHub Actions (Best for CI/CD)**

See `.github/workflows/azure-deploy.yml` for automated deployments.

#### Step 8: Enable Logging

```bash
az webapp log config \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --application-logging filesystem \
  --level information

# Stream logs
az webapp log tail \
  --name campuspandit-api \
  --resource-group campuspandit-rg
```

#### Step 9: Configure Health Check

```bash
az webapp config set \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --health-check-path "/health"
```

#### Step 9.5: Enable Always On Mode

**IMPORTANT:** Always On keeps your app loaded even when there's no traffic, preventing cold starts and ensuring faster response times.

```bash
az webapp config set \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --always-on true
```

**Benefits:**
- Prevents cold starts
- Keeps app instances warm and ready
- Faster first request response times
- Better user experience

**Note:** Always On requires Basic (B1) tier or higher. It's NOT available on Free (F1) tier.

## Database Setup

### Option 1: Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name campuspandit-db \
  --resource-group campuspandit-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "SecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group campuspandit-rg \
  --server-name campuspandit-db \
  --database-name campuspandit

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name campuspandit-db
```

### Option 2: External Database (Supabase, Neon, etc.)

Use your external PostgreSQL connection string in the environment variables.

## Verify Deployment

1. **Check Health Endpoint:**
   ```bash
   curl https://campuspandit-api.azurewebsites.net/health
   ```

2. **Check API Docs:**
   Open: `https://campuspandit-api.azurewebsites.net/api/docs`

3. **View Logs:**
   ```bash
   az webapp log tail --name campuspandit-api --resource-group campuspandit-rg
   ```

## Scaling & Production Configuration

### Scale Up (Vertical Scaling)

```bash
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku P1V2
```

### Scale Out (Horizontal Scaling)

```bash
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --number-of-workers 2
```

### Enable Auto-Scaling

```bash
az monitor autoscale create \
  --resource-group campuspandit-rg \
  --resource campuspandit-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name campuspandit-autoscale \
  --min-count 1 \
  --max-count 4 \
  --count 1
```

## Custom Domain Setup

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name campuspandit-api \
  --resource-group campuspandit-rg \
  --hostname api.yourdomain.com

# Enable HTTPS
az webapp config ssl bind \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

## Troubleshooting

### View Application Logs

```bash
az webapp log tail --name campuspandit-api --resource-group campuspandit-rg
```

### SSH into Container

```bash
az webapp ssh --name campuspandit-api --resource-group campuspandit-rg
```

### Restart App

```bash
az webapp restart --name campuspandit-api --resource-group campuspandit-rg
```

### Check Configuration

```bash
az webapp config appsettings list \
  --name campuspandit-api \
  --resource-group campuspandit-rg
```

## Cost Optimization

1. **Use B1 tier for development** (~$13/month)
2. **Scale down during off-hours** using autoscaling rules
3. **Use managed database only if needed** (consider Supabase free tier)
4. **Monitor usage** with Azure Cost Management

## Security Checklist

- [ ] Set strong SECRET_KEY
- [ ] Configure ALLOWED_ORIGINS properly
- [ ] Use Azure Key Vault for sensitive data
- [ ] Enable HTTPS only
- [ ] Set up Azure AD authentication (optional)
- [ ] Configure network security rules
- [ ] Enable Azure DDoS protection (for production)

## Monitoring

### Application Insights (Recommended)

```bash
az monitor app-insights component create \
  --app campuspandit-insights \
  --location eastus \
  --resource-group campuspandit-rg

# Link to web app
az webapp config appsettings set \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

## CI/CD with GitHub Actions

See `.github/workflows/azure-backend-deploy.yml` for automated deployments on push to main branch.

## Useful Commands

```bash
# Stop app
az webapp stop --name campuspandit-api --resource-group campuspandit-rg

# Start app
az webapp start --name campuspandit-api --resource-group campuspandit-rg

# Delete everything
az group delete --name campuspandit-rg --yes
```

## Support

- Azure Documentation: https://docs.microsoft.com/azure/app-service/
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- GitHub Issues: https://github.com/yourusername/campuspandit/issues
