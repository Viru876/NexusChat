# NexusChat Backend Setup Guide

## 🚂 Already Deployed on Railway?

**Your Backend URL:** https://nexuschat-server-production-1c58.up.railway.app

If your Railway deployment isn't working, see **[RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)** for complete Railway-specific setup.

---

## Issues Fixed:
1. ✅ Created `.env` file with configuration
2. ✅ Installed all npm dependencies
3. ⚠️ Prisma client generation (network issue - needs retry)

## Next Steps to Get Backend Running:

### 1. Generate Prisma Client (Retry if network failed)
```bash
cd server
npm run db:generate
```
**Note:** If this fails with ECONNRESET, try again or check your internet connection.

### 2. Set Up PostgreSQL Database

You need a PostgreSQL database. Choose one option:

#### Option A: Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create a database:
   ```sql
   CREATE DATABASE nexuschat;
   ```
3. Update `.env` file with your credentials:
   ```
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/nexuschat
   ```

#### Option B: Free Cloud Database (Recommended for Quick Start)
Use one of these free services:
- **Supabase**: https://supabase.com (Free tier, easy setup)
- **Neon**: https://neon.tech (Serverless Postgres)
- **Railway**: https://railway.app (Free tier available)

After creating a database, copy the connection string to `.env`:
```
DATABASE_URL=postgresql://username:password@host:5432/database
```

### 3. Push Database Schema
```bash
npm run db:push
```
This creates all tables in your database.

### 4. Configure Optional Services

#### Email (for password reset)
- Use Gmail App Password or Resend API
- Update in `.env`:
  ```
  EMAIL_PASS=your_gmail_app_password
  # OR
  RESEND_API_KEY=your_resend_api_key
  ```

#### File Uploads (Cloudinary)
- Sign up at https://cloudinary.com (free tier)
- Update in `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

#### Google OAuth (optional)
- Create project at https://console.cloud.google.com
- Update in `.env`:
  ```
  GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
  ```

### 5. Start the Backend
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

### 6. Test the Backend
Open your browser or use curl:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "ok",
  "service": "NexusChat API",
  "developer": "Virendra Singh (IEC2024015)",
  "timestamp": "2024-..."
}
```

## Common Issues & Solutions

### Issue: Prisma Client Not Generated
**Error:** `Cannot find module '@prisma/client'`
**Solution:** 
```bash
npm run db:generate
```

### Issue: Database Connection Failed
**Error:** `Database connection failed`
**Solutions:**
1. Check DATABASE_URL in `.env`
2. Ensure PostgreSQL is running
3. Verify database credentials
4. Check if database exists

### Issue: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`
**Solution:** Change PORT in `.env` or kill the process using port 5000

### Issue: JWT_SECRET Warning
**Solution:** Update JWT_SECRET in `.env` with a strong random string:
```bash
# Generate a random secret (Git Bash or WSL)
openssl rand -base64 32
```

## Project Structure
```
server/
├── src/
│   ├── config/        # Database & configs
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, error handling
│   ├── socket/        # WebSocket handlers
│   └── index.ts       # Entry point
├── prisma/
│   └── schema.prisma  # Database schema
└── .env               # Environment variables
```

## Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio (database GUI)

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/workspaces` - Get workspaces
- More endpoints in respective route files

## Support
- Developer: Virendra Singh (IEC2024015)
- GitHub: https://github.com/Viru876
- College: IIIT Allahabad
