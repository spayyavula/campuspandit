#!/bin/bash
# Azure App Service Startup Script for CampusPandit FastAPI Backend

echo "=========================================="
echo "CampusPandit Backend - Starting..."
echo "=========================================="

# Check Python version
python --version

# Install dependencies if not cached
if [ ! -d "/home/site/wwwroot/venv" ]; then
    echo "Creating virtual environment..."
    python -m venv /home/site/wwwroot/venv
fi

# Activate virtual environment
source /home/site/wwwroot/venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run database migrations (if needed)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Migration skipped or failed"
fi

# Start the application
echo "Starting FastAPI application..."
echo "Host: 0.0.0.0"
echo "Port: 8000"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Start Uvicorn with production settings
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --timeout-keep-alive 75 \
    --log-level info \
    --no-access-log
