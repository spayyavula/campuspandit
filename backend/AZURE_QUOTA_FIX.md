# Azure Quota Issue - Solutions Guide

You encountered a quota limit error when trying to deploy to Azure App Service. Here are your options:

## 🚨 The Issue

Your Azure subscription has these quotas set to 0:
- Free VMs: 0
- Basic VMs: 0

This prevents deploying Azure App Service (which uses VMs under the hood).

## ✅ Solution 1: Request Quota Increase (Recommended for Azure)

### Via Azure Portal (Easiest):

1. **Go to Azure Portal**: https://portal.azure.com
2. Click **"Help + support"** (question mark icon in top right)
3. Click **"New support request"**

4. **Basics tab:**
   - Issue type: **"Service and subscription limits (quotas)"**
   - Subscription: Select your subscription
   - Quota type: **"App Service"**
   - Click **"Next"**

5. **Problem details:**
   - Location: **"East US"** (or your preferred region)
   - SKU family: **"Basic"** or **"Free"**
   - Current limit: 0
   - New limit: **1** (for single app)
   - Click **"Next"**

6. **Contact information:**
   - Fill in your details
   - Severity: **"C - Minimal impact"**
   - Preferred contact method: **Email**
   - Click **"Create"**

**Timeline:** Usually approved within 1-3 business days for small increases.

### Via Azure CLI:

```bash
# Create support ticket for quota increase
az support tickets create \
  --ticket-name "AppServiceQuotaIncrease" \
  --title "Request App Service quota increase" \
  --description "Need to increase App Service Basic SKU quota from 0 to 1 for deploying a Python FastAPI application" \
  --problem-classification "QuotaIncrease" \
  --severity "minimal"
```

---

## ✅ Solution 2: Use Azure Container Apps (No quota issues!)

Azure Container Apps is a newer serverless container service that may not have the same quota restrictions.

### Create Container App Environment:

```bash
# Create Container Apps environment
az containerapp env create \
  --name campuspandit-env \
  --resource-group campuspandit-rg \
  --location eastus

# Create Container App from Docker image
az containerapp create \
  --name campuspandit-api \
  --resource-group campuspandit-rg \
  --environment campuspandit-env \
  --image python:3.11-slim \
  --target-port 8000 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

Then deploy your code using GitHub Actions (see Solution 4 below).

---

## ✅ Solution 3: Use Azure Container Instances (ACI)

Azure Container Instances might have different quotas.

### Deploy with ACI:

```bash
# First, we need to containerize the app
# Create a Dockerfile in backend/ directory

# Then create container instance
az container create \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --image <your-docker-image> \
  --dns-name-label campuspandit-api \
  --ports 8000 \
  --cpu 1 \
  --memory 1.5 \
  --environment-variables \
    ENVIRONMENT=production \
    DEBUG=false
```

---

## ✅ Solution 4: Use Azure Static Web Apps + Functions (Free tier!)

Azure Static Web Apps has a generous free tier and can host APIs via Azure Functions.

### Steps:

1. **Go to Azure Portal**
2. Create **"Static Web App"**
3. Connect to your GitHub repository
4. Select **"Custom"** as framework preset
5. Set **API location**: `backend`
6. Deploy!

**Advantages:**
- Free tier with 100 GB bandwidth/month
- No quota issues
- Auto-deploys from GitHub
- Integrated with GitHub Actions

---

## ✅ Solution 5: Use Different Azure Region

Some regions might have available quota. Try:

```bash
# Try different regions
az appservice plan create \
  --name campuspandit-plan \
  --resource-group campuspandit-rg \
  --location westus2 \
  --sku F1 \
  --is-linux
```

Try these regions:
- `westus2`
- `centralus`
- `northeurope`
- `southeastasia`

---

## ✅ Solution 6: Check Subscription Type

Your subscription might be a student, trial, or restricted subscription.

### Check subscription type:

```bash
az account show --query "{Name:name, SubscriptionId:id, State:state}" -o table
```

### Upgrade options:

1. **If Student Subscription:**
   - Go to https://portal.azure.com
   - Click "Subscriptions"
   - Click your subscription
   - Check if you can upgrade to Pay-As-You-Go

2. **If Free Trial:**
   - Upgrade to Pay-As-You-Go for more quota
   - Many services still have free tiers

3. **If Pay-As-You-Go:**
   - Request quota increase (Solution 1)

---

## 🎯 Recommended Approach

**For fastest deployment (while waiting for quota):**

1. **Use Vercel** (already configured!)
   - Deploy immediately, no quota issues
   - Free tier available
   - See `VERCEL_DEPLOYMENT.md`

2. **Use Railway** (also configured!)
   - $5 free credit
   - No quota restrictions
   - See `RAILWAY_WEB_DEPLOY.md`

**For Azure specifically:**

1. **Request quota increase** (Solution 1)
   - Takes 1-3 business days
   - Best for long-term Azure deployment

2. **While waiting, try Azure Container Apps** (Solution 2)
   - Modern serverless option
   - May not have same quota limits

---

## 📊 Comparison Table

| Service | Setup Time | Cost | Quota Issues | Best For |
|---------|------------|------|--------------|----------|
| **Vercel** | 5 min | Free tier | None | Quick deploy |
| **Railway** | 5 min | $5/mo | None | Full-stack apps |
| **Azure App Service** | After quota | ~$13/mo | Yes (needs increase) | Enterprise |
| **Azure Container Apps** | 10 min | Pay-per-use | Maybe not | Modern serverless |
| **Azure Static Web Apps** | 15 min | Free tier | None | JAMstack apps |

---

## 🔧 Current Status

Based on our deployment attempt:

- ✅ Azure CLI installed and logged in
- ✅ Resource group created: `campuspandit-rg`
- ❌ App Service Plan creation failed (quota limit)
- ⏳ Container Instance provider registered
- ⏳ Container Apps provider registered

---

## 📝 Next Steps

**Option A: Request Quota Increase (For Azure App Service)**
1. Follow Solution 1 above
2. Wait 1-3 business days
3. Retry App Service deployment

**Option B: Deploy Now (Use alternative)**
1. Deploy to Vercel (5 minutes)
   - Run: Follow `VERCEL_DEPLOYMENT.md`
2. Or deploy to Railway
   - Run: Follow `RAILWAY_WEB_DEPLOY.md`

**Option C: Try Azure Container Apps**
1. Wait for provider registration to complete
2. Run Container Apps deployment commands
3. See Solution 2 above

---

## 🆘 Support Resources

**Request Quota Increase:**
- Azure Portal: https://portal.azure.com → Help + support
- Docs: https://docs.microsoft.com/azure/azure-portal/supportability/per-vm-quota-requests

**Azure Container Apps:**
- Docs: https://docs.microsoft.com/azure/container-apps/
- Quickstart: https://learn.microsoft.com/azure/container-apps/quickstart-portal

**Alternative Platforms:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app

---

## 💡 Recommendation

**My recommendation:**

1. **Deploy to Vercel now** (it's ready, free, and fast!)
2. **Submit Azure quota increase request** (for future Azure deployment)
3. **Once quota approved, migrate to Azure if needed**

This way you can:
- ✅ Have your backend live immediately
- ✅ Start developing/testing
- ✅ Move to Azure later when quota is approved

---

**Need help with any of these solutions? Let me know!**
