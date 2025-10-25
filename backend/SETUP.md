# Backend Setup Guide

## Quick Start (Development Mode)

The backend can run without any API keys for development!

### 1. Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start with:
- ✅ API endpoints working
- ⚠️  AI matching using fallback scoring (without OpenAI)
- ✅ All other features functional

### 2. Access API Documentation

Open: http://192.168.1.47:8000/docs

You'll see interactive API documentation (Swagger UI).

---

## Optional: Full Setup with AI Features

To enable AI-powered matching, you need an OpenAI API key.

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Create .env File

```bash
cd backend
cp .env.example .env
```

### 3. Edit .env File

Open `.env` and add your OpenAI key:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. Restart Backend

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ AI Matching Service initialized with OpenAI
```

---

## Features by Configuration

### Without OpenAI API Key:
- ✅ All API endpoints
- ✅ Authentication
- ✅ Database operations
- ✅ Chat endpoints
- ⚠️  AI matching uses rule-based fallback
- ⚠️  Match summaries are generic

### With OpenAI API Key:
- ✅ Everything above
- ✅ GPT-4 powered tutor matching
- ✅ AI-generated match reasoning
- ✅ Personalized match summaries

---

## Environment Variables (Optional)

Create a `.env` file with any of these:

```bash
# Required for production
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/campuspandit
SECRET_KEY=your-secret-key-minimum-32-chars

# Optional: AI Features
OPENAI_API_KEY=sk-your-key

# Optional: Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Optional: Payments
STRIPE_SECRET_KEY=sk_test_your-key

# Optional: Email
SENDGRID_API_KEY=SG.your-key
```

See `.env.example` for all options.

---

## Development Workflow

### Start Backend
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Features:
- Auto-reload on code changes
- Interactive API docs at /docs
- Detailed error messages
- Request/response logging

### Test Endpoints

1. Open http://192.168.1.47:8000/docs
2. Try the `/health` endpoint
3. Explore other endpoints

---

## Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill
```

### Issue: Database connection error
**Solution:** The app will work without a database for testing API endpoints. For full functionality, set DATABASE_URL in .env

---

## Production Deployment

For production, you MUST set:

```bash
# .env
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=long-random-string-minimum-32-chars
ENVIRONMENT=production
DEBUG=false
```

Then run with Gunicorn:

```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## API Documentation

Once running, visit:
- **Swagger UI:** http://192.168.1.47:8000/docs
- **ReDoc:** http://192.168.1.47:8000/redoc
- **OpenAPI JSON:** http://192.168.1.47:8000/openapi.json

---

## Status

✅ Backend is configured to run with or without API keys
✅ AI features gracefully fallback when not configured
✅ All endpoints functional for development

**You're ready to develop! 🚀**
