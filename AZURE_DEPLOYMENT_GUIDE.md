# Azure Backend Deployment Guide

This guide will walk you through deploying the CampusPandit FastAPI backend to Azure.

## Prerequisites

- Azure account (sign up at https://azure.microsoft.com/free/)
- Azure CLI installed (https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Git installed

## Step 1: Login to Azure

```bash
az login
```

This will open a browser window for you to authenticate.

## Step 2: Create Resource Group

```bash
az group create --name campuspandit-rg --location eastus
```

## Step 3: Create PostgreSQL Database

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server \
  --location eastus \
  --admin-user campusadmin \
  --admin-password <CHOOSE_STRONG_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group campuspandit-rg \
  --server-name campuspandit-db-server \
  --database-name campuspandit

# Allow Azure services to access the database
az postgres flexible-server firewall-rule create \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Important:** Save your database connection string:
```
postgresql://campusadmin:<PASSWORD>@campuspandit-db-server.postgres.database.azure.com/campuspandit?sslmode=require
```

## Step 4: Create App Service Plan

```bash
az appservice plan create \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku B1 \
  --is-linux
```

## Step 5: Create Web App

```bash
az webapp create \
  --resource-group campuspandit-rg \
  --plan campuspandit-plan \
  --name campuspandit-api \
  --runtime "PYTHON:3.11"
```

**Your backend URL will be:** `https://campuspandit-api.azurewebsites.net`

## Step 6: Configure Environment Variables

```bash
# Database URL
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings DATABASE_URL="postgresql://campusadmin:<PASSWORD>@campuspandit-db-server.postgres.database.azure.com/campuspandit?sslmode=require"

# Secret key (generate a random one)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings SECRET_KEY="<GENERATE_RANDOM_SECRET_KEY>"

# Environment
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings ENVIRONMENT="production"

# CORS origins (update with your Netlify URL)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings CORS_ORIGINS="https://your-app.netlify.app,https://campuspandit.com"

# Supabase credentials (from your .env file)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings SUPABASE_URL="<YOUR_SUPABASE_URL>" \
  SUPABASE_KEY="<YOUR_SUPABASE_KEY>"

# Stripe keys
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings STRIPE_SECRET_KEY="<YOUR_STRIPE_SECRET>" \
  STRIPE_PUBLISHABLE_KEY="<YOUR_STRIPE_PUBLIC>"
```

## Step 7: Configure Startup Command

```bash
az webapp config set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --startup-file "uvicorn main:app --host 0.0.0.0 --port 8000"
```

## Step 8: Deploy via Git

### Option A: Deploy from Local Git

```bash
# Navigate to backend directory
cd backend

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Azure deployment"

# Get Azure Git URL
az webapp deployment source config-local-git \
  --name campuspandit-api \
  --resource-group campuspandit-rg

# Add Azure as remote (use the URL from above command)
git remote add azure <AZURE_GIT_URL>

# Deploy
git push azure master
```

### Option B: Deploy from GitHub

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your App Service (campuspandit-api)
3. Go to "Deployment Center"
4. Select "GitHub" as source
5. Authorize and select your repository
6. Select the backend folder
7. Click "Save"

## Step 9: Run Database Migrations

```bash
# SSH into your app
az webapp ssh --resource-group campuspandit-rg --name campuspandit-api

# Once inside, run migrations
cd /home/site/wwwroot
python -m alembic upgrade head
exit
```

## Step 10: Verify Deployment

Visit: `https://campuspandit-api.azurewebsites.net/docs`

You should see the FastAPI Swagger documentation.

## Step 11: Set Up Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name campuspandit-api \
  --resource-group campuspandit-rg \
  --hostname api.campuspandit.com

# Enable HTTPS
az webapp config ssl bind \
  --certificate-thumbprint <CERT_THUMBPRINT> \
  --ssl-type SNI \
  --name campuspandit-api \
  --resource-group campuspandit-rg
```

## Monitoring & Logs

### View Logs
```bash
az webapp log tail --resource-group campuspandit-rg --name campuspandit-api
```

### Enable Application Insights
```bash
az monitor app-insights component create \
  --app campuspandit-insights \
  --location eastus \
  --resource-group campuspandit-rg
```

## Scaling

### Scale up (better hardware)
```bash
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku P1V2
```

### Scale out (more instances)
```bash
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --number-of-workers 2
```

## Cost Estimation

- **PostgreSQL (Burstable B1ms):** ~$12/month
- **App Service (B1):** ~$13/month
- **Total:** ~$25/month

For production, upgrade to:
- **PostgreSQL (General Purpose D2s_v3):** ~$140/month
- **App Service (P1V2):** ~$75/month
- **Total:** ~$215/month

## Troubleshooting

### Check if app is running
```bash
az webapp show --name campuspandit-api --resource-group campuspandit-rg --query state
```

### Restart app
```bash
az webapp restart --name campuspandit-api --resource-group campuspandit-rg
```

### View environment variables
```bash
az webapp config appsettings list --name campuspandit-api --resource-group campuspandit-rg
```

## Security Best Practices

1. **Enable managed identity** for secure access to Azure resources
2. **Use Azure Key Vault** for sensitive secrets
3. **Enable Web Application Firewall (WAF)**
4. **Set up Azure AD authentication**
5. **Enable HTTPS only**

```bash
# Force HTTPS
az webapp update --resource-group campuspandit-rg --name campuspandit-api --https-only true
```

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Configure monitoring and alerts
3. Set up backup strategy for database
4. Implement rate limiting
5. Configure CDN for static assets

## Support

- Azure Documentation: https://docs.microsoft.com/azure
- Azure Support: https://azure.microsoft.com/support/
