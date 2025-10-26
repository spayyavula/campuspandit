# CampusPandit Deployment Checklist

Complete guide to deploy your CampusPandit application to production.

## Overview

- **Backend:** Azure App Service (FastAPI + PostgreSQL)
- **Frontend:** Netlify (React/Vite)
- **Estimated Time:** 1-2 hours
- **Estimated Cost:** ~$25-50/month (starter tier)

---

## Phase 1: Pre-Deployment Preparation

### 1.1 Gather Required Credentials

Before starting, ensure you have:

- [ ] Azure account credentials
- [ ] Netlify account (free)
- [ ] GitHub repository access
- [ ] Supabase URL and Anon Key (from your .env file)
- [ ] Stripe Secret Key and Publishable Key (from your .env file)

### 1.2 Install Required Tools

```bash
# Install Azure CLI
# Windows: Download from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Netlify CLI (optional, for CLI deployment)
npm install -g netlify-cli

# Verify installations
az --version
netlify --version
```

### 1.3 Prepare Your Code

- [ ] Commit all changes: `git add . && git commit -m "Prepare for deployment"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify all environment variables in backend/.env.example
- [ ] Verify all environment variables in mobile-app/.env.example

---

## Phase 2: Backend Deployment (Azure)

**Estimated Time:** 30-45 minutes

### 2.1 Azure Login

```bash
az login
```

This opens a browser for authentication.

### 2.2 Create Resource Group

```bash
az group create --name campuspandit-rg --location eastus
```

### 2.3 Create PostgreSQL Database

```bash
# Create PostgreSQL server (choose a strong password!)
az postgres flexible-server create \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server \
  --location eastus \
  --admin-user campusadmin \
  --admin-password <CHOOSE_STRONG_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group campuspandit-rg \
  --server-name campuspandit-db-server \
  --database-name campuspandit

# Allow Azure services to access the database
az postgres flexible-server firewall-rule create \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Important:** Save your database connection string:
```
postgresql://campusadmin:<PASSWORD>@campuspandit-db-server.postgres.database.azure.com/campuspandit?sslmode=require
```

### 2.4 Create App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group campuspandit-rg \
  --plan campuspandit-plan \
  --name campuspandit-api \
  --runtime "PYTHON:3.11"
```

**Your backend URL:** `https://campuspandit-api.azurewebsites.net`

### 2.5 Configure Environment Variables

```bash
# Database URL
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings DATABASE_URL="postgresql://campusadmin:<PASSWORD>@campuspandit-db-server.postgres.database.azure.com/campuspandit?sslmode=require"

# Generate a random secret key (save this!)
# You can generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings SECRET_KEY="<GENERATE_RANDOM_SECRET_KEY>"

# Environment
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings ENVIRONMENT="production"

# CORS origins (will update after Netlify deployment)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings CORS_ORIGINS="*"

# Supabase credentials (from your backend/.env file)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings SUPABASE_URL="<YOUR_SUPABASE_URL>" \
  SUPABASE_KEY="<YOUR_SUPABASE_KEY>"

# Stripe keys (from your backend/.env file)
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings STRIPE_SECRET_KEY="<YOUR_STRIPE_SECRET>" \
  STRIPE_PUBLISHABLE_KEY="<YOUR_STRIPE_PUBLIC>"
```

### 2.6 Configure Startup Command

```bash
az webapp config set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --startup-file "uvicorn main:app --host 0.0.0.0 --port 8000"
```

### 2.7 Deploy Backend Code

**Option A: Deploy from Local Git**

```bash
# Navigate to backend directory
cd ../backend

# Get Azure Git URL
az webapp deployment source config-local-git \
  --name campuspandit-api \
  --resource-group campuspandit-rg

# Add Azure as remote (use the URL from above command)
git remote add azure <AZURE_GIT_URL>

# Deploy
git push azure master
```

**Option B: Deploy from GitHub**

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your App Service (campuspandit-api)
3. Go to "Deployment Center"
4. Select "GitHub" as source
5. Authorize and select your repository
6. Select the backend folder
7. Click "Save"

### 2.8 Run Database Migrations

```bash
# SSH into your app
az webapp ssh --resource-group campuspandit-rg --name campuspandit-api

# Once inside, run migrations
cd /home/site/wwwroot
python -m alembic upgrade head
exit
```

### 2.9 Verify Backend Deployment

- [ ] Visit: `https://campuspandit-api.azurewebsites.net/docs`
- [ ] You should see FastAPI Swagger documentation
- [ ] Test the /health endpoint

### 2.10 Enable HTTPS Only

```bash
az webapp update --resource-group campuspandit-rg --name campuspandit-api --https-only true
```

✅ **Backend deployment complete!**

---

## Phase 3: Frontend Deployment (Netlify)

**Estimated Time:** 20-30 minutes

### 3.1 Prepare Frontend

Ensure these files exist in mobile-app directory:
- [ ] `netlify.toml` (already created)
- [ ] `.env.example` (already created)

### 3.2 Deploy to Netlify

**Option A: Deploy from Git (Recommended)**

1. **Push your code to GitHub** (if not done already)
   ```bash
   cd mobile-app
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select your repository
   - Configure build settings:
     - **Base directory:** `mobile-app` (or leave empty if deploying from root)
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click "Deploy site"

3. **Configure Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add these variables:
     ```
     VITE_API_URL=https://campuspandit-api.azurewebsites.net
     VITE_SUPABASE_URL=<your_supabase_url>
     VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
     VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
     ```

4. **Trigger Redeploy**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

**Option B: Deploy via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify
netlify init

# Build your site
npm run build

# Deploy to production
netlify deploy --prod
```

### 3.3 Get Your Netlify URL

After deployment completes, you'll get a URL like:
- `https://your-site-name.netlify.app`

Save this URL!

### 3.4 Update Backend CORS

Now that you have your Netlify URL, update the backend to allow it:

```bash
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings CORS_ORIGINS="https://your-site-name.netlify.app,https://campuspandit.com"
```

### 3.5 Verify Frontend Deployment

- [ ] Visit your Netlify URL
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Login/signup works (Supabase connection)
- [ ] API calls work (Azure backend connection)
- [ ] Payment flow works (Stripe connection)

✅ **Frontend deployment complete!**

---

## Phase 4: Post-Deployment Configuration

### 4.1 Set Up Custom Domain (Optional)

**For Netlify:**
1. Go to Domain settings in Netlify
2. Click "Add custom domain"
3. Enter your domain (e.g., campuspandit.com)
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

**For Azure (API subdomain):**
```bash
az webapp config hostname add \
  --webapp-name campuspandit-api \
  --resource-group campuspandit-rg \
  --hostname api.campuspandit.com
```

### 4.2 Set Up Monitoring

**Azure Application Insights:**
```bash
az monitor app-insights component create \
  --app campuspandit-insights \
  --location eastus \
  --resource-group campuspandit-rg
```

**Netlify Analytics:**
- Enable in Netlify Dashboard (optional, paid feature)

### 4.3 Configure Deployment Notifications

**Netlify:**
1. Go to Site settings → Notifications
2. Add email notifications for deploy success/failure

**Azure:**
1. Go to Azure Portal → App Service → Alerts
2. Set up alerts for high CPU, memory, or errors

### 4.4 Set Up Continuous Deployment

Both platforms are now configured for continuous deployment:
- **Backend:** Push to main branch → Auto-deploy to Azure
- **Frontend:** Push to main branch → Auto-deploy to Netlify

### 4.5 Create Backup Strategy

**Database Backups:**
```bash
# Azure automatically backs up your PostgreSQL database
# Configure retention period (7-35 days)
az postgres flexible-server backup list \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server
```

---

## Phase 5: Testing & Validation

### 5.1 End-to-End Testing

- [ ] Create a new user account
- [ ] Login with existing credentials
- [ ] Browse tutors
- [ ] Search functionality works
- [ ] Send a message
- [ ] Book a session
- [ ] Process a payment
- [ ] Check email notifications
- [ ] Logout and login again

### 5.2 Performance Testing

- [ ] Run Lighthouse audit on Netlify URL
- [ ] Check API response times at /docs
- [ ] Test on mobile devices
- [ ] Test on different browsers

### 5.3 Security Checklist

- [ ] HTTPS enabled on both frontend and backend
- [ ] Environment variables are not exposed in client code
- [ ] CORS is properly configured
- [ ] API endpoints are secured
- [ ] Database firewall rules are restrictive
- [ ] Secrets are stored securely (not in git)

---

## Phase 6: Ongoing Maintenance

### 6.1 Monitoring

**Check regularly:**
- Azure App Service metrics (CPU, memory, response time)
- Netlify deploy logs
- Database performance
- Error logs
- User feedback

### 6.2 Scaling

**When you need to scale:**

**Backend (Azure):**
```bash
# Scale up (better hardware)
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --sku P1V2

# Scale out (more instances)
az appservice plan update \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --number-of-workers 2
```

**Database:**
```bash
# Upgrade to General Purpose tier
az postgres flexible-server update \
  --resource-group campuspandit-rg \
  --name campuspandit-db-server \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose
```

### 6.3 Cost Optimization

**Current estimated costs (starter tier):**
- PostgreSQL (Burstable B1ms): ~$12/month
- App Service (B1): ~$13/month
- Netlify: Free
- **Total: ~$25/month**

**Tips to reduce costs:**
- Use Azure free tier credits for first 12 months
- Scale down non-production hours
- Monitor bandwidth usage
- Optimize database queries

---

## Troubleshooting

### Backend Issues

**Build fails:**
```bash
# View deployment logs
az webapp log tail --resource-group campuspandit-rg --name campuspandit-api
```

**App not responding:**
```bash
# Check app status
az webapp show --name campuspandit-api --resource-group campuspandit-rg --query state

# Restart app
az webapp restart --name campuspandit-api --resource-group campuspandit-rg
```

**Database connection fails:**
- Verify DATABASE_URL is correct
- Check firewall rules allow Azure services
- Verify database credentials

### Frontend Issues

**Build fails on Netlify:**
- Check build logs in Netlify dashboard
- Verify all dependencies are in package.json
- Ensure Node version matches (18+)

**API calls not working:**
- Check VITE_API_URL environment variable
- Verify CORS settings on backend
- Check browser console for errors

**Assets not loading:**
- Verify build output directory is `dist`
- Check asset paths are relative
- Clear cache and redeploy

---

## Quick Reference Commands

### Azure Commands

```bash
# View app logs
az webapp log tail --resource-group campuspandit-rg --name campuspandit-api

# Restart app
az webapp restart --name campuspandit-api --resource-group campuspandit-rg

# View environment variables
az webapp config appsettings list --name campuspandit-api --resource-group campuspandit-rg

# SSH into app
az webapp ssh --resource-group campuspandit-rg --name campuspandit-api
```

### Netlify Commands

```bash
# Deploy to production
netlify deploy --prod

# View logs
netlify logs

# Open site
netlify open:site

# Open admin dashboard
netlify open:admin
```

---

## Support Resources

- **Azure Documentation:** https://docs.microsoft.com/azure
- **Azure Support:** https://azure.microsoft.com/support/
- **Netlify Docs:** https://docs.netlify.com
- **Netlify Support:** https://www.netlify.com/support/
- **Netlify Community:** https://answers.netlify.com

---

## Next Steps After Deployment

1. Share your live URL with beta testers
2. Set up Google Analytics or similar
3. Configure email service for notifications
4. Set up error tracking (Sentry)
5. Create a staging environment
6. Document your API
7. Plan for v2 features!

---

**Congratulations! Your CampusPandit application is now live!** 🎉

Your sites:
- **Frontend:** https://your-site.netlify.app
- **Backend API:** https://campuspandit-api.azurewebsites.net
- **API Docs:** https://campuspandit-api.azurewebsites.net/docs
