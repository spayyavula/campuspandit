# Vercel Deployment Guide for CampusPandit Backend

Deploy your FastAPI backend to Vercel's serverless platform.

## 🚀 Quick Deployment Steps

### Method 1: Vercel Web Dashboard (Recommended - No CLI needed!)

#### Step 1: Sign Up / Login to Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Sign in with your **GitHub account** (recommended)

#### Step 2: Import Your GitHub Repository

1. After logging in, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. If first time, click **"Install Vercel for GitHub"**
   - Grant Vercel access to your repositories
   - Select **"Only select repositories"** → Choose `campuspandit`
4. Find and click **"Import"** on `spayyavula/campuspandit`

#### Step 3: Configure Project Settings

On the import page:

**Framework Preset:**
- Select **"Other"** (FastAPI is serverless)

**Root Directory:**
- Click **"Edit"** next to Root Directory
- Enter: `backend`
- This tells Vercel to deploy from the backend folder

**Build Settings:**
- Build Command: Leave empty (not needed)
- Output Directory: Leave empty
- Install Command: `pip install -r requirements-vercel.txt`

#### Step 4: Environment Variables

Click **"Environment Variables"** and add these:

**Required Variables:**
```
ENVIRONMENT = production
DEBUG = false
SECRET_KEY = <generate-random-32-chars>
ALLOWED_ORIGINS = https://your-frontend.vercel.app
```

**API Keys (your actual keys):**
```
OPENAI_API_KEY = sk-...
ANTHROPIC_API_KEY = sk-ant-...
STRIPE_SECRET_KEY = sk_live_... (or sk_test_...)
STRIPE_PUBLISHABLE_KEY = pk_live_... (or pk_test_...)
SENDGRID_API_KEY = SG...
FROM_EMAIL = noreply@campuspandit.com
```

**Database (if needed):**
```
DATABASE_URL = postgresql+asyncpg://...
```

**Optional:**
```
TWILIO_ACCOUNT_SID = AC...
TWILIO_AUTH_TOKEN = ...
TWILIO_PHONE_NUMBER = +1...
SENTRY_DSN = https://...
```

**Generate SECRET_KEY:**
- Use: https://randomkeygen.com/ (256-bit key)
- Or terminal: `openssl rand -hex 32`

#### Step 5: Deploy!

1. Click **"Deploy"**
2. Vercel will build and deploy your backend
3. Deployment takes ~1-3 minutes
4. You'll get a URL like: `https://campuspandit-backend.vercel.app`

#### Step 6: Test Your Deployment

Once deployed:

1. **Health Check:**
   ```
   https://your-project.vercel.app/health
   ```

2. **API Documentation:**
   ```
   https://your-project.vercel.app/api/docs
   ```

3. **ReDoc:**
   ```
   https://your-project.vercel.app/api/redoc
   ```

### Method 2: Using Vercel CLI (Alternative)

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Login
```bash
vercel login
```

#### Deploy from Backend Directory
```bash
cd D:\downloads\campuspandit\campuspandit\backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time) or **Y** (redeployment)
- Project name: `campuspandit-backend`
- Directory: `.` (already in backend)

#### Set Environment Variables via CLI
```bash
vercel env add SECRET_KEY
vercel env add ENVIRONMENT
vercel env add OPENAI_API_KEY
# ... etc for each variable
```

#### Deploy to Production
```bash
vercel --prod
```

---

## 📁 Configuration Files

The following files have been created:

### 1. `vercel.json`
Vercel project configuration:
- Specifies Python runtime
- Routes all requests to FastAPI
- Sets function timeout to 30 seconds

### 2. `api/index.py`
Serverless entry point that wraps your FastAPI app

### 3. `requirements-vercel.txt`
Optimized dependencies for serverless (lighter than full requirements.txt)

### 4. `.vercelignore`
Files to exclude from deployment (similar to .gitignore)

---

## 🔧 Important Considerations for Vercel

### Serverless Limitations

**Execution Time:**
- Free: 10 seconds max
- Pro: 60 seconds max
- Default set to 30s in `vercel.json`

**Cold Starts:**
- First request may be slower (~2-5 seconds)
- Subsequent requests are faster

**Database Connections:**
- Use connection pooling
- Consider using Vercel Postgres or external DB (Supabase, Neon, PlanetScale)
- Avoid long-running database connections

**File System:**
- Read-only filesystem (except `/tmp`)
- Can't store files permanently
- Use object storage (AWS S3, Cloudinary) for uploads

### Recommended Database Options

**Option 1: Vercel Postgres (Easiest)**
```bash
# Add via Vercel dashboard
# Go to Storage → Create Database → Postgres
# Environment variables are auto-set
```

**Option 2: Supabase (Free tier available)**
- Go to https://supabase.com
- Create project
- Get connection string from Settings → Database
- Add as `DATABASE_URL` in Vercel

**Option 3: Neon (Serverless Postgres)**
- Go to https://neon.tech
- Create project
- Get connection string
- Add as `DATABASE_URL` in Vercel

---

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel
1. Go to your project → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `api.campuspandit.com`

### Step 2: Configure DNS
Add these records to your DNS provider:

**For Subdomain (api.campuspandit.com):**
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

**For Root Domain (campuspandit.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### Step 3: Wait for Verification
- DNS propagation: 5-30 minutes
- SSL certificate: Auto-generated by Vercel

---

## 🔄 Automatic Deployments

Vercel automatically deploys on git push:

**Production Deployment:**
- Every push to `main` or `master` branch
- Gets production URL: `https://your-project.vercel.app`

**Preview Deployments:**
- Every push to other branches or pull requests
- Gets unique preview URL: `https://your-project-git-branch.vercel.app`

**Disable Auto-Deploy:**
- Go to **Settings** → **Git** → Toggle off auto-deploy

---

## 📊 Monitoring & Debugging

### View Logs
1. Go to your project in Vercel dashboard
2. Click **"Deployments"**
3. Click on a deployment
4. Click **"Functions"** tab to see logs

### Real-Time Logs (CLI)
```bash
vercel logs
```

### Performance Monitoring
- Go to **Analytics** tab in Vercel dashboard
- Shows request count, latency, errors
- Available on Pro plan

---

## 💰 Pricing

**Hobby (Free):**
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution
- 10s max execution time
- **Perfect for development & small projects**

**Pro ($20/month):**
- Everything in Hobby
- 1 TB bandwidth
- 60s max execution time
- Custom domains
- Analytics
- **Good for production**

---

## ⚡ Performance Optimization

### 1. Use Lightweight Dependencies
`requirements-vercel.txt` is optimized (no heavy ML libraries like pandas, sklearn)

### 2. Database Connection Pooling
```python
# In app/core/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)
```

### 3. Edge Caching
Add headers for static responses:
```python
@app.get("/health")
async def health():
    return Response(
        content='{"status":"ok"}',
        headers={"Cache-Control": "s-maxage=60"}
    )
```

### 4. Use Edge Functions
For simple endpoints, consider Vercel Edge Functions (faster than serverless)

---

## 🐛 Troubleshooting

### Build Fails

**Error: "No Python version specified"**
- Add `runtime.txt` with: `python-3.11`

**Error: "Module not found"**
- Check `requirements-vercel.txt` includes all dependencies
- Verify imports in your code

**Error: "Build exceeded maximum duration"**
- Reduce dependencies in `requirements-vercel.txt`
- Remove unused imports

### Function Errors

**Error: "Function exceeded time limit"**
- Increase timeout in `vercel.json` (max 60s on Pro)
- Optimize slow queries
- Use background jobs for long tasks

**Error: "Cannot connect to database"**
- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel IPs
- Use connection pooling

**Error: "CORS error"**
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check CORS middleware in `main.py`

### Cold Start Issues
- First request after inactivity is slower
- Consider keeping functions warm with cron jobs (Vercel Cron)
- Or use a separate service like BetterUptime

---

## 📝 Environment Variables Checklist

Set these in Vercel dashboard under **Settings** → **Environment Variables**:

**Required:**
- [ ] `ENVIRONMENT=production`
- [ ] `DEBUG=false`
- [ ] `SECRET_KEY=<random-32-chars>`
- [ ] `ALLOWED_ORIGINS=https://your-domain.com`

**API Services:**
- [ ] `OPENAI_API_KEY=sk-...`
- [ ] `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] `STRIPE_SECRET_KEY=sk_...`
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_...`
- [ ] `SENDGRID_API_KEY=SG...`
- [ ] `FROM_EMAIL=noreply@...`

**Database (if needed):**
- [ ] `DATABASE_URL=postgresql+asyncpg://...`

**Optional:**
- [ ] `TWILIO_ACCOUNT_SID=AC...`
- [ ] `TWILIO_AUTH_TOKEN=...`
- [ ] `SENTRY_DSN=https://...`

---

## 🎯 Quick Summary

1. ✅ Go to https://vercel.com
2. ✅ Login with GitHub
3. ✅ Import `spayyavula/campuspandit` repository
4. ✅ Set Root Directory to `backend`
5. ✅ Add environment variables (see checklist)
6. ✅ Click Deploy
7. ✅ Test: `https://your-project.vercel.app/health`
8. ✅ View docs: `https://your-project.vercel.app/api/docs`

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Python on Vercel**: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- **Your GitHub**: https://github.com/spayyavula/campuspandit

---

## 🆚 Vercel vs Railway vs Azure

| Feature | Vercel | Railway | Azure |
|---------|--------|---------|-------|
| **Type** | Serverless | Container | VM/Container |
| **Free Tier** | Yes (Hobby) | $5 credit | Limited quota |
| **Deployment** | Git push | Git push / CLI | CLI / GitHub Actions |
| **Databases** | Vercel Postgres | Railway Postgres | Azure Database |
| **Cold Starts** | Yes (~2-5s) | No | No |
| **Best For** | APIs, small apps | Full-stack apps | Enterprise |
| **Pricing** | $20/mo Pro | $5/mo credit | Pay per use |

**Vercel is best for:**
- Serverless APIs
- Quick deployments
- Projects with existing Vercel frontend
- Low to moderate traffic

---

**Ready to deploy! Follow the steps above and your backend will be live on Vercel! 🚀**
