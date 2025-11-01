# Railway Web Dashboard Deployment Guide

Since CLI login isn't working, use this method to deploy via Railway's web dashboard - it's actually easier!

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Sign Up / Login to Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign in with your **GitHub account** (recommended)
   - This automatically connects your GitHub repositories

### Step 2: Create New Project from GitHub

1. After logging in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. If this is your first time:
   - Click **"Configure GitHub App"**
   - Grant Railway access to your repositories
   - Select **"Only select repositories"** → Choose `campuspandit`
4. Select the **`spayyavula/campuspandit`** repository
5. Railway will scan your repository

### Step 3: Configure Root Directory

Since your backend is in a subdirectory:

1. After selecting the repo, Railway will ask for configuration
2. Click **"Add variables"** or go to **Settings**
3. In **Settings** → **General**:
   - Set **Root Directory**: `backend`
   - This tells Railway to deploy from the `backend` folder

**Or** Railway might auto-detect the configuration from `railway.json`

### Step 4: Set Environment Variables

Click on the **"Variables"** tab and add these required variables:

#### Required Variables:
```
ENVIRONMENT=production
DEBUG=false
APP_NAME=CampusPandit
SECRET_KEY=<generate-random-string-32-chars>
ALLOWED_ORIGINS=https://your-domain.com
```

#### API Keys (Add your actual keys):
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@campuspandit.com
```

#### Optional (SMS/Push):
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

**To generate SECRET_KEY:**
- Use an online generator: https://randomkeygen.com/
- Or use: `openssl rand -hex 32` in terminal
- Should be at least 32 characters long

### Step 5: Add Database (Optional)

If you need a database:

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` environment variable
3. You can view the connection string in the PostgreSQL service variables

**OR** if using external database (Supabase, Neon, etc.):
- Just add `DATABASE_URL` as an environment variable manually

### Step 6: Deploy!

1. After setting variables, Railway will automatically start deploying
2. Or click **"Deploy"** button
3. Watch the build logs in the **"Deployments"** tab
4. Build typically takes 2-5 minutes

### Step 7: Generate Public URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway will provide a URL like: `https://campuspandit-backend-production.up.railway.app`

**Custom Domain (Optional):**
- Click **"Custom Domain"**
- Add your domain (e.g., `api.campuspandit.com`)
- Add CNAME record in your DNS settings pointing to Railway's domain

### Step 8: Verify Deployment

1. Copy your Railway URL
2. Test the health endpoint:
   ```
   https://your-app.up.railway.app/health
   ```
3. View API documentation:
   ```
   https://your-app.up.railway.app/api/docs
   ```

## 📊 Monitoring & Management

### View Logs
- Go to your project → Click the service → **"Logs"** tab
- Real-time logs show all application output

### Redeploy
- Go to **"Deployments"** tab
- Click **"Redeploy"** on any deployment
- Or push new code to GitHub (auto-deploys)

### Restart Service
- Go to **"Settings"**
- Scroll down → Click **"Restart"**

### Metrics
- Railway shows CPU, Memory, and Network usage
- Available in the service dashboard

## 🔄 Automatic Deployments

Railway automatically deploys when you push to GitHub:

1. Make code changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin master
   ```
3. Railway detects the push and auto-deploys

**To disable auto-deploy:**
- Go to **Settings** → **"Source"** → Toggle off **"Automatic deployments"**

## 💰 Pricing

- **Trial**: $5 free credit (no credit card needed)
- **Hobby**: $5/month usage credit
- **Pro**: $20/month usage credit

Your backend will likely cost **$3-8/month** depending on usage.

## 🔧 Troubleshooting

### Build Fails
1. Check **Deployments** → **Build Logs**
2. Common issues:
   - Missing dependencies in `requirements.txt`
   - Python version mismatch
   - Root directory not set to `backend`

**Fix:** Ensure `railway.json` and `nixpacks.toml` are in the `backend` folder

### App Won't Start
1. Check **Logs** tab
2. Ensure `PORT` environment variable is used (Railway sets this automatically)
3. Verify startup command in `Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Database Connection Issues
1. If using Railway PostgreSQL, ensure it's in the same project
2. Check `DATABASE_URL` is set correctly
3. Verify database is running (check PostgreSQL service)

### Domain Not Working
1. Ensure domain is generated in Settings
2. For custom domains, verify CNAME record in DNS
3. Wait 5-10 minutes for DNS propagation

## 📝 Environment Variables Checklist

Copy this checklist and set each variable in Railway:

- [ ] `ENVIRONMENT=production`
- [ ] `DEBUG=false`
- [ ] `APP_NAME=CampusPandit`
- [ ] `SECRET_KEY=<random-32-chars>`
- [ ] `ALLOWED_ORIGINS=https://your-domain.com`
- [ ] `DATABASE_URL=<if-needed>`
- [ ] `OPENAI_API_KEY=sk-...`
- [ ] `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] `STRIPE_SECRET_KEY=sk_...`
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_...`
- [ ] `SENDGRID_API_KEY=SG...`
- [ ] `FROM_EMAIL=noreply@...`
- [ ] `TWILIO_ACCOUNT_SID=<optional>`
- [ ] `TWILIO_AUTH_TOKEN=<optional>`
- [ ] `TWILIO_PHONE_NUMBER=<optional>`

## 🎯 Quick Summary

1. ✅ Go to https://railway.app
2. ✅ Login with GitHub
3. ✅ New Project → Deploy from GitHub repo
4. ✅ Select `spayyavula/campuspandit`
5. ✅ Set Root Directory to `backend`
6. ✅ Add environment variables (use checklist above)
7. ✅ Wait for deployment to complete
8. ✅ Generate domain
9. ✅ Test: `https://your-app.up.railway.app/health`

## 🌐 Your Deployment URLs

After deployment, your endpoints will be:

- **Base URL**: `https://your-app.up.railway.app`
- **Health Check**: `https://your-app.up.railway.app/health`
- **API Docs**: `https://your-app.up.railway.app/api/docs`
- **ReDoc**: `https://your-app.up.railway.app/api/redoc`

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Your GitHub Repo: https://github.com/spayyavula/campuspandit

---

**Need Help?**
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- GitHub Issues: https://github.com/spayyavula/campuspandit/issues

**All configuration files are ready in your repository. Just follow the steps above! 🚀**
