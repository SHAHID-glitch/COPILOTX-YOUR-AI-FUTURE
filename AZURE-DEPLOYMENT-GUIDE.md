# Azure Deployment Guide (App Service)

This project is an Express app (`server.js`) that also serves static frontend files, so the simplest Azure target is **Azure App Service (Linux, Node.js)**.

## 1) Create Azure resources (Portal)

1. In Azure Portal, create a **Web App**.
2. Runtime stack: **Node 20 LTS**.
3. Operating System: **Linux**.
4. Region: choose the one closest to your users.
5. Pricing plan: start with **B1** (or Free for quick tests).

## 2) Configure startup and app settings

In **Web App -> Configuration -> General settings**:

- Startup Command: `npm start`

In **Web App -> Configuration -> Application settings**, add at minimum:

- `NODE_ENV=production`
- `PORT=8080` (App Service injects `PORT`; keeping this here is optional but explicit)
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `SESSION_SECRET=...`
- `FRONTEND_URL=https://<your-webapp-name>.azurewebsites.net`

Optional (if you use these features):

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT_NAME`
- `AZURE_OPENAI_API_VERSION`
- `GROQ_API_KEY`
- `HUGGINGFACE_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://<your-webapp-name>.azurewebsites.net/api/auth/google/callback`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL=https://<your-webapp-name>.azurewebsites.net/api/auth/github/callback`

Save settings and let App Service restart.

## 3) Deploy with GitHub Actions (already added)

This repository includes workflow:

- `.github/workflows/azure-webapp-deploy.yml`

Add these GitHub repository secrets:

- `AZURE_WEBAPP_NAME` = your Azure Web App name
- `AZURE_WEBAPP_PUBLISH_PROFILE` = publish profile XML from Azure Portal

How to get publish profile:

1. Azure Portal -> your Web App
2. Click **Get publish profile**
3. Copy full XML content into GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE`

Then push to `main` (or run the workflow manually from Actions).

## 4) Post-deploy checks

1. Open `https://<your-webapp-name>.azurewebsites.net/api/health`
2. Confirm response includes `status: ok`
3. Test auth login/register and AI endpoints
4. If OAuth is enabled, ensure callback URLs match exact production URLs

## 5) Common issues

- **500 on startup**: missing required environment variables (`MONGODB_URI`, `JWT_SECRET`, etc.)
- **Database disconnected**: MongoDB network access list does not allow Azure outbound IPs
- **OAuth redirect mismatch**: update callback URLs in Google/GitHub app settings
- **Slow cold starts**: use Basic plan or enable Always On

## 6) Optional: deploy from local CLI

If you prefer local deployment, install Azure CLI and run:

```bash
az login
az webapp up --name <your-webapp-name> --resource-group <your-rg> --runtime "NODE:20-lts" --sku B1
```

Then set app settings in portal (or via `az webapp config appsettings set`).
