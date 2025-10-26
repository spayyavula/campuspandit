# Quick Deploy Reference

**Quick reference for deploying CampusPandit to production.**

---

## 🚀 URLs After Deployment

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://your-site.netlify.app` | User-facing website |
| **Backend API** | `https://campuspandit-api.azurewebsites.net` | API endpoints |
| **API Docs** | `https://campuspandit-api.azurewebsites.net/docs` | Swagger documentation |
| **Database** | `campuspandit-db-server.postgres.database.azure.com` | PostgreSQL database |

---

## 📖 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `DEPLOYMENT_SUMMARY.md` | Overview of deployment setup | Start here for big picture |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment guide | **Use this for actual deployment** |
| `AZURE_DEPLOYMENT_GUIDE.md` | Backend deployment details | Backend-specific questions |
| `NETLIFY_DEPLOYMENT_GUIDE.md` | Frontend deployment details | Frontend-specific questions |
| `.github/workflows/README.md` | CI/CD automation setup | Setting up auto-deployment |
| `QUICK_DEPLOY.md` | This file | Quick reference |

---

## ⚡ Quick Deploy Commands

### First Time Setup

```bash
# 1. Login to Azure
az login

# 2. Create resources (see DEPLOYMENT_CHECKLIST.md for full commands)
az group create --name campuspandit-rg --location eastus

# 3. Deploy to Netlify
cd mobile-app
npm install -g netlify-cli
netlify login
netlify init
npm run build
netlify deploy --prod
```

### After GitHub Actions Setup

```bash
# Just push to deploy!
git add .
git commit -m "Deploy changes"
git push origin main
```

---

## 🔑 Required Secrets

### Netlify Environment Variables
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### Azure App Settings
- `DATABASE_URL`
- `SECRET_KEY`
- `ENVIRONMENT`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

### GitHub Secrets (for CI/CD)
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- All frontend environment variables

---

## 🛠️ Common Commands

### Azure

```bash
# View logs
az webapp log tail --resource-group campuspandit-rg --name campuspandit-api

# Restart app
az webapp restart --name campuspandit-api --resource-group campuspandit-rg

# SSH into app
az webapp ssh --resource-group campuspandit-rg --name campuspandit-api

# View environment variables
az webapp config appsettings list --name campuspandit-api --resource-group campuspandit-rg

# Update CORS
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings CORS_ORIGINS="https://your-site.netlify.app"
```

### Netlify

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

### Local Development

```bash
# Backend
cd backend
python -m uvicorn main:app --reload

# Frontend
cd mobile-app
npm run dev

# Mobile app
cd mobile-app
npx expo start
```

---

## 💰 Cost Estimate

| Tier | Components | Monthly Cost |
|------|-----------|--------------|
| **Free/Dev** | Netlify Free + Azure Free Credits | $0 |
| **Starter** | Netlify Free + Azure B1 + PostgreSQL B1ms | ~$25 |
| **Growth** | Netlify Pro + Azure P1V2 + PostgreSQL D2s_v3 | ~$215-234 |

---

## ✅ Deployment Checklist

- [ ] Azure account created
- [ ] Netlify account created
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Azure
- [ ] Frontend deployed to Netlify
- [ ] Environment variables configured
- [ ] CORS updated with Netlify URL
- [ ] Database migrations run
- [ ] SSL enabled (automatic)
- [ ] Health checks passing
- [ ] GitHub Actions configured (optional)

---

## 🔍 Health Check URLs

```bash
# Backend health
curl https://campuspandit-api.azurewebsites.net/health

# Frontend
curl https://your-site.netlify.app

# API docs
curl https://campuspandit-api.azurewebsites.net/docs
```

---

## 🚨 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build fails on Netlify** | Check build logs, verify Node 18+, check package.json |
| **Backend not responding** | Check Azure logs, restart app, verify environment variables |
| **CORS errors** | Update CORS_ORIGINS in Azure app settings |
| **Database connection fails** | Verify DATABASE_URL, check firewall rules |
| **API 500 errors** | Check Azure logs, verify all environment variables set |
| **Frontend 404 errors** | Check netlify.toml redirects, redeploy |

---

## 📞 Quick Support Links

- **Azure Portal:** https://portal.azure.com
- **Netlify Dashboard:** https://app.netlify.com
- **GitHub Actions:** https://github.com/your-repo/actions
- **Supabase Dashboard:** https://app.supabase.com
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## 🎯 Deployment Steps (TL;DR)

1. **Read:** `DEPLOYMENT_CHECKLIST.md`
2. **Deploy Backend:** Follow Phase 2 (~45 min)
3. **Deploy Frontend:** Follow Phase 3 (~30 min)
4. **Configure:** Update CORS, test everything (~20 min)
5. **Automate:** Set up GitHub Actions (~15 min)

**Total:** ~2 hours first time, 5 minutes after automation

---

**Need detailed help?** → See `DEPLOYMENT_CHECKLIST.md`

**Ready to deploy?** → Start with Phase 1 in the checklist!
