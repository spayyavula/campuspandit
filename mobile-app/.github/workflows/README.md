# GitHub Actions CI/CD Setup

This directory contains automated deployment workflows for CampusPandit.

## Workflow Overview

The `deploy.yml` workflow automatically deploys your application when you push to the `main` branch:

1. **Frontend** → Netlify
2. **Backend** → Azure App Service
3. **Health Checks** → Verify both services are running

## Required GitHub Secrets

To enable automated deployments, you need to configure the following secrets in your GitHub repository:

### How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the secrets below

### Frontend Secrets (Netlify)

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token | 1. Go to https://app.netlify.com/user/applications<br>2. Click "New access token"<br>3. Give it a name and copy the token |
| `NETLIFY_SITE_ID` | Your Netlify site ID | 1. Go to your site in Netlify<br>2. Site settings → General → Site details<br>3. Copy "Site ID" |
| `VITE_API_URL` | Azure backend URL | `https://campuspandit-api.azurewebsites.net` |
| `VITE_SUPABASE_URL` | Supabase project URL | From your Supabase dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | From your Supabase dashboard |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | From your Stripe dashboard (pk_...) |

### Backend Secrets (Azure)

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure Web App publish profile | 1. Go to Azure Portal<br>2. Navigate to your App Service (campuspandit-api)<br>3. Click "Download publish profile"<br>4. Open the downloaded `.publishsettings` file<br>5. Copy the entire XML content |

## Manual Workflow Trigger

You can also manually trigger the deployment workflow:

1. Go to **Actions** tab in your repository
2. Select "Deploy to Production" workflow
3. Click **Run workflow** button
4. Choose the branch and click **Run workflow**

## Workflow Features

### 1. Frontend Deployment
- Installs Node.js 18
- Installs npm dependencies
- Builds the Vite app with environment variables
- Deploys to Netlify

### 2. Backend Deployment
- Installs Python 3.11
- Installs pip dependencies
- Runs tests (when you add them)
- Deploys to Azure Web App

### 3. Health Checks
- Waits for services to be ready
- Checks backend `/health` endpoint
- Checks frontend homepage
- Reports success or failure

## Monitoring Deployments

### View Deployment Logs

1. Go to the **Actions** tab in your repository
2. Click on the latest workflow run
3. View logs for each job:
   - `deploy-frontend`
   - `deploy-backend`
   - `health-check`

### Troubleshooting Failed Deployments

If a deployment fails:

1. **Check the logs** in GitHub Actions
2. **Common issues:**
   - Missing or incorrect secrets
   - Build errors (check dependencies)
   - Azure publish profile expired
   - Netlify authentication failed

3. **Quick fixes:**
   ```bash
   # Re-download Azure publish profile if expired
   # Update AZURE_WEBAPP_PUBLISH_PROFILE secret

   # Regenerate Netlify token if expired
   # Update NETLIFY_AUTH_TOKEN secret
   ```

## Branch Protection (Optional)

To ensure code quality before deployment:

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date

## Environment-Specific Deployments

### Staging Environment (Optional)

To add a staging environment:

1. Create a `staging` branch
2. Deploy staging to different Azure/Netlify instances
3. Update workflow to trigger on `staging` branch:

```yaml
on:
  push:
    branches:
      - main      # Production
      - staging   # Staging
```

## Cost Considerations

GitHub Actions free tier includes:
- 2,000 minutes/month for private repos
- Unlimited minutes for public repos

This workflow typically uses:
- ~5-10 minutes per deployment
- ~200-400 minutes/month (20-40 deploys)

Well within the free tier!

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate tokens regularly** (every 90 days)
4. **Use least-privilege access** for service accounts
5. **Enable branch protection** on main branch

## Notifications

### Enable Email Notifications

1. Go to **Settings** → **Notifications**
2. Enable **Actions** notifications
3. Choose email preferences

### Slack Integration (Optional)

Add this step to the workflow:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
  if: always()
```

## Next Steps

After setting up GitHub Actions:

1. ✅ Add all required secrets
2. ✅ Push to main branch to trigger first deployment
3. ✅ Monitor the workflow in Actions tab
4. ✅ Verify deployment at your URLs
5. ✅ Set up notifications
6. ✅ Add tests to backend (pytest)
7. ✅ Add branch protection rules

## Support

- GitHub Actions Docs: https://docs.github.com/en/actions
- Netlify CLI: https://docs.netlify.com/cli/get-started/
- Azure Deploy Action: https://github.com/Azure/webapps-deploy

---

**Happy Deploying!** 🚀
