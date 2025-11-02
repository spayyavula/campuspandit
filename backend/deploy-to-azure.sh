#!/bin/bash
# Automated Azure Deployment Script for CampusPandit Backend

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - MODIFY THESE VALUES
RESOURCE_GROUP="campuspandit-rg"
APP_NAME="campuspandit-api"  # Must be globally unique - change if needed
PLAN_NAME="campuspandit-plan"
LOCATION="eastus"
SKU="B1"  # B1 for basic, P1V2 for production
PYTHON_VERSION="3.11"

echo -e "${GREEN}=========================================="
echo "CampusPandit Azure Deployment Script"
echo -e "==========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed!${NC}"
    echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✓ Azure CLI found${NC}"

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Logging in...${NC}"
    az login
fi

ACCOUNT=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Logged in as: $ACCOUNT${NC}"
echo ""

# Prompt for confirmation
echo -e "${YELLOW}Deployment Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"
echo "  Location: $LOCATION"
echo "  SKU: $SKU"
echo "  Python: $PYTHON_VERSION"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Creating Resource Group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Resource group already exists, skipping...${NC}"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✓ Resource group created${NC}"
fi

echo ""
echo -e "${GREEN}Step 2: Creating App Service Plan...${NC}"
if az appservice plan show --name $PLAN_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}App service plan already exists, skipping...${NC}"
else
    az appservice plan create \
        --name $PLAN_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku $SKU \
        --is-linux
    echo -e "${GREEN}✓ App service plan created${NC}"
fi

echo ""
echo -e "${GREEN}Step 3: Creating Web App...${NC}"
if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Web app already exists, skipping creation...${NC}"
else
    az webapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $PLAN_NAME \
        --runtime "PYTHON:$PYTHON_VERSION"
    echo -e "${GREEN}✓ Web app created${NC}"
fi

echo ""
echo -e "${GREEN}Step 4: Configuring App Settings...${NC}"
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
echo -e "${GREEN}✓ App settings configured${NC}"

echo ""
echo -e "${GREEN}Step 5: Setting Startup Command...${NC}"
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "startup.sh"
echo -e "${GREEN}✓ Startup command set${NC}"

echo ""
echo -e "${GREEN}Step 6: Configuring Health Check...${NC}"
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --health-check-path "/health"
echo -e "${GREEN}✓ Health check configured${NC}"

echo ""
echo -e "${GREEN}Step 6.5: Enabling Always On...${NC}"
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --always-on true
echo -e "${GREEN}✓ Always On enabled (prevents cold starts)${NC}"

echo ""
echo -e "${GREEN}Step 7: Enabling Logging...${NC}"
az webapp log config \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --application-logging filesystem \
    --level information \
    --web-server-logging filesystem
echo -e "${GREEN}✓ Logging enabled${NC}"

echo ""
echo -e "${GREEN}Step 8: Deploying Code...${NC}"
echo "Creating deployment package..."

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Copying files to: $TEMP_DIR"

# Copy necessary files
cp -r ../backend/* $TEMP_DIR/ 2>/dev/null || cp -r ./* $TEMP_DIR/

# Remove unnecessary files
rm -rf $TEMP_DIR/venv $TEMP_DIR/.git $TEMP_DIR/__pycache__ $TEMP_DIR/*.pyc

# Create ZIP
cd $TEMP_DIR
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "*.pyc" > /dev/null

echo "Uploading to Azure..."
az webapp deployment source config-zip \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --src deploy.zip

# Cleanup
cd -
rm -rf $TEMP_DIR

echo -e "${GREEN}✓ Code deployed${NC}"

echo ""
echo -e "${GREEN}Step 9: Restarting App...${NC}"
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
echo -e "${GREEN}✓ App restarted${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${GREEN}Your API is available at:${NC}"
echo "  https://$APP_NAME.azurewebsites.net"
echo ""
echo -e "${GREEN}Health Check:${NC}"
echo "  https://$APP_NAME.azurewebsites.net/health"
echo ""
echo -e "${GREEN}API Documentation:${NC}"
echo "  https://$APP_NAME.azurewebsites.net/api/docs"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure environment variables:"
echo "   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE"
echo ""
echo "2. View logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "3. Set up database connection in environment variables"
echo ""
echo -e "${GREEN}=========================================${NC}"

# Wait a moment for deployment to settle
sleep 5

# Test health endpoint
echo ""
echo -e "${GREEN}Testing deployment...${NC}"
HEALTH_URL="https://$APP_NAME.azurewebsites.net/health"
echo "Checking: $HEALTH_URL"

if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠ Health check pending... App may still be starting up.${NC}"
    echo "Check status in a few minutes or view logs:"
    echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
fi

echo ""
echo -e "${GREEN}All done! 🚀${NC}"
