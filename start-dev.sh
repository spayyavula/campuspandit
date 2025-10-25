#!/bin/bash

# CampusPandit Development Startup Script
# This script starts the backend server and then the mobile app

set -e  # Exit on error

echo "========================================"
echo "CampusPandit Development Environment"
echo "========================================"
echo ""

# Check if we're in the correct directory
if [ ! -d "backend" ]; then
    echo "ERROR: backend directory not found"
    echo "Please run this script from the campuspandit root directory"
    exit 1
fi

if [ ! -d "mobile-app" ]; then
    echo "ERROR: mobile-app directory not found"
    echo "Please run this script from the campuspandit root directory"
    exit 1
fi

echo "[1/3] Checking Python backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing/Updating Python dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "[2/3] Starting Backend Server..."
echo "Backend will run on: http://192.168.1.47:8000"
echo "API Docs available at: http://192.168.1.47:8000/docs"
echo ""

# Start backend in background
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Waiting for backend to initialize..."
sleep 5

cd ..

echo ""
echo "[3/3] Starting Mobile App (Expo)..."
echo ""

cd mobile-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing mobile app dependencies..."
    npm install
fi

echo "Starting Expo development server..."
echo "Scan the QR code with Expo Go app on your phone"
echo ""

# Trap Ctrl+C to kill backend when stopping mobile app
trap "echo 'Stopping backend...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM

# Start mobile app (this will run in foreground)
npm start

# If npm start exits, kill backend
kill $BACKEND_PID 2>/dev/null
