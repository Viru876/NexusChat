# 🚀 Deploy NexusChat to Render.com (FREE)

## Why Render?
- ✅ **100% Free** tier (no credit card needed)
- ✅ Free PostgreSQL database
- ✅ Auto-deploy from GitHub
- ✅ No trial limits

---

## 🎯 SIMPLE 3-STEP DEPLOYMENT:

### **Step 1: Sign Up & Connect GitHub (2 min)**

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with **GitHub**
4. Authorize Render to access your repositories

---

### **Step 2: Create New Web Service (1 min)**

1. Click **"New +"** → **"Web Service"**
2. Select repository: **`NexusChat`**
3. Configure:
   - **Name:** `nexuschat-server`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run db:generate && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. Click **"Create Web Service"**

---

### **Step 3: Add PostgreSQL Database (1 min)**

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `nexuschat-db`
   - **Database:** `nexuschat`
   - **User:** `nexuschat`
   - **Region:** `Oregon (US West)`
   - **Instance Type:** `Free`

3. Click **"Create Database"**

4. **Copy the Internal Database URL**

---

### **Step 4: Set Environment Variables (1 min)**

In your **nexuschat-server** web service:

1. Go to **"Environment"** tab
2. Add these variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=nexuschat_jwt_secret_2024_change_this
JWT_EXPIRE=7d
CLIENT_URL=https://nexuschat-viru876.vercel.app
DATABASE_URL=<paste_your_database_internal_url_here>
```

3. Click **"Save Changes"** (triggers redeploy)

---

### **Step 5: Push Database Schema**

After deployment completes:

```bash
# Use your Render database URL
DATABASE_URL="your_render_db_url" npm run db:push
```

Or copy from Render dashboard → Database → "Internal Database URL"

---

## ✅ Your Backend URL

After deployment (takes 3-5 minutes):

```
https://nexuschat-server.onrender.com/api/health
```

---

## 📝 Update Frontend (Vercel)

Go to Vercel → Your project → Settings → Environment Variables

Update:
```
VITE_API_URL=https://nexuschat-server.onrender.com/api
VITE_SOCKET_URL=https://nexuschat-server.onrender.com
```

Redeploy frontend!

---

## ⚠️ Render Free Tier Notes

- **Spins down after 15 min inactivity**
- First request after sleep takes ~30 seconds
- Perfect for demos and development
- Upgrade to paid for production

---

## 🔥 Quick Summary

1. Sign up: https://render.com
2. New Web Service → Connect NexusChat repo
3. New PostgreSQL → Get database URL
4. Set environment variables
5. Wait for deploy
6. Test: `https://nexuschat-server.onrender.com/api/health`

**Done! 🎉**
