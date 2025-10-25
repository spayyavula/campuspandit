# 🚀 Backend Startup Guide

## Current Status

Your backend is installing dependencies. This may take 5-10 minutes due to heavy packages like langchain, pandas, numpy, etc.

---

## ✅ Once Installation Completes

### Start the Backend:

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Why this command:**
- `cd backend` - Navigate to backend directory
- `python -m uvicorn` - Run uvicorn as a module
- `main:app` - Load app from `backend/main.py`
- `--reload` - Auto-reload on code changes
- `--host 0.0.0.0` - Allow external connections (from your phone)
- `--port 8000` - Run on port 8000

---

## 🧪 Test Backend is Running

### Option 1: Browser
Open: http://192.168.1.47:8000/docs

You should see FastAPI's interactive API documentation (Swagger UI).

### Option 2: Command Line
```bash
curl http://192.168.1.47:8000/health
```

Should return: `{"status": "healthy"}`

---

## 📱 Backend + Mobile App Together

### Terminal 1: Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Mobile App
```bash
cd mobile-app
npm start
```

### Your Phone:
- Scan QR code from Terminal 2
- App connects to backend at http://192.168.1.47:8000

---

## 🐛 Common Issues

### "Module not found" errors

**Solution:** Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### "Connection refused" from mobile app

**Checklist:**
- ✅ Backend running? Check http://192.168.1.47:8000/docs
- ✅ Firewall allows port 8000?
- ✅ Phone on same WiFi?
- ✅ Using correct IP in mobile-app/src/config/env.ts?

### "Database connection failed"

**Solution:** Check DATABASE_URL in `.env` file
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

---

## 📋 Environment Setup

Create `.env` file in `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/campuspandit

# JWT
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (Optional)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Email (Optional)
SENDGRID_API_KEY=SG.your-sendgrid-key
```

---

## 🔥 Quick Start (Minimal Setup)

If you just want to test the mobile app without database:

1. **Skip database for now** - Comment out database initialization in `backend/main.py`

2. **Start backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Start mobile app:**
   ```bash
   cd mobile-app
   npm start
   ```

4. **Test:**
   - Open browser: http://192.168.1.47:8000/docs
   - Scan QR code with phone
   - App loads!

---

## 📚 Full Project Setup

For production setup with database, authentication, etc:

1. **Install PostgreSQL** or use **Supabase**
2. **Create database:** `campuspandit`
3. **Run migrations:**
   ```bash
   cd backend
   alembic upgrade head
   ```
4. **Start backend** (as above)
5. **Create test user** in database
6. **Test login** from mobile app

---

## 🎯 Current Configuration

**Your setup:**
- Backend: `http://192.168.1.47:8000`
- Mobile app connects to: `http://192.168.1.47:8000/api/v1`
- Metro bundler: `http://localhost:8081`

**All configured and ready!**

---

## ⏱️ Installation Progress

Python dependencies are installing now. Once complete, you'll see:

```
Successfully installed <list of packages>
```

Then you can run:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

**Estimated time remaining: 5-10 minutes for first install**

Once done, backend will start in seconds! 🚀
