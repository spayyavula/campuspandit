#!/bin/bash

# CampusPandit Database Reset Script
# This script deletes and recreates the database from scratch
# WARNING: This will DELETE ALL DATA in the database!

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="campuspandit-rg"
DB_SERVER_NAME="campuspandit-db"
DB_NAME="campuspandit"

echo -e "${RED}========================================${NC}"
echo -e "${RED}⚠️  DATABASE RESET WARNING ⚠️${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo -e "  1. DELETE the database '${DB_NAME}'"
echo -e "  2. REMOVE all tables, data, and schemas"
echo -e "  3. CREATE a fresh empty database"
echo ""
echo -e "${RED}⚠️  ALL DATA WILL BE PERMANENTLY LOST!${NC}"
echo ""
echo -n "Are you ABSOLUTELY SURE you want to continue? Type 'DELETE' to confirm: "
read -r CONFIRM

if [[ "$CONFIRM" != "DELETE" ]]; then
    echo -e "${GREEN}✓${NC} Operation cancelled. Database unchanged."
    exit 0
fi

echo ""
echo -e "${YELLOW}Final confirmation: Type the database name '${DB_NAME}' to proceed:${NC} "
read -r DB_CONFIRM

if [[ "$DB_CONFIRM" != "$DB_NAME" ]]; then
    echo -e "${GREEN}✓${NC} Operation cancelled. Database unchanged."
    exit 0
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}✗${NC} Azure CLI is not installed"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not logged in to Azure. Opening login..."
    az login
fi

# Check if database exists
echo ""
echo -e "${BLUE}==> Checking if database exists${NC}"
if ! az postgres flexible-server db show --database-name $DB_NAME --server-name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Database '$DB_NAME' does not exist. Nothing to reset."
    exit 0
fi

# Delete database
echo ""
echo -e "${RED}==> Deleting database '$DB_NAME'${NC}"
az postgres flexible-server db delete \
    --database-name $DB_NAME \
    --server-name $DB_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --yes

echo -e "${GREEN}✓${NC} Database deleted"

# Wait for deletion to complete
echo -e "${BLUE}ℹ${NC} Waiting for deletion to complete..."
sleep 3

# Create fresh database
echo ""
echo -e "${BLUE}==> Creating fresh database '$DB_NAME'${NC}"
az postgres flexible-server db create \
    --database-name $DB_NAME \
    --server-name $DB_SERVER_NAME \
    --resource-group $RESOURCE_GROUP

echo -e "${GREEN}✓${NC} Fresh database created"

# Get connection details
echo ""
echo -e "${BLUE}==> Getting connection details${NC}"
DB_HOST=$(az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query fullyQualifiedDomainName -o tsv)

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Database Reset Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Database Server:${NC} $DB_SERVER_NAME"
echo -e "${BLUE}Database Name:${NC} $DB_NAME"
echo -e "${BLUE}Database Host:${NC} $DB_HOST"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "1. Run the migration script to set up schema:"
echo -e "   ${GREEN}psql \"CONNECTION_STRING\" < database/azure-postgresql-migration.sql${NC}"
echo ""
echo -e "2. Or import your backup:"
echo -e "   ${GREEN}psql \"CONNECTION_STRING\" < backup.sql${NC}"
echo ""
echo -e "3. Get your connection string from:"
echo -e "   ${GREEN}azure-postgresql-connection.txt${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
