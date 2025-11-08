# CampusPandit Azure PostgreSQL Deployment Script (PowerShell)
# This script provisions Azure Database for PostgreSQL Flexible Server

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "campuspandit-rg"
$LOCATION = "eastus"
$DB_SERVER_NAME = "campuspandit-db"
$DB_NAME = "campuspandit"
$DB_ADMIN_USER = "cpandit_admin"
$DB_SKU = "Standard_B1ms"  # Burstable SKU (cheapest option ~$12-15/month)
$DB_STORAGE_SIZE = 32      # GB
$DB_VERSION = "16"         # PostgreSQL 16

Write-Host "========================================"
Write-Host "CampusPandit Azure PostgreSQL Setup"
Write-Host "========================================"
Write-Host ""

function Write-Section($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "ℹ $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Err($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Err "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

Write-Success "Azure CLI is installed"

# Check if logged in to Azure
Write-Section "Checking Azure Login Status"
try {
    $account = az account show | ConvertFrom-Json
    Write-Success "Already logged in to Azure account: $($account.name)"
}
catch {
    Write-Warning "Not logged in to Azure. Opening login..."
    az login
}

# Prompt for database admin password
Write-Section "Database Configuration"
do {
    $securePassword = Read-Host "Enter database admin password (min 8 characters, must include uppercase, lowercase, and numbers)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DB_ADMIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

    if ($DB_ADMIN_PASSWORD.Length -ge 8 -and
        $DB_ADMIN_PASSWORD -cmatch '[A-Z]' -and
        $DB_ADMIN_PASSWORD -cmatch '[a-z]' -and
        $DB_ADMIN_PASSWORD -match '[0-9]') {
        break
    }
    else {
        Write-Err "Password does not meet requirements. Please try again."
    }
} while ($true)

# Create Resource Group (if not exists)
Write-Section "Creating Resource Group"
try {
    az group show --name $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "Resource group '$RESOURCE_GROUP' already exists"
}
catch {
    az group create --name $RESOURCE_GROUP --location $LOCATION
    Write-Success "Resource group '$RESOURCE_GROUP' created in $LOCATION"
}

# Create Azure PostgreSQL Flexible Server
Write-Section "Creating PostgreSQL Flexible Server"
Write-Info "This may take 5-10 minutes..."

try {
    az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "PostgreSQL server '$DB_SERVER_NAME' already exists"
}
catch {
    az postgres flexible-server create `
        --name $DB_SERVER_NAME `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --admin-user $DB_ADMIN_USER `
        --admin-password "$DB_ADMIN_PASSWORD" `
        --sku-name $DB_SKU `
        --storage-size $DB_STORAGE_SIZE `
        --version $DB_VERSION `
        --public-access 0.0.0.0 `
        --tier Burstable `
        --yes

    Write-Success "PostgreSQL server '$DB_SERVER_NAME' created"
}

# Check if database exists and prompt for deletion
Write-Section "Checking Database"
try {
    az postgres flexible-server db show --database-name $DB_NAME --server-name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "Database '$DB_NAME' already exists"
    Write-Host ""
    Write-Host "⚠  WARNING: This will DELETE all data in the database!" -ForegroundColor Yellow
    $deleteConfirm = Read-Host "Do you want to DELETE and RECREATE the database from scratch? (yes/no)"

    if ($deleteConfirm -eq "yes") {
        Write-Section "Deleting Existing Database"
        Write-Warning "Deleting database '$DB_NAME'..."

        az postgres flexible-server db delete `
            --database-name $DB_NAME `
            --server-name $DB_SERVER_NAME `
            --resource-group $RESOURCE_GROUP `
            --yes

        Write-Success "Database '$DB_NAME' deleted"

        # Wait a moment for deletion to complete
        Start-Sleep -Seconds 2

        # Create fresh database
        Write-Section "Creating Fresh Database"
        az postgres flexible-server db create `
            --database-name $DB_NAME `
            --server-name $DB_SERVER_NAME `
            --resource-group $RESOURCE_GROUP

        Write-Success "Fresh database '$DB_NAME' created"
    }
    else {
        Write-Info "Keeping existing database '$DB_NAME'"
    }
}
catch {
    # Create database (first time)
    Write-Section "Creating Database"
    az postgres flexible-server db create `
        --database-name $DB_NAME `
        --server-name $DB_SERVER_NAME `
        --resource-group $RESOURCE_GROUP

    Write-Success "Database '$DB_NAME' created"
}

# Configure firewall rule to allow Azure services
Write-Section "Configuring Firewall Rules"
az postgres flexible-server firewall-rule create `
    --name AllowAzureServices `
    --resource-group $RESOURCE_GROUP `
    --server-name $DB_SERVER_NAME `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    2>$null | Out-Null

Write-Success "Firewall rule created to allow Azure services"

# Get connection details
Write-Section "Getting Connection Details"
$DB_HOST = az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query fullyQualifiedDomainName -o tsv

# Build connection strings
$CONNECTION_STRING = "postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
$ASYNC_CONNECTION_STRING = "postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"

# Summary
Write-Section "Deployment Summary"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "Database Server: $DB_SERVER_NAME" -ForegroundColor Blue
Write-Host "Database Name: $DB_NAME" -ForegroundColor Blue
Write-Host "Database Host: $DB_HOST" -ForegroundColor Blue
Write-Host "Admin User: $DB_ADMIN_USER" -ForegroundColor Blue
Write-Host "PostgreSQL Version: $DB_VERSION" -ForegroundColor Blue
Write-Host ""
Write-Host "Connection Strings:" -ForegroundColor Green
Write-Host ""
Write-Host "Standard (for psql):" -ForegroundColor Yellow
Write-Host "$CONNECTION_STRING" -ForegroundColor Blue
Write-Host ""
Write-Host "Async (for Python FastAPI backend):" -ForegroundColor Yellow
Write-Host "$ASYNC_CONNECTION_STRING" -ForegroundColor Blue
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Save connection strings to file
$connectionDetails = @"
# CampusPandit Azure PostgreSQL Connection Details
# Generated: $(Get-Date)

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
"@

$connectionDetails | Out-File -FilePath "azure-postgresql-connection.txt" -Encoding UTF8

Write-Success "Connection details saved to: azure-postgresql-connection.txt"
Write-Host ""

Write-Section "Next Steps"
Write-Info "1. Run the migration script to set up database schema:"
Write-Host "   psql `"$CONNECTION_STRING`" < database/azure-postgresql-migration.sql" -ForegroundColor Yellow
Write-Host ""
Write-Info "2. Update your backend Container App with the new DATABASE_URL:"
Write-Host "   az containerapp update ``" -ForegroundColor Yellow
Write-Host "     --name campuspandit-backend ``" -ForegroundColor Yellow
Write-Host "     --resource-group $RESOURCE_GROUP ``" -ForegroundColor Yellow
Write-Host "     --set-env-vars `"DATABASE_URL=$ASYNC_CONNECTION_STRING`"" -ForegroundColor Yellow
Write-Host ""
Write-Info "3. Update your local .env file with the DATABASE_URL above"
Write-Host ""
Write-Info "4. Test the connection and verify the migration"
Write-Host ""

Write-Success "PostgreSQL deployment completed!"
Write-Host ""
Write-Warning "IMPORTANT: Keep your connection details secure!"
Write-Warning "Add azure-postgresql-connection.txt to .gitignore"
