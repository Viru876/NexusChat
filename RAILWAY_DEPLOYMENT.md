# 🚂 Railway Deployment Guide for NexusChat

## Current Status
- **Backend URL:** https://nexuschat-server-production-1c58.up.railway.app
- **Frontend URL:** https://nexuschat-viru876.vercel.app
- **Issue:** Backend returning 404 - needs configuration

---

## Why Your Backend Isn't Working

Your Railway deployment is likely failing because:
1. ❌ **Environment variables not set on Railway**
2. ❌ **Database not connected**
3. ❌ **Build/start commands not configured**

---

## Fix Your Railway Deployment

### Step 1: Access Railway Dashboard

1. Go to https://railway.app
2. Login to your account
3. Find your project: **nexuschat-server-production-1c58**

### Step 2: Set Environment Variables

Go to your service → **Variables** tab and add these:

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=nexuschat_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRE=7d
CLIENT_URL=https://nexuschat-viru876.vercel.app
```

### Step 3: Add PostgreSQL Database

**Option A: Railway PostgreSQL (Recommended)**
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create `DATABASE_URL` variable
4. Your backend will auto-connect to it!

**Option B: External Database (Neon/Supabase)**
1. Create database at https://neon.tech or https://supabase.com
2. Copy the connection string
3. Add to Railway variables:
   ```
   DATABASE_URL=postgresql://username:password@host:5432/database
   ```

### Step 4: Add Optional Services

**Cloudinary (File Uploads):**
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
Get from: https://cloudinary.com/console

**Email Service:**
```bash
EMAIL_USER=shekhawatvirendrasingh876@gmail.com
EMAIL_PASS=your_gmail_app_password
# OR use Resend
RESEND_API_KEY=your_resend_api_key
```

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### Step 5: Configure Build & Start

In Railway **Settings** tab:

**Build Command:**
```bash
npm install && npm run db:generate && npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:** (leave as `/` or set to `/server` if monorepo)

### Step 6: Deploy Database Schema

After Railway PostgreSQL is connected, you need to push your schema:

**Option A: From Railway CLI**
```bash
railway login
railway link
railway run npm run db:push
```

**Option B: From Local with Railway DATABASE_URL**
1. Get `DATABASE_URL` from Railway dashboard
2. Run locally:
   ```bash
   DATABASE_URL="your_railway_db_url" npm run db:push
   ```

### Step 7: Redeploy

After setting environment variables:
1. Railway will **auto-redeploy**
2. Or click **"Deploy"** manually
3. Wait for deployment to complete

### Step 8: Verify Deployment

Check if backend is running:
```bash
curl https://nexuschat-server-production-1c58.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "service": "NexusChat API",
  "developer": "Virendra Singh (IEC2024015)",
  "timestamp": "2024-..."
}
```

---

## Update Your Frontend (Vercel)

Your frontend needs to point to Railway backend:

### Vercel Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables**

Add:
```bash
VITE_API_URL=https://nexuschat-server-production-1c58.up.railway.app/api
VITE_SOCKET_URL=https://nexuschat-server-production-1c58.up.railway.app
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Then **redeploy** your frontend.

---

## Common Railway Issues & Solutions

### Issue: "Application failed to respond"
**Solutions:**
1. Check logs in Railway dashboard
2. Verify `PORT` environment variable is set
3. Ensure `package.json` start script uses `process.env.PORT`

### Issue: Database Connection Failed
**Solutions:**
1. Verify `DATABASE_URL` is set
2. Check database is running
3. Run `npm run db:push` to create tables

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Update build command to include:
```bash
npm install && npm run db:generate && npm run build
```

### Issue: CORS Errors
**Solution:** Verify `CLIENT_URL` in Railway matches your Vercel URL exactly:
```bash
CLIENT_URL=https://nexuschat-viru876.vercel.app
```
(No trailing slash!)

---

## Railway CLI Quick Setup (Alternative)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_secret_here
railway variables set CLIENT_URL=https://nexuschat-viru876.vercel.app

# Add PostgreSQL
railway add -d postgresql

# Push database schema
railway run npm run db:push

# Deploy
railway up
```

---

## Monitoring Your Deployment

### Check Logs
```bash
# Via CLI
railway logs

# Or in Railway Dashboard → Your Service → "Logs" tab
```

### Check Metrics
Railway Dashboard → Your Service → **Metrics**
- CPU usage
- Memory usage
- Request count

---

## Cost Optimization

Railway Free Tier:
- ✅ $5 free credits per month
- ✅ 500 hours of usage
- ✅ 100GB outbound network

**Tips:**
1. Use Railway PostgreSQL (no extra cost)
2. Set up health check endpoint (already done!)
3. Monitor usage in dashboard

---

## Need to Start Fresh?

If you want to recreate deployment:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize new project
cd server
railway init

# Add PostgreSQL
railway add -d postgresql

# Set environment variables (see Step 2)
railway variables set NODE_ENV=production
# ... set other variables

# Deploy
railway up
```

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **NexusChat Issues:** https://github.com/Viru876/NexusChat/issues

---

## Quick Checklist

Before your backend works, ensure:
- [ ] Railway PostgreSQL added or DATABASE_URL set
- [ ] All environment variables configured
- [ ] Build command includes `npm run db:generate`
- [ ] Database schema pushed (`npm run db:push`)
- [ ] CLIENT_URL points to Vercel frontend
- [ ] Frontend .env points to Railway backend
- [ ] Deployment completed successfully

---

**Developer:** Virendra Singh (IEC2024015) - IIIT Allahabad  
**GitHub:** https://github.com/Viru876
