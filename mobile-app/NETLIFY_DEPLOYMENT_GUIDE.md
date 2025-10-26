# Netlify Frontend Deployment Guide

This guide will help you deploy the CampusPandit frontend to Netlify.

## Prerequisites

- Netlify account (sign up at https://netlify.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Your backend deployed to Azure (see AZURE_DEPLOYMENT_GUIDE.md)

## Quick Deploy (Recommended)

### Option 1: Deploy from Git (Recommended)

1. **Push your code to GitHub**
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository
   - Configure build settings:
     - **Base directory:** Leave empty (or specify if needed)
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click "Deploy site"

3. **Configure Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add these variables:
     ```
     VITE_API_URL=https://campuspandit-api.azurewebsites.net
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_key
     VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
     ```

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize Netlify**
```bash
netlify init
```

4. **Deploy**
```bash
# Build your site
npm run build

# Deploy to production
netlify deploy --prod
```

## Configuration

The `netlify.toml` file in the root directory contains all configuration.

### Custom Domain Setup

1. Go to Domain settings in Netlify
2. Click "Add custom domain"
3. Enter your domain (e.g., campuspandit.com)
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

### Environment Variables

Add these in Netlify Dashboard → Site settings → Environment variables:

```bash
# API Configuration
VITE_API_URL=https://campuspandit-api.azurewebsites.net

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional: Analytics
VITE_GA_ID=G-XXXXXXXXXX
```

## Post-Deployment Steps

### 1. Update Backend CORS

Update your Azure backend to allow your Netlify domain:

```bash
az webapp config appsettings set \
  --resource-group campuspandit-rg \
  --name campuspandit-api \
  --settings CORS_ORIGINS="https://your-site.netlify.app,https://campuspandit.com"
```

### 2. Test Your Deployment

Visit your Netlify URL and test:
- ✅ Homepage loads
- ✅ API calls work
- ✅ Authentication works
- ✅ Payment processing works
- ✅ All routes work (SPA routing)

### 3. Set Up Deploy Previews

Netlify automatically creates preview deployments for pull requests!

### 4. Enable Form Handling (Optional)

If you have contact forms:
```html
<form name="contact" netlify>
  <!-- Your form fields -->
</form>
```

## Continuous Deployment

Every push to your main branch will trigger automatic deployment!

### Deploy Contexts

- **Production:** Deploys from `main` branch
- **Branch deploys:** Every branch gets its own URL
- **Deploy previews:** Every PR gets a preview URL

## Performance Optimization

### 1. Enable Asset Optimization

In Netlify Dashboard → Build & deploy → Post processing:
- ✅ Bundle CSS
- ✅ Minify CSS
- ✅ Minify JS
- ✅ Compress images

### 2. Configure Caching

Already configured in `netlify.toml`:
- HTML: No cache (always fresh)
- Assets: 1 year cache
- API calls: Proxied through Netlify

### 3. Enable Netlify Analytics (Optional)

```bash
netlify plugins:install @netlify/plugin-netlify-analytics
```

## Monitoring

### View Deploy Logs

1. Go to Deploys tab
2. Click on a deploy
3. View build logs

### Set Up Notifications

1. Go to Site settings → Notifications
2. Add notifications for:
   - Deploy started
   - Deploy succeeded
   - Deploy failed

## Rollback

If something goes wrong:

1. Go to Deploys tab
2. Find the last working deploy
3. Click "Publish deploy"

## Cost

Netlify Free Tier includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Deploy previews
- ✅ Free SSL
- ✅ Form handling (100 submissions/month)

Perfect for getting started!

## Advanced Features

### Netlify Functions (Serverless)

Create serverless functions in `netlify/functions/`:

```javascript
// netlify/functions/hello.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" })
  };
};
```

Access at: `https://your-site.netlify.app/.netlify/functions/hello`

### Split Testing

Test different versions:

```bash
netlify deploy --alias test-version
```

### Redirects & Rewrites

Already configured in `netlify.toml`:
- SPA routing
- API proxy to Azure
- Custom 404 pages

## Troubleshooting

### Build Fails

Check:
1. Build logs in Netlify
2. Ensure all dependencies are in `package.json`
3. Check Node version matches

### API Not Working

1. Check environment variables
2. Verify CORS settings on backend
3. Check network tab in browser

### Assets Not Loading

1. Verify build output directory is `dist`
2. Check asset paths are relative
3. Clear cache and redeploy

## Security Headers

Already configured for:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## CLI Commands Reference

```bash
# Build locally
npm run build

# Test production build locally
npm run preview

# Deploy preview
netlify deploy

# Deploy production
netlify deploy --prod

# View deploy logs
netlify logs

# Open site
netlify open:site

# Open admin dashboard
netlify open:admin
```

## Next Steps

1. ✅ Set up custom domain
2. ✅ Configure analytics
3. ✅ Set up monitoring
4. ✅ Enable deploy notifications
5. ✅ Test all features
6. ✅ Share your site!

Your site will be live at: `https://your-site.netlify.app`

## Support

- Netlify Docs: https://docs.netlify.com
- Netlify Support: https://www.netlify.com/support/
- Community Forum: https://answers.netlify.com
