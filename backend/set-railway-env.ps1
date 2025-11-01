# Railway Environment Variables Setup Script (PowerShell)
# Run this after railway login and railway init

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Setting Railway Environment Variables" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Required variables
Write-Host "Setting required variables..." -ForegroundColor Yellow

railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set APP_NAME="CampusPandit"

# Generate a secure secret key
Write-Host ""
Write-Host "Generating SECRET_KEY..." -ForegroundColor Yellow
$SECRET_KEY = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
railway variables set SECRET_KEY="$SECRET_KEY"
Write-Host "✓ SECRET_KEY generated and set" -ForegroundColor Green

# Prompt for other required variables
Write-Host ""
Write-Host "Please enter your API keys and credentials:" -ForegroundColor Yellow
Write-Host ""

$DATABASE_URL = Read-Host "DATABASE_URL (press Enter to skip if using Railway PostgreSQL)"
if ($DATABASE_URL) {
    railway variables set DATABASE_URL="$DATABASE_URL"
}

$ALLOWED_ORIGINS = Read-Host "ALLOWED_ORIGINS (e.g., https://campuspandit.com)"
if ($ALLOWED_ORIGINS) {
    railway variables set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
}

$OPENAI_API_KEY = Read-Host "OPENAI_API_KEY (sk-...)"
if ($OPENAI_API_KEY) {
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
}

$ANTHROPIC_API_KEY = Read-Host "ANTHROPIC_API_KEY"
if ($ANTHROPIC_API_KEY) {
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
}

$STRIPE_SECRET_KEY = Read-Host "STRIPE_SECRET_KEY"
if ($STRIPE_SECRET_KEY) {
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
}

$STRIPE_PUBLISHABLE_KEY = Read-Host "STRIPE_PUBLISHABLE_KEY"
if ($STRIPE_PUBLISHABLE_KEY) {
    railway variables set STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
}

$SENDGRID_API_KEY = Read-Host "SENDGRID_API_KEY"
if ($SENDGRID_API_KEY) {
    railway variables set SENDGRID_API_KEY="$SENDGRID_API_KEY"
}

$FROM_EMAIL = Read-Host "FROM_EMAIL (e.g., noreply@campuspandit.com)"
if ($FROM_EMAIL) {
    railway variables set FROM_EMAIL="$FROM_EMAIL"
}

$TWILIO_ACCOUNT_SID = Read-Host "TWILIO_ACCOUNT_SID (optional)"
if ($TWILIO_ACCOUNT_SID) {
    railway variables set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
}

$TWILIO_AUTH_TOKEN = Read-Host "TWILIO_AUTH_TOKEN (optional)"
if ($TWILIO_AUTH_TOKEN) {
    railway variables set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
}

$TWILIO_PHONE_NUMBER = Read-Host "TWILIO_PHONE_NUMBER (optional)"
if ($TWILIO_PHONE_NUMBER) {
    railway variables set TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If you haven't deployed yet, run: railway up"
Write-Host "2. Generate a public domain: railway domain"
Write-Host "3. View your app: railway open"
Write-Host "4. Check logs: railway logs"
Write-Host ""
