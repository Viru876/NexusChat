# Railway Setup Script for NexusChat
# This script will help you configure your Railway deployment

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Railway Configuration Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Follow these steps to fix your Railway deployment:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Login to Railway" -ForegroundColor Cyan
Write-Host "   Run: railway login" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Link to your project" -ForegroundColor Cyan
Write-Host "   Run: railway link" -ForegroundColor White
Write-Host "   Select your project: nexuschat-server-production-1c58" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Add PostgreSQL Database" -ForegroundColor Cyan
Write-Host "   Option A - Via CLI:" -ForegroundColor Yellow
Write-Host "     railway add -d postgresql" -ForegroundColor White
Write-Host ""
Write-Host "   Option B - Via Dashboard:" -ForegroundColor Yellow
Write-Host "     1. Go to https://railway.app" -ForegroundColor White
Write-Host "     2. Open your project" -ForegroundColor White
Write-Host "     3. Click '+ New' -> 'Database' -> 'PostgreSQL'" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Set Environment Variables" -ForegroundColor Cyan
Write-Host "   Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   railway variables set NODE_ENV=production" -ForegroundColor Green
Write-Host "   railway variables set JWT_SECRET=nexuschat_jwt_secret_2024_change_in_production" -ForegroundColor Green
Write-Host "   railway variables set JWT_EXPIRE=7d" -ForegroundColor Green
Write-Host "   railway variables set CLIENT_URL=https://nexuschat-viru876.vercel.app" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Push Database Schema" -ForegroundColor Cyan
Write-Host "   After PostgreSQL is added, run:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Green
Write-Host "   railway run npm run db:push" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Deploy" -ForegroundColor Cyan
Write-Host "   railway up" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Verify" -ForegroundColor Cyan
Write-Host "   Check: https://nexuschat-server-production-1c58.up.railway.app/api/health" -ForegroundColor White
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Try to execute Railway commands
Write-Host "Attempting to run Railway commands..." -ForegroundColor Yellow
Write-Host ""

# Check if logged in
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
$loginStatus = railway whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Logged in as: $loginStatus" -ForegroundColor Green
    Write-Host ""
    
    # Try to link
    Write-Host "Would you like to link to your Railway project now? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        railway link
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Project linked successfully!" -ForegroundColor Green
            Write-Host ""
            
            Write-Host "Setting environment variables..." -ForegroundColor Yellow
            railway variables set NODE_ENV=production
            railway variables set JWT_SECRET=nexuschat_jwt_secret_2024_change_in_production
            railway variables set JWT_EXPIRE=7d
            railway variables set CLIENT_URL=https://nexuschat-viru876.vercel.app
            
            Write-Host ""
            Write-Host "Variables set! Now you need to:" -ForegroundColor Green
            Write-Host "1. Add PostgreSQL: railway add -d postgresql" -ForegroundColor White
            Write-Host "2. Push schema: railway run npm run db:push" -ForegroundColor White
            Write-Host "3. Deploy: railway up" -ForegroundColor White
        }
    }
} else {
    Write-Host "Not logged in to Railway" -ForegroundColor Red
    Write-Host "Run: railway login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Manual Setup (If CLI doesn't work)" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to Railway Dashboard: https://railway.app" -ForegroundColor White
Write-Host ""
Write-Host "1. Add PostgreSQL:" -ForegroundColor Yellow
Write-Host "   + New -> Database -> PostgreSQL" -ForegroundColor White
Write-Host ""
Write-Host "2. Set Variables (in Variables tab):" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host "   JWT_SECRET=nexuschat_jwt_secret_2024" -ForegroundColor White
Write-Host "   JWT_EXPIRE=7d" -ForegroundColor White
Write-Host "   CLIENT_URL=https://nexuschat-viru876.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure Build (in Settings tab):" -ForegroundColor Yellow
Write-Host "   Build Command: npm install && npm run db:generate && npm run build" -ForegroundColor White
Write-Host "   Start Command: npm start" -ForegroundColor White
Write-Host ""
Write-Host "4. Push to GitHub to trigger redeploy" -ForegroundColor Yellow
Write-Host ""
