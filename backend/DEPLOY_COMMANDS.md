# Azure Deployment Commands for CampusPandit Backend

## Quick Deployment Guide

### Step 1: Login to Azure

```bash
az login
```

This will open your browser for authentication. After logging in, return to the terminal.

### Step 2: Set Your Subscription (if you have multiple)

```bash
# List all subscriptions
az account list --output table

# Set the subscription you want to use
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"

# Verify active subscription
az account show
```

### Step 3: Configure Your App Name

**IMPORTANT:** The app name must be globally unique across all Azure. Change `campuspandit-api` to something unique if needed (e.g., `campuspandit-api-yourname`).

```bash
# Set variables (modify APP_NAME if needed)
export RESOURCE_GROUP="campuspandit-rg"
export APP_NAME="campuspandit-api"
export PLAN_NAME="campuspandit-plan"
export LOCATION="eastus"
```

Or for **Windows PowerShell**:
```powershell
$RESOURCE_GROUP="campuspandit-rg"
$APP_NAME="campuspandit-api"
$PLAN_NAME="campuspandit-plan"
$LOCATION="eastus"
```

### Step 4: Create Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

**PowerShell:**
```powershell
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION
```

### Step 5: Create App Service Plan

```bash
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux
```

**PowerShell:**
```powershell
az appservice plan create `
  --name $PLAN_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku B1 `
  --is-linux
```

**SKU Options:**
- `F1` - Free (limited, good for testing)
- `B1` - Basic (~$13/month, good for development)
- `P1V2` - Premium (~$73/month, recommended for production)

### Step 6: Create Web App

```bash
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "PYTHON:3.11"
```

**PowerShell:**
```powershell
az webapp create `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --plan $PLAN_NAME `
  --runtime "PYTHON:3.11"
```

### Step 7: Configure App Settings

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    ENABLE_ORYX_BUILD="true" \
    ENVIRONMENT="production" \
    DEBUG="false" \
    WEBSITES_PORT="8000" \
    WEBSITES_CONTAINER_START_TIME_LIMIT="600"
```

**PowerShell:**
```powershell
az webapp config appsettings set `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --settings `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    ENABLE_ORYX_BUILD="true" `
    ENVIRONMENT="production" `
    DEBUG="false" `
    WEBSITES_PORT="8000" `
    WEBSITES_CONTAINER_START_TIME_LIMIT="600"
```

### Step 8: Set Startup Command

```bash
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "startup.sh"
```

**PowerShell:**
```powershell
az webapp config set `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --startup-file "startup.sh"
```

### Step 9: Configure Health Check

```bash
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --health-check-path "/health"
```

**PowerShell:**
```powershell
az webapp config set `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --health-check-path "/health"
```

### Step 10: Enable Logging

```bash
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --web-server-logging filesystem
```

**PowerShell:**
```powershell
az webapp log config `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --application-logging filesystem `
  --level information `
  --web-server-logging filesystem
```

### Step 11: Deploy Your Code

**Navigate to backend directory first:**
```bash
cd D:\downloads\campuspandit\campuspandit\backend
```

**Create deployment ZIP:**
```bash
# For Bash/Git Bash
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc" -x "venv/*" -x ".env"

# For PowerShell (requires Compress-Archive)
Compress-Archive -Path .\* -DestinationPath deploy.zip -Force -CompressionLevel Optimal
```

**Deploy the ZIP:**
```bash
az webapp deployment source config-zip \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src deploy.zip
```

**PowerShell:**
```powershell
az webapp deployment source config-zip `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --src deploy.zip
```

### Step 12: Add Your Environment Variables

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SECRET_KEY="your-secret-key-here" \
    DATABASE_URL="your-database-url" \
    ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com" \
    OPENAI_API_KEY="your-openai-key" \
    ANTHROPIC_API_KEY="your-anthropic-key" \
    STRIPE_SECRET_KEY="your-stripe-key" \
    TWILIO_ACCOUNT_SID="your-twilio-sid" \
    TWILIO_AUTH_TOKEN="your-twilio-token" \
    SENDGRID_API_KEY="your-sendgrid-key"
```

**PowerShell:**
```powershell
az webapp config appsettings set `
  --name $APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --settings `
    SECRET_KEY="your-secret-key-here" `
    DATABASE_URL="your-database-url" `
    ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com" `
    OPENAI_API_KEY="your-openai-key" `
    ANTHROPIC_API_KEY="your-anthropic-key" `
    STRIPE_SECRET_KEY="your-stripe-key" `
    TWILIO_ACCOUNT_SID="your-twilio-sid" `
    TWILIO_AUTH_TOKEN="your-twilio-token" `
    SENDGRID_API_KEY="your-sendgrid-key"
```

**IMPORTANT:** Replace all placeholder values with your actual API keys and secrets!

### Step 13: Restart the App

```bash
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

**PowerShell:**
```powershell
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

---

## Verify Deployment

### Check if app is running:

```bash
# View your app URL
echo "https://$APP_NAME.azurewebsites.net"

# Test health endpoint
curl https://$APP_NAME.azurewebsites.net/health

# Or open in browser
start https://$APP_NAME.azurewebsites.net/api/docs
```

**PowerShell:**
```powershell
Write-Host "https://$APP_NAME.azurewebsites.net"

# Test health endpoint
Invoke-WebRequest "https://$APP_NAME.azurewebsites.net/health"

# Open in browser
Start-Process "https://$APP_NAME.azurewebsites.net/api/docs"
```

### View Logs:

```bash
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

---

## One-Line Deployment (After Initial Setup)

For subsequent deployments after initial setup:

```bash
cd D:\downloads\campuspandit\campuspandit\backend && \
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc" -x "venv/*" && \
az webapp deployment source config-zip \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --src deploy.zip && \
az webapp restart --name campuspandit-api --resource-group campuspandit-rg
```

**PowerShell:**
```powershell
cd D:\downloads\campuspandit\campuspandit\backend
Compress-Archive -Path .\* -DestinationPath deploy.zip -Force
az webapp deployment source config-zip --name campuspandit-api --resource-group campuspandit-rg --src deploy.zip
az webapp restart --name campuspandit-api --resource-group campuspandit-rg
```

---

## Automated Script

Alternatively, use the automated script:

```bash
cd D:\downloads\campuspandit\campuspandit\backend
bash deploy-to-azure.sh
```

---

## Useful Management Commands

### View all settings:
```bash
az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Stop app:
```bash
az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Start app:
```bash
az webapp start --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Scale up (change tier):
```bash
az appservice plan update --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku P1V2
```

### Delete everything:
```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## Troubleshooting

### If deployment fails:
1. Check logs: `az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP`
2. Verify Python version in startup logs
3. Check if all dependencies are in requirements.txt
4. Verify environment variables are set correctly

### If app won't start:
1. Increase timeout: `WEBSITES_CONTAINER_START_TIME_LIMIT=1800`
2. Check startup command is correct
3. View detailed logs
4. Verify port 8000 is configured

### Common issues:
- **App name already taken**: Change `$APP_NAME` to something unique
- **Quota exceeded**: Upgrade subscription or use different region
- **Timeout**: Increase `WEBSITES_CONTAINER_START_TIME_LIMIT`

---

## Your API Endpoints

After successful deployment:

- **Base URL:** `https://$APP_NAME.azurewebsites.net`
- **Health:** `https://$APP_NAME.azurewebsites.net/health`
- **API Docs:** `https://$APP_NAME.azurewebsites.net/api/docs`
- **ReDoc:** `https://$APP_NAME.azurewebsites.net/api/redoc`

---

## Database Setup (Optional)

If you need an Azure PostgreSQL database:

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name campuspandit-db \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user dbadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name campuspandit-db \
  --database-name campuspandit

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name campuspandit-db \
  --database-name campuspandit \
  --admin-user dbadmin
```

Then add the connection string to your app settings:
```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings DATABASE_URL="postgresql+asyncpg://dbadmin:YourSecurePassword123!@campuspandit-db.postgres.database.azure.com:5432/campuspandit"
```

---

**Need help?** Check the full documentation in `AZURE_DEPLOYMENT.md`
