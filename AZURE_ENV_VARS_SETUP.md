# Azure Environment Variables Setup Guide

This guide helps you configure all environment variables for your Azure deployment.

## 🔐 Backend Environment Variables (Azure Container App)

### Method 1: Via Azure CLI

```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "SECRET_KEY=<GENERATE_RANDOM_32_CHAR_STRING>" \
    "ENVIRONMENT=production" \
    "DEBUG=false" \
    "DATABASE_URL=<YOUR_DATABASE_URL>" \
    "ALLOWED_ORIGINS=https://<your-frontend>.azurestaticapps.net" \
    "SUPABASE_URL=<YOUR_SUPABASE_URL>" \
    "SUPABASE_SERVICE_KEY=<YOUR_SUPABASE_SERVICE_KEY>" \
    "SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>" \
    "OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>" \
    "ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_API_KEY>" \
    "STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>" \
    "STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLIC_KEY>" \
    "STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>" \
    "SENDGRID_API_KEY=<YOUR_SENDGRID_API_KEY>" \
    "FROM_EMAIL=noreply@campuspandit.com" \
    "TWILIO_ACCOUNT_SID=<YOUR_TWILIO_SID>" \
    "TWILIO_AUTH_TOKEN=<YOUR_TWILIO_TOKEN>" \
    "TWILIO_PHONE_NUMBER=<YOUR_TWILIO_PHONE>"
```

### Method 2: Via Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your Container App: `campuspandit-backend`
3. Click **"Containers"** → **"Edit and deploy"**
4. Click **"Environment variables"** tab
5. Add each variable:

| Name | Value | Source |
|------|-------|--------|
| `SECRET_KEY` | Generate with: `openssl rand -hex 32` | Generate |
| `ENVIRONMENT` | `production` | Manual |
| `DEBUG` | `false` | Manual |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Supabase/Azure DB |
| `ALLOWED_ORIGINS` | Your frontend URL | Azure Static Web Apps |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard |
| `SUPABASE_SERVICE_KEY` | Service role key | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Anon public key | Supabase → Settings → API |
| `OPENAI_API_KEY` | `sk-...` | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com/ |
| `STRIPE_SECRET_KEY` | `sk_live_...` | https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks |
| `SENDGRID_API_KEY` | `SG...` | https://app.sendgrid.com/settings/api_keys |
| `FROM_EMAIL` | `noreply@campuspandit.com` | Your domain |
| `TWILIO_ACCOUNT_SID` | `ACxxxxx` | https://console.twilio.com/ |
| `TWILIO_AUTH_TOKEN` | Auth token | Twilio Console |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Twilio Console |

6. Click **"Create"** at the bottom

---

## 🌐 Frontend Environment Variables (Azure Static Web Apps)

### Method 1: Via Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your Static Web App: `campuspandit-frontend`
3. Click **"Configuration"**
4. Add these application settings:

| Name | Value | Where to Get |
|------|-------|--------------|
| `VITE_API_URL` | `https://campuspandit-backend.xxx.azurecontainerapps.io` | Your backend URL |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase → Settings → API → anon public |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Stripe → Developers → API keys |

5. Click **"Save"**

### Method 2: Via GitHub Secrets (for workflow)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Azure Portal → Static Web App → Manage deployment token |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_URL` | Your backend URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

---

## 🔑 How to Get Each Value

### 1. SECRET_KEY (Backend)

**Generate a secure random key:**

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Online:**
https://www.random.org/strings/

### 2. DATABASE_URL

#### If using Supabase:
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **Database**
4. Copy **Connection string** → **URI**
5. Replace `[YOUR-PASSWORD]` with your database password
6. Change `postgresql://` to `postgresql+asyncpg://` (for async support)

**Format:**
```
postgresql+asyncpg://postgres:[password]@[host]:5432/postgres
```

#### If using Azure Database for PostgreSQL:
```
postgresql+asyncpg://[username]:[password]@[server].postgres.database.azure.com:5432/campuspandit?sslmode=require
```

### 3. SUPABASE Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **URL**: `SUPABASE_URL`
   - **anon public**: `SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

### 4. OPENAI_API_KEY

1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click **"Create new secret key"**
4. Give it a name: "CampusPandit Production"
5. Copy the key (starts with `sk-`)

**Pricing**: Pay-as-you-go
- GPT-4: ~$0.03 per 1K tokens
- GPT-3.5: ~$0.001 per 1K tokens

### 5. ANTHROPIC_API_KEY (Optional)

1. Go to https://console.anthropic.com/
2. Sign in or create account
3. Go to **API Keys**
4. Click **"Create Key"**
5. Copy the key (starts with `sk-ant-`)

### 6. STRIPE Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Sign in or create account
3. You'll see two keys:
   - **Publishable key** (`pk_test_...` or `pk_live_...`): Safe for frontend
   - **Secret key** (`sk_test_...` or `sk_live_...`): Backend only!
4. Copy both

**For Production**: Switch to "Live mode" in Stripe dashboard

**Webhook Secret:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter URL: `https://your-backend.azurecontainerapps.io/api/v1/payments/webhook`
4. Select events to listen for
5. Copy the **Signing secret** (`whsec_...`)

### 7. SENDGRID_API_KEY

1. Go to https://app.sendgrid.com/settings/api_keys
2. Sign in or create account
3. Click **"Create API Key"**
4. Choose **"Full Access"**
5. Name it: "CampusPandit Production"
6. Copy the key (starts with `SG.`)

**Pricing**: Free tier = 100 emails/day

**Verify Sender Email:**
1. Go to **Settings** → **Sender Authentication**
2. Verify your domain or email address
3. Use verified email in `FROM_EMAIL`

### 8. TWILIO Credentials (Optional - for SMS)

1. Go to https://console.twilio.com/
2. Sign in or create account
3. From Dashboard, copy:
   - **Account SID** (`ACxxxxx`)
   - **Auth Token** (click to reveal)
4. Get a phone number:
   - Go to **Phone Numbers** → **Manage** → **Buy a number**
   - Choose a number
   - Copy it (format: `+1234567890`)

**Pricing**: ~$1/month per number + $0.0075 per SMS

### 9. ALLOWED_ORIGINS (Backend)

**Format:**
```
https://your-frontend-name.azurestaticapps.net
```

**Multiple origins** (separate with commas):
```
https://your-app.azurestaticapps.net,https://campuspandit.com,http://localhost:5173
```

**Get your frontend URL:**
```bash
az staticwebapp show \
  --name campuspandit-frontend \
  --resource-group campuspandit-rg \
  --query defaultHostname -o tsv
```

---

## ✅ Environment Variables Checklist

### Required (Backend)
- [ ] `SECRET_KEY` - Generated random string
- [ ] `ENVIRONMENT` - Set to "production"
- [ ] `DEBUG` - Set to "false"
- [ ] `DATABASE_URL` - Database connection string
- [ ] `ALLOWED_ORIGINS` - Frontend URL

### Required (Frontend)
- [ ] `VITE_API_URL` - Backend URL
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Optional but Recommended
- [ ] `OPENAI_API_KEY` - For AI features
- [ ] `STRIPE_SECRET_KEY` - For payments
- [ ] `STRIPE_PUBLISHABLE_KEY` - Frontend
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Frontend
- [ ] `SENDGRID_API_KEY` - For emails
- [ ] `FROM_EMAIL` - Sender email address

### Optional
- [ ] `ANTHROPIC_API_KEY` - Alternative AI
- [ ] `TWILIO_ACCOUNT_SID` - For SMS
- [ ] `TWILIO_AUTH_TOKEN` - For SMS
- [ ] `TWILIO_PHONE_NUMBER` - For SMS
- [ ] `STRIPE_WEBHOOK_SECRET` - For payment webhooks

---

## 🔄 Updating Environment Variables

### Backend Update

After adding/changing environment variables, restart the app:

```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars "NEW_VAR=value"

# Or restart
az containerapp revision restart \
  --name campuspandit-backend \
  --resource-group campuspandit-rg
```

### Frontend Update

After changing frontend environment variables:
1. Update in Azure Portal → Static Web App → Configuration
2. Click **"Save"**
3. Trigger a new deployment (push to GitHub or redeploy)

---

## 🧪 Testing Environment Variables

### Test Backend

```bash
# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test health endpoint
curl https://$BACKEND_URL/health

# Should return: {"status":"healthy","environment":"production",...}
```

### Test Frontend

1. Open your frontend URL in browser
2. Open Developer Tools (F12)
3. Check Console for errors
4. Check Network tab for API calls
5. Verify Supabase connection

### Common Issues

**CORS errors**: Update `ALLOWED_ORIGINS` to include your frontend URL

**Supabase errors**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**API not found**: Check `VITE_API_URL` in frontend

**Payment errors**: Verify Stripe keys match (test vs. live mode)

---

## 🔒 Security Best Practices

1. **Never commit secrets** to Git
   - Use `.env.local` for local development
   - Add to `.gitignore`

2. **Use different keys** for dev/staging/production

3. **Rotate secrets** regularly
   - Change `SECRET_KEY` every 90 days
   - Rotate API keys periodically

4. **Use Azure Key Vault** for production secrets (advanced):
   ```bash
   # Create Key Vault
   az keyvault create \
     --name campuspandit-kv \
     --resource-group campuspandit-rg

   # Store secret
   az keyvault secret set \
     --vault-name campuspandit-kv \
     --name "openai-api-key" \
     --value "sk-..."

   # Reference in Container App
   az containerapp update \
     --name campuspandit-backend \
     --resource-group campuspandit-rg \
     --secrets openai-key=keyvaultref:https://campuspandit-kv.vault.azure.net/secrets/openai-api-key,identityref:system
   ```

5. **Limit CORS** to only your domains (not `*`)

6. **Enable HTTPS only** (automatic in Azure)

---

## 📝 Quick Copy Template

**For Backend** (replace values and run):
```bash
az containerapp update \
  --name campuspandit-backend \
  --resource-group campuspandit-rg \
  --set-env-vars \
    "SECRET_KEY=REPLACE_WITH_RANDOM_32_CHARS" \
    "ENVIRONMENT=production" \
    "DEBUG=false" \
    "DATABASE_URL=REPLACE_WITH_DATABASE_URL" \
    "ALLOWED_ORIGINS=REPLACE_WITH_FRONTEND_URL" \
    "SUPABASE_URL=REPLACE_WITH_SUPABASE_URL" \
    "SUPABASE_ANON_KEY=REPLACE_WITH_SUPABASE_ANON_KEY" \
    "OPENAI_API_KEY=REPLACE_WITH_OPENAI_KEY" \
    "STRIPE_SECRET_KEY=REPLACE_WITH_STRIPE_SECRET" \
    "SENDGRID_API_KEY=REPLACE_WITH_SENDGRID_KEY" \
    "FROM_EMAIL=noreply@campuspandit.com"
```

---

**Need help?** Check the main deployment guide: `AZURE_DEPLOYMENT_COMPLETE_GUIDE.md`
