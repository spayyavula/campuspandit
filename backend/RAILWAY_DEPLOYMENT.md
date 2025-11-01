# Railway Deployment Guide for CampusPandit Backend

## Quick Deployment Steps

### Method 1: Using Railway CLI (Recommended)

#### Step 1: Login to Railway
```bash
cd backend
railway login
```
This will open a browser window for authentication.

#### Step 2: Initialize Project
```bash
railway init
```
- Choose "Create new project"
- Name it "campuspandit-backend" or similar

#### Step 3: Add PostgreSQL Database (Optional)
```bash
railway add
```
- Select "PostgreSQL"
- Railway will automatically set DATABASE_URL environment variable

#### Step 4: Set Environment Variables
```bash
# Set variables one by one
railway variables set SECRET_KEY="your-secret-key-here"
railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set ALLOWED_ORIGINS="https://yourdomain.com"
railway variables set OPENAI_API_KEY="your-openai-key"
railway variables set ANTHROPIC_API_KEY="your-anthropic-key"
railway variables set STRIPE_SECRET_KEY="your-stripe-key"
railway variables set TWILIO_ACCOUNT_SID="your-twilio-sid"
railway variables set TWILIO_AUTH_TOKEN="your-twilio-token"
railway variables set SENDGRID_API_KEY="your-sendgrid-key"
```

Or set them all at once in the Railway dashboard.

#### Step 5: Deploy
```bash
railway up
```

Your app will be deployed! Railway will provide a URL like: `https://campuspandit-backend-production.up.railway.app`

#### Step 6: Generate Domain (Optional)
```bash
railway domain
```

---

### Method 2: Using GitHub Integration (Alternative)

#### Step 1: Push to GitHub
```bash
cd D:\downloads\campuspandit\campuspandit
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### Step 2: Deploy via Railway Dashboard
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `campuspandit` repository
5. Select the `backend` directory as the root
6. Railway will auto-detect Python and deploy

#### Step 3: Configure Environment Variables
In the Railway dashboard:
1. Go to your project
2. Click "Variables" tab
3. Add all required environment variables:
   - `SECRET_KEY`
   - `ENVIRONMENT=production`
   - `DEBUG=false`
   - `DATABASE_URL` (if using external DB)
   - `ALLOWED_ORIGINS`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `SENDGRID_API_KEY`

#### Step 4: Generate Domain
1. Go to "Settings" tab
2. Click "Generate Domain"
3. Your app will be available at: `https://your-app.up.railway.app`

---

## Configuration Files

The following files have been created for Railway deployment:

### 1. `Procfile`
Tells Railway how to start your app.

### 2. `railway.json`
Railway project configuration.

### 3. `nixpacks.toml`
Build configuration for Nixpacks (Railway's build system).

---

## Environment Variables Required

Make sure to set these in Railway:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Secret key for JWT | Generate with `openssl rand -hex 32` |
| `ENVIRONMENT` | Environment name | `production` |
| `DEBUG` | Debug mode | `false` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-set if using Railway DB |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://yourdomain.com` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `...` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG...` |

---

## Useful Railway CLI Commands

```bash
# View logs
railway logs

# Open project in browser
railway open

# Check status
railway status

# Link to existing project
railway link

# Run commands in Railway environment
railway run python manage.py migrate

# SSH into container
railway shell

# View environment variables
railway variables

# Delete project
railway delete
```

---

## Database Setup

### Option 1: Railway PostgreSQL (Recommended)
```bash
railway add
# Select PostgreSQL
```

Railway automatically sets `DATABASE_URL` environment variable.

### Option 2: External Database (Supabase, Neon, etc.)
Set the `DATABASE_URL` manually:
```bash
railway variables set DATABASE_URL="postgresql+asyncpg://user:password@host:5432/database"
```

---

## Pricing

Railway pricing (as of 2024):
- **Free Trial**: $5 credit (no credit card required)
- **Hobby Plan**: $5/month usage credit
- **Pro Plan**: $20/month usage credit

Typical usage for a small FastAPI app:
- ~$3-5/month for the backend
- ~$5-10/month if using Railway PostgreSQL

---

## Monitoring & Debugging

### View Logs
```bash
railway logs
```

Or in the Railway dashboard under the "Deployments" tab.

### Health Check
Railway automatically monitors your app. Make sure your `/health` endpoint returns 200 OK.

### Restart App
```bash
railway restart
```

Or click "Restart" in the Railway dashboard.

---

## Custom Domain Setup

### Step 1: Generate Railway Domain
```bash
railway domain
```

### Step 2: Add Custom Domain (Pro Plan required)
In Railway dashboard:
1. Go to "Settings"
2. Click "Custom Domain"
3. Add your domain (e.g., `api.campuspandit.com`)
4. Add the CNAME record to your DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: `your-app.up.railway.app`

---

## Troubleshooting

### App Won't Start
- Check logs: `railway logs`
- Verify Python version (3.11+ required)
- Check all dependencies are in `requirements.txt`

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Railway
- For Railway PostgreSQL, ensure it's in the same project

### Port Issues
Railway automatically sets `$PORT` environment variable. Make sure your app uses it:
```python
import os
port = int(os.getenv("PORT", 8000))
```

### Build Failures
- Check `nixpacks.toml` configuration
- Verify `requirements.txt` has all dependencies
- Check build logs in Railway dashboard

---

## Security Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Set `DEBUG=false` in production
- [ ] Configure `ALLOWED_ORIGINS` properly
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Set up database backups (for Railway PostgreSQL)

---

## Next Steps After Deployment

1. **Test API**: Visit `https://your-app.up.railway.app/health`
2. **View API Docs**: Visit `https://your-app.up.railway.app/api/docs`
3. **Monitor Logs**: `railway logs`
4. **Set up Custom Domain**: Follow custom domain setup above
5. **Configure Frontend**: Update frontend API URL to Railway URL

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/yourusername/campuspandit/issues

---

**Your app is now deployed to Railway! 🚀**
