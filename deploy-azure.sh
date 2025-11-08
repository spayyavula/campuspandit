#!/bin/bash

# CampusPandit Azure Deployment Script
# This script sets up the complete Azure infrastructure for the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="campuspandit-rg"
LOCATION="eastus"
ACR_NAME="campuspanditcr"
CONTAINER_APP_ENV="campuspandit-env"
BACKEND_APP_NAME="campuspandit-backend"
STATIC_WEB_APP_NAME="campuspandit-frontend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CampusPandit Azure Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${GREEN}==>${NC} $1"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

print_success "Azure CLI is installed"

# Check if logged in to Azure
print_section "Checking Azure Login Status"
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Opening login..."
    az login
else
    ACCOUNT=$(az account show --query name -o tsv)
    print_success "Already logged in to Azure account: $ACCOUNT"
fi

# Create Resource Group
print_section "Creating Resource Group"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    print_success "Resource group '$RESOURCE_GROUP' created in $LOCATION"
fi

# Create Azure Container Registry
print_section "Creating Azure Container Registry"
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Container Registry '$ACR_NAME' already exists"
else
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
    print_success "Container Registry '$ACR_NAME' created"
fi

# Get ACR credentials
print_section "Getting Container Registry Credentials"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
print_success "Container Registry credentials retrieved"

# Create Container Apps Environment
print_section "Creating Container Apps Environment"
if az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Container Apps Environment '$CONTAINER_APP_ENV' already exists"
else
    az containerapp env create \
        --name $CONTAINER_APP_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
    print_success "Container Apps Environment '$CONTAINER_APP_ENV' created"
fi

# Build and push backend Docker image
print_section "Building and Pushing Backend Docker Image"
cd backend
print_info "Building Docker image..."
docker build -f Dockerfile.azure -t $ACR_NAME.azurecr.io/$BACKEND_APP_NAME:latest .

print_info "Logging in to Azure Container Registry..."
az acr login --name $ACR_NAME

print_info "Pushing Docker image to registry..."
docker push $ACR_NAME.azurecr.io/$BACKEND_APP_NAME:latest
print_success "Backend Docker image pushed to registry"
cd ..

# Create Container App for Backend
print_section "Creating Backend Container App"
if az containerapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Container App '$BACKEND_APP_NAME' already exists. Updating..."
    az containerapp update \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $ACR_NAME.azurecr.io/$BACKEND_APP_NAME:latest
else
    print_info "Enter your database connection string (or press Enter to skip):"
    read -r DATABASE_URL

    print_info "Enter your secret key (or press Enter to generate one):"
    read -r SECRET_KEY
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(openssl rand -hex 32)
    fi

    az containerapp create \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_APP_ENV \
        --image $ACR_NAME.azurecr.io/$BACKEND_APP_NAME:latest \
        --target-port 8000 \
        --ingress external \
        --registry-server $ACR_NAME.azurecr.io \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --cpu 0.5 \
        --memory 1.0Gi \
        --min-replicas 0 \
        --max-replicas 3 \
        --env-vars \
            "ENVIRONMENT=production" \
            "DEBUG=false" \
            "SECRET_KEY=$SECRET_KEY" \
            "ALLOWED_ORIGINS=*" \
            "DATABASE_URL=$DATABASE_URL"
fi

# Get backend URL
BACKEND_URL=$(az containerapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
print_success "Backend deployed at: https://$BACKEND_URL"

# Create Static Web App for Frontend
print_section "Creating Static Web App for Frontend"
print_warning "Static Web App requires GitHub integration."
print_info "Please create the Static Web App manually through Azure Portal or use GitHub Actions."
print_info "The workflow file is already created at: .github/workflows/azure-static-web-apps.yml"
print_info ""
print_info "Quick setup:"
print_info "1. Go to Azure Portal: https://portal.azure.com"
print_info "2. Create a Static Web App"
print_info "3. Connect your GitHub repository"
print_info "4. Use these settings:"
print_info "   - App location: /"
print_info "   - Output location: dist"
print_info "   - Build preset: React"

# Summary
print_section "Deployment Summary"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${BLUE}Location:${NC} $LOCATION"
echo ""
echo -e "${GREEN}Backend:${NC}"
echo -e "  URL: ${BLUE}https://$BACKEND_URL${NC}"
echo -e "  Health: ${BLUE}https://$BACKEND_URL/health${NC}"
echo -e "  API Docs: ${BLUE}https://$BACKEND_URL/api/docs${NC}"
echo ""
echo -e "${GREEN}Container Registry:${NC}"
echo -e "  Name: ${BLUE}$ACR_NAME.azurecr.io${NC}"
echo -e "  Username: ${BLUE}$ACR_USERNAME${NC}"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
echo -e "  Setup required via Azure Portal or GitHub Actions"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_success "Deployment script completed!"
echo ""
print_info "Next steps:"
print_info "1. Set up frontend Static Web App via Azure Portal"
print_info "2. Configure GitHub secrets for CI/CD"
print_info "3. Add environment variables via Azure Portal"
print_info "4. Test your endpoints"
echo ""
