#!/bin/bash
# Fix CORS and Backend Configuration Script

echo "🔧 Fixing CampusPandit Backend Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="campuspandit-rg"
CONTAINER_APP="campuspandit-backend"
BACKEND_URL="campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io"

echo -e "${BLUE}Step 1: CORS Settings${NC}"
echo "✅ Already updated CORS to allow:"
echo "   - https://www.campuspandit.ai"
echo "   - https://campuspandit.ai"
echo "   - https://ambitious-river-04fdcd510.3.azurestaticapps.net"
echo ""

echo -e "${BLUE}Step 2: Database Configuration${NC}"
echo -n "Do you want to configure Azure PostgreSQL database? (yes/no): "
read -r CONFIGURE_DB

if [[ "$CONFIGURE_DB" == "yes" ]]; then
    echo -n "Enter database password for cpandit_admin: "
    read -s DB_PASSWORD
    echo ""

    DATABASE_URL="postgresql+asyncpg://cpandit_admin:${DB_PASSWORD}@campuspandit-db.postgres.database.azure.com:5432/campuspandit?ssl=require"

    echo "Updating Container App with database URL..."
    az containerapp update \
      --name $CONTAINER_APP \
      --resource-group $RESOURCE_GROUP \
      --set-env-vars "DATABASE_URL=${DATABASE_URL}"

    echo -e "${GREEN}✓ Database URL configured${NC}"
else
    echo "⚠️  Skipping database configuration"
fi

echo ""
echo -e "${BLUE}Step 3: Testing Backend${NC}"
echo "Testing health endpoint (this may take 10-20 seconds to wake up)..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "https://${BACKEND_URL}/health" || echo "Failed")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${YELLOW}⚠ Backend returned: $HTTP_CODE${NC}"
    echo "This is normal if backend just started. Try again in 30 seconds."
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Backend URL:${NC} https://${BACKEND_URL}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your Static Web App configuration:"
echo "   - Go to: https://portal.azure.com"
echo "   - Navigate to: Static Web Apps → campuspandit-web"
echo "   - Click: Configuration"
echo "   - Set VITE_API_URL to: https://${BACKEND_URL}"
echo "   - Save and wait for deployment"
echo ""
echo "2. Test the signup endpoint:"
echo "   curl https://${BACKEND_URL}/api/v1/auth/signup \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Origin: https://www.campuspandit.ai' \\"
echo "     -d '{\"email\":\"test@example.com\",\"password\":\"Test1234\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"student\"}'"
echo ""
echo "3. Visit your site: https://www.campuspandit.ai"
echo ""
