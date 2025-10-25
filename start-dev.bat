@echo off
REM CampusPandit Development Startup Script
REM This script starts the backend server and then the mobile app

echo ========================================
echo CampusPandit Development Environment
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found
    echo Please run this script from the campuspandit root directory
    pause
    exit /b 1
)

if not exist "mobile-app" (
    echo ERROR: mobile-app directory not found
    echo Please run this script from the campuspandit root directory
    pause
    exit /b 1
)

echo [1/3] Checking Python backend dependencies...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing/Updating Python dependencies...
pip install -r requirements.txt --quiet

echo.
echo [2/3] Starting Backend Server...
echo Backend will run on: http://192.168.1.47:8000
echo API Docs available at: http://192.168.1.47:8000/docs
echo.

REM Start backend in a new window
start "CampusPandit Backend" cmd /k "cd /d %cd% && venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

cd ..

echo.
echo [3/3] Starting Mobile App (Expo)...
echo.

cd mobile-app

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing mobile app dependencies...
    call npm install
)

echo Starting Expo development server...
echo Scan the QR code with Expo Go app on your phone
echo.

REM Start mobile app in the same window
call npm start

echo.
echo ========================================
echo Both services are now running!
echo ========================================
echo.
echo Press Ctrl+C to stop the mobile app
echo Close the "CampusPandit Backend" window to stop the backend
echo.
pause
