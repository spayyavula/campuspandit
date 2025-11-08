# CampusPandit Database Reset Script (PowerShell)
# This script deletes and recreates the database from scratch
# WARNING: This will DELETE ALL DATA in the database!

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "campuspandit-rg"
$DB_SERVER_NAME = "campuspandit-db"
$DB_NAME = "campuspandit"

Write-Host "========================================" -ForegroundColor Red
Write-Host "⚠️  DATABASE RESET WARNING ⚠️" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. DELETE the database '$DB_NAME'"
Write-Host "  2. REMOVE all tables, data, and schemas"
Write-Host "  3. CREATE a fresh empty database"
Write-Host ""
Write-Host "⚠️  ALL DATA WILL BE PERMANENTLY LOST!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Are you ABSOLUTELY SURE you want to continue? Type 'DELETE' to confirm"

if ($confirm -ne "DELETE") {
    Write-Host "✓ Operation cancelled. Database unchanged." -ForegroundColor Green
    exit 0
}

Write-Host ""
$dbConfirm = Read-Host "Final confirmation: Type the database name '$DB_NAME' to proceed"

if ($dbConfirm -ne $DB_NAME) {
    Write-Host "✓ Operation cancelled. Database unchanged." -ForegroundColor Green
    exit 0
}

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Azure CLI is not installed" -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
try {
    az account show 2>$null | Out-Null
}
catch {
    Write-Host "⚠ Not logged in to Azure. Opening login..." -ForegroundColor Yellow
    az login
}

# Check if database exists
Write-Host ""
Write-Host "==> Checking if database exists" -ForegroundColor Blue
try {
    az postgres flexible-server db show --database-name $DB_NAME --server-name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
}
catch {
    Write-Host "⚠ Database '$DB_NAME' does not exist. Nothing to reset." -ForegroundColor Yellow
    exit 0
}

# Delete database
Write-Host ""
Write-Host "==> Deleting database '$DB_NAME'" -ForegroundColor Red
az postgres flexible-server db delete `
    --database-name $DB_NAME `
    --server-name $DB_SERVER_NAME `
    --resource-group $RESOURCE_GROUP `
    --yes

Write-Host "✓ Database deleted" -ForegroundColor Green

# Wait for deletion to complete
Write-Host "ℹ Waiting for deletion to complete..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Create fresh database
Write-Host ""
Write-Host "==> Creating fresh database '$DB_NAME'" -ForegroundColor Blue
az postgres flexible-server db create `
    --database-name $DB_NAME `
    --server-name $DB_SERVER_NAME `
    --resource-group $RESOURCE_GROUP

Write-Host "✓ Fresh database created" -ForegroundColor Green

# Get connection details
Write-Host ""
Write-Host "==> Getting connection details" -ForegroundColor Blue
$DB_HOST = az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP --query fullyQualifiedDomainName -o tsv

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "Database Reset Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Database Server: $DB_SERVER_NAME" -ForegroundColor Blue
Write-Host "Database Name: $DB_NAME" -ForegroundColor Blue
Write-Host "Database Host: $DB_HOST" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run the migration script to set up schema:"
Write-Host "   psql `"CONNECTION_STRING`" < database/azure-postgresql-migration.sql" -ForegroundColor Green
Write-Host ""
Write-Host "2. Or import your backup:"
Write-Host "   psql `"CONNECTION_STRING`" < backup.sql" -ForegroundColor Green
Write-Host ""
Write-Host "3. Get your connection string from:"
Write-Host "   azure-postgresql-connection.txt" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
