#!/bin/bash

# CampusPandit Azure PostgreSQL Deployment Script
# This script provisions Azure Database for PostgreSQL Flexible Server

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
DB_SERVER_NAME="campuspandit-db"
DB_NAME="campuspandit"
DB_ADMIN_USER="cpandit_admin"
DB_SKU="Standard_B1ms"  # Burstable SKU (cheapest option ~$12-15/month)
DB_STORAGE_SIZE=32      # GB
DB_VERSION="16"         # PostgreSQL 16

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CampusPandit Azure PostgreSQL Setup${NC}"
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

# Prompt for database admin password
print_section "Database Configuration"
while true; do
    echo -n "Enter database admin password (min 8 characters, must include uppercase, lowercase, and numbers): "
    read -s DB_ADMIN_PASSWORD
    echo ""

    if [[ ${#DB_ADMIN_PASSWORD} -ge 8 ]] && [[ "$DB_ADMIN_PASSWORD" =~ [A-Z] ]] && [[ "$DB_ADMIN_PASSWORD" =~ [a-z] ]] && [[ "$DB_ADMIN_PASSWORD" =~ [0-9] ]]; then
        break
    else
        print_error "Password does not meet requirements. Please try again."
    fi
done

# Create Resource Group (if not exists)
print_section "Creating Resource Group"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    print_success "Resource group '$RESOURCE_GROUP' created in $LOCATION"
fi

# Create Azure PostgreSQL Flexible Server
print_section "Creating PostgreSQL Flexible Server"
print_info "This may take 5-10 minutes..."

if az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "PostgreSQL server '$DB_SERVER_NAME' already exists"
else
    az postgres flexible-server create \
        --name $DB_SERVER_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --admin-user $DB_ADMIN_USER \
        --admin-password "$DB_ADMIN_PASSWORD" \
        --sku-name $DB_SKU \
        --storage-size $DB_STORAGE_SIZE \
        --version $DB_VERSION \
        --public-access 0.0.0.0 \
        --tier Burstable \
        --yes

    print_success "PostgreSQL server '$DB_SERVER_NAME' created"
fi

# Check if database exists and prompt for deletion
print_section "Checking Database"
if az postgres flexible-server db show --database-name $DB_NAME --server-name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Database '$DB_NAME' already exists"
    echo ""
    echo -e "${YELLOW}⚠  WARNING: This will DELETE all data in the database!${NC}"
    echo -n "Do you want to DELETE and RECREATE the database from scratch? (yes/no): "
    read -r DELETE_CONFIRM

    if [[ "$DELETE_CONFIRM" == "yes" ]]; then
        print_section "Deleting Existing Database"
        print_warning "Deleting database '$DB_NAME'..."

        az postgres flexible-server db delete \
            --database-name $DB_NAME \
            --server-name $DB_SERVER_NAME \
            --resource-group $RESOURCE_GROUP \
            --yes

        print_success "Database '$DB_NAME' deleted"

        # Wait a moment for deletion to complete
        sleep 2

        # Create fresh database
        print_section "Creating Fresh Database"
        az postgres flexible-server db create \
            --database-name $DB_NAME \
            --server-name $DB_SERVER_NAME \
            --resource-group $RESOURCE_GROUP

        print_success "Fresh database '$DB_NAME' created"
    else
        print_info "Keeping existing database '$DB_NAME'"
    fi
else
    # Create database (first time)
    print_section "Creating Database"
    az postgres flexible-server db create \
        --database-name $DB_NAME \
        --server-name $DB_SERVER_NAME \
        --resource-group $RESOURCE_GROUP

    print_success "Database '$DB_NAME' created"
fi

# Configure firewall rule to allow Azure services
print_section "Configuring Firewall Rules"
az postgres flexible-server firewall-rule create \
    --name AllowAzureServices \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_SERVER_NAME \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    > /dev/null 2>&1

print_success "Firewall rule created to allow Azure services"

# Get connection details
print_section "Getting Connection Details"
DB_HOST=$(az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query fullyQualifiedDomainName -o tsv)

# Build connection strings
CONNECTION_STRING="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
ASYNC_CONNECTION_STRING="postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"

# Summary
print_section "Deployment Summary"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Database Server:${NC} $DB_SERVER_NAME"
echo -e "${BLUE}Database Name:${NC} $DB_NAME"
echo -e "${BLUE}Database Host:${NC} $DB_HOST"
echo -e "${BLUE}Admin User:${NC} $DB_ADMIN_USER"
echo -e "${BLUE}PostgreSQL Version:${NC} $DB_VERSION"
echo ""
echo -e "${GREEN}Connection Strings:${NC}"
echo ""
echo -e "${YELLOW}Standard (for psql):${NC}"
echo -e "${BLUE}$CONNECTION_STRING${NC}"
echo ""
echo -e "${YELLOW}Async (for Python FastAPI backend):${NC}"
echo -e "${BLUE}$ASYNC_CONNECTION_STRING${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Save connection strings to file
cat > azure-postgresql-connection.txt <<EOF
# CampusPandit Azure PostgreSQL Connection Details
# Generated: $(date)

Database Server: $DB_SERVER_NAME
Database Name: $DB_NAME
Database Host: $DB_HOST
Admin User: $DB_ADMIN_USER
PostgreSQL Version: $DB_VERSION

# Standard Connection String (for psql):
$CONNECTION_STRING

# Async Connection String (for Python FastAPI backend - use this in .env):
DATABASE_URL=$ASYNC_CONNECTION_STRING

# Connect using psql:
psql "$CONNECTION_STRING"

# Azure Portal:
https://portal.azure.com/#resource/subscriptions/SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DBforPostgreSQL/flexibleServers/$DB_SERVER_NAME/overview
EOF

print_success "Connection details saved to: azure-postgresql-connection.txt"
echo ""

print_section "Next Steps"
print_info "1. Run the migration script to set up database schema:"
print_info "   ${YELLOW}psql \"$CONNECTION_STRING\" < database/azure-postgresql-migration.sql${NC}"
echo ""
print_info "2. Update your backend Container App with the new DATABASE_URL:"
print_info "   ${YELLOW}az containerapp update \\${NC}"
print_info "   ${YELLOW}  --name campuspandit-backend \\${NC}"
print_info "   ${YELLOW}  --resource-group $RESOURCE_GROUP \\${NC}"
print_info "   ${YELLOW}  --set-env-vars \"DATABASE_URL=$ASYNC_CONNECTION_STRING\"${NC}"
echo ""
print_info "3. Update your local .env file with the DATABASE_URL above"
echo ""
print_info "4. Test the connection and verify the migration"
echo ""

print_success "PostgreSQL deployment completed!"
echo ""
print_warning "IMPORTANT: Keep your connection details secure!"
print_warning "Add azure-postgresql-connection.txt to .gitignore"
