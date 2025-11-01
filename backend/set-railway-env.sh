#!/bin/bash
# Railway Environment Variables Setup Script
# Run this after railway login and railway init

echo "=========================================="
echo "Setting Railway Environment Variables"
echo "=========================================="
echo ""

# Required variables
echo "Setting required variables..."

railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set APP_NAME="CampusPandit"

# Generate a secure secret key
echo ""
echo "Generating SECRET_KEY..."
SECRET_KEY=$(openssl rand -hex 32)
railway variables set SECRET_KEY="$SECRET_KEY"
echo "✓ SECRET_KEY generated and set"

# Prompt for other required variables
echo ""
echo "Please enter your API keys and credentials:"
echo ""

read -p "DATABASE_URL (press Enter to skip if using Railway PostgreSQL): " DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    railway variables set DATABASE_URL="$DATABASE_URL"
fi

read -p "ALLOWED_ORIGINS (e.g., https://campuspandit.com): " ALLOWED_ORIGINS
if [ ! -z "$ALLOWED_ORIGINS" ]; then
    railway variables set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
fi

read -p "OPENAI_API_KEY (sk-...): " OPENAI_API_KEY
if [ ! -z "$OPENAI_API_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
fi

read -p "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
fi

read -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
fi

read -p "STRIPE_PUBLISHABLE_KEY: " STRIPE_PUBLISHABLE_KEY
if [ ! -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    railway variables set STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
fi

read -p "SENDGRID_API_KEY: " SENDGRID_API_KEY
if [ ! -z "$SENDGRID_API_KEY" ]; then
    railway variables set SENDGRID_API_KEY="$SENDGRID_API_KEY"
fi

read -p "FROM_EMAIL (e.g., noreply@campuspandit.com): " FROM_EMAIL
if [ ! -z "$FROM_EMAIL" ]; then
    railway variables set FROM_EMAIL="$FROM_EMAIL"
fi

read -p "TWILIO_ACCOUNT_SID (optional): " TWILIO_ACCOUNT_SID
if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
    railway variables set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
fi

read -p "TWILIO_AUTH_TOKEN (optional): " TWILIO_AUTH_TOKEN
if [ ! -z "$TWILIO_AUTH_TOKEN" ]; then
    railway variables set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
fi

read -p "TWILIO_PHONE_NUMBER (optional): " TWILIO_PHONE_NUMBER
if [ ! -z "$TWILIO_PHONE_NUMBER" ]; then
    railway variables set TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"
fi

echo ""
echo "=========================================="
echo "Environment variables set successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If you haven't deployed yet, run: railway up"
echo "2. Generate a public domain: railway domain"
echo "3. View your app: railway open"
echo "4. Check logs: railway logs"
echo ""
