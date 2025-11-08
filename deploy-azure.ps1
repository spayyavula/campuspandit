# CampusPandit Azure Deployment Script (PowerShell)
# This script sets up the complete Azure infrastructure for the application

param(
    [string]$ResourceGroup = "campuspandit-rg",
    [string]$Location = "eastus",
    [string]$ACRName = "campuspanditcr",
    [string]$ContainerAppEnv = "campuspandit-env",
    [string]$BackendAppName = "campuspandit-backend"
)

# Enable strict mode
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "CampusPandit Azure Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if Azure CLI is installed
Write-Section "Checking Prerequisites"
try {
    $null = az version
    Write-Success "Azure CLI is installed"
} catch {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if Docker is installed
try {
    $null = docker --version
    Write-Success "Docker is installed"
} catch {
    Write-Error "Docker is not installed. Please install it from https://docs.docker.com/get-docker/"
    exit 1
}

# Check if logged in to Azure
Write-Section "Checking Azure Login Status"
try {
    $account = az account show --query name -o tsv
    Write-Success "Already logged in to Azure account: $account"
} catch {
    Write-Warning "Not logged in to Azure. Opening login..."
    az login
}

# Create Resource Group
Write-Section "Creating Resource Group"
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "true") {
    Write-Warning "Resource group '$ResourceGroup' already exists"
} else {
    az group create --name $ResourceGroup --location $Location
    Write-Success "Resource group '$ResourceGroup' created in $Location"
}

# Create Azure Container Registry
Write-Section "Creating Azure Container Registry"
try {
    $null = az acr show --name $ACRName --resource-group $ResourceGroup 2>$null
    Write-Warning "Container Registry '$ACRName' already exists"
} catch {
    az acr create `
        --resource-group $ResourceGroup `
        --name $ACRName `
        --sku Basic `
        --admin-enabled true
    Write-Success "Container Registry '$ACRName' created"
}

# Get ACR credentials
Write-Section "Getting Container Registry Credentials"
$ACRUsername = az acr credential show --name $ACRName --query username -o tsv
$ACRPassword = az acr credential show --name $ACRName --query "passwords[0].value" -o tsv
Write-Success "Container Registry credentials retrieved"

# Create Container Apps Environment
Write-Section "Creating Container Apps Environment"
try {
    $null = az containerapp env show --name $ContainerAppEnv --resource-group $ResourceGroup 2>$null
    Write-Warning "Container Apps Environment '$ContainerAppEnv' already exists"
} catch {
    az containerapp env create `
        --name $ContainerAppEnv `
        --resource-group $ResourceGroup `
        --location $Location
    Write-Success "Container Apps Environment '$ContainerAppEnv' created"
}

# Build and push backend Docker image
Write-Section "Building and Pushing Backend Docker Image"
Push-Location backend

Write-Info "Building Docker image..."
docker build -f Dockerfile.azure -t "$ACRName.azurecr.io/$BackendAppName:latest" .

Write-Info "Logging in to Azure Container Registry..."
az acr login --name $ACRName

Write-Info "Pushing Docker image to registry..."
docker push "$ACRName.azurecr.io/$BackendAppName:latest"
Write-Success "Backend Docker image pushed to registry"

Pop-Location

# Create Container App for Backend
Write-Section "Creating Backend Container App"
try {
    $null = az containerapp show --name $BackendAppName --resource-group $ResourceGroup 2>$null
    Write-Warning "Container App '$BackendAppName' already exists. Updating..."
    az containerapp update `
        --name $BackendAppName `
        --resource-group $ResourceGroup `
        --image "$ACRName.azurecr.io/$BackendAppName:latest"
} catch {
    Write-Info "Enter your database connection string (or press Enter to skip):"
    $DatabaseURL = Read-Host

    Write-Info "Enter your secret key (or press Enter to generate one):"
    $SecretKey = Read-Host
    if ([string]::IsNullOrEmpty($SecretKey)) {
        # Generate random secret key
        $SecretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    }

    az containerapp create `
        --name $BackendAppName `
        --resource-group $ResourceGroup `
        --environment $ContainerAppEnv `
        --image "$ACRName.azurecr.io/$BackendAppName:latest" `
        --target-port 8000 `
        --ingress external `
        --registry-server "$ACRName.azurecr.io" `
        --registry-username $ACRUsername `
        --registry-password $ACRPassword `
        --cpu 0.5 `
        --memory 1.0Gi `
        --min-replicas 0 `
        --max-replicas 3 `
        --env-vars `
            "ENVIRONMENT=production" `
            "DEBUG=false" `
            "SECRET_KEY=$SecretKey" `
            "ALLOWED_ORIGINS=*" `
            "DATABASE_URL=$DatabaseURL"
    Write-Success "Container App '$BackendAppName' created"
}

# Get backend URL
$BackendURL = az containerapp show --name $BackendAppName --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
Write-Success "Backend deployed at: https://$BackendURL"

# Summary
Write-Section "Deployment Summary"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "Resource Group: " -NoNewline -ForegroundColor Blue
Write-Host $ResourceGroup
Write-Host "Location: " -NoNewline -ForegroundColor Blue
Write-Host $Location
Write-Host ""
Write-Host "Backend:" -ForegroundColor Green
Write-Host "  URL: " -NoNewline -ForegroundColor Blue
Write-Host "https://$BackendURL"
Write-Host "  Health: " -NoNewline -ForegroundColor Blue
Write-Host "https://$BackendURL/health"
Write-Host "  API Docs: " -NoNewline -ForegroundColor Blue
Write-Host "https://$BackendURL/api/docs"
Write-Host ""
Write-Host "Container Registry:" -ForegroundColor Green
Write-Host "  Name: " -NoNewline -ForegroundColor Blue
Write-Host "$ACRName.azurecr.io"
Write-Host "  Username: " -NoNewline -ForegroundColor Blue
Write-Host $ACRUsername
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Yellow
Write-Host "  Setup required via Azure Portal or GitHub Actions"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Success "Deployment script completed!"
Write-Host ""
Write-Info "Next steps:"
Write-Info "1. Set up frontend Static Web App via Azure Portal"
Write-Info "2. Configure GitHub secrets for CI/CD"
Write-Info "3. Add environment variables via Azure Portal"
Write-Info "4. Test your endpoints"
Write-Host ""
