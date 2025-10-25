# 🚀 Quick Start Guide

This guide helps you start both the backend and mobile app with a single command.

## One-Command Startup

### Windows
```bash
start-dev.bat
```

### Mac/Linux
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## What the Script Does

1. **Checks dependencies** - Ensures Python virtual environment and Node modules exist
2. **Starts backend** - Launches FastAPI server on http://192.168.1.47:8000
3. **Starts mobile app** - Launches Expo development server

## First Time Setup

### Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** and npm installed
- **Git** installed

### Installation Steps

1. **Clone and navigate to project:**
   ```bash
   cd D:\downloads\campuspandit\campuspandit
   ```

2. **Run the startup script:**
   - Windows: `start-dev.bat`
   - Mac/Linux: `./start-dev.sh`

The script will automatically:
- Create Python virtual environment
- Install Python dependencies
- Install Node dependencies
- Start both servers

## Manual Startup (Alternative)

If you prefer to start services manually:

### Terminal 1 - Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Mobile App
```bash
cd mobile-app
npm install
npm start
```

## Testing the Setup

### 1. Test Backend
Open in browser: http://192.168.1.47:8000/docs

You should see the FastAPI Swagger documentation.

### 2. Test Mobile App
- Look for the QR code in Terminal 2
- Install **Expo Go** app on your phone
- Scan the QR code
- App should load on your phone

## Network Configuration

The app is configured to connect to:
- **Backend API:** http://192.168.1.47:8000/api/v1
- **Metro Bundler:** http://localhost:8081

**Important:** Your phone must be on the same WiFi network as your development machine.

## Stopping the Services

### Windows
- Press `Ctrl+C` in the mobile app window
- Close the "CampusPandit Backend" window

### Mac/Linux
- Press `Ctrl+C` (stops both backend and mobile app)

## Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Check for error messages about missing dependencies or port conflicts.

### Mobile app won't start
```bash
cd mobile-app
rm -rf node_modules package-lock.json
npm install
npm start
```

### Phone can't connect to backend
1. Check backend is running: http://192.168.1.47:8000/docs
2. Verify phone is on same WiFi
3. Check firewall allows port 8000
4. Verify IP address in `mobile-app/src/config/env.ts` matches your machine's IP

### "Module not found" errors
Re-run the installation:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Mobile app
cd mobile-app
npm install
```

## Environment Variables

### Backend (.env)
Create `backend/.env` file:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/campuspandit
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Mobile App
Configuration in `mobile-app/src/config/env.ts`:
```typescript
export const API_URL = 'http://192.168.1.47:8000/api/v1';
```

## Development Workflow

1. **Start services:** `start-dev.bat` or `./start-dev.sh`
2. **Make code changes** - Both servers auto-reload
3. **Test on phone** - App hot-reloads automatically
4. **Check logs** - View in terminal windows
5. **Stop when done** - Ctrl+C

## Next Steps

- [Backend Documentation](./START_BACKEND.md)
- [Mobile App Setup](./MOBILE_APP_SETUP.md)
- [API Documentation](http://192.168.1.47:8000/docs) (when running)

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review error messages carefully
3. Ensure all prerequisites are installed
4. Verify network configuration

---

**Happy Coding! 🎉**
