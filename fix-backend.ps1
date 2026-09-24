# NexusChat Backend Fix Script
# This will guide you through fixing your Railway deployment

Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NEXUSCHAT BACKEND FIX WIZARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Backend: https://nexuschat-server-production-1c58.up.railway.app" -ForegroundColor Yellow
Write-Host ""

# Step 1: Push to GitHub
Write-Host "STEP 1: Push Railway Config to GitHub" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "I've created railway.json and nixpacks.toml for you." -ForegroundColor White
Write-Host ""
Write-Host "Push to GitHub? (Y/N): " -ForegroundColor Yellow -NoNewline
$pushResponse = Read-Host

if ($pushResponse -eq "Y" -or $pushResponse -eq "y") {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Push failed. You can push manually later." -ForegroundColor Red
    }
} else {
    Write-Host "Skipped. You can push manually: git push origin main" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# Step 2: Railway Dashboard
Write-Host "STEP 2: Configure Railway Dashboard" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening Railway dashboard in browser..." -ForegroundColor Yellow
Start-Process "https://railway.app"
Write-Host ""
Write-Host "In Railway Dashboard, do the following:" -ForegroundColor White
Write-Host ""
Write-Host "A. Add PostgreSQL Database:" -ForegroundColor Cyan
Write-Host "   Click: + New -> Database -> PostgreSQL" -ForegroundColor White
Write-Host ""
Write-Host "B. Set Environment Variables (Variables tab):" -ForegroundColor Cyan
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host "   JWT_SECRET=nexuschat_jwt_secret_2024" -ForegroundColor White
Write-Host "   CLIENT_URL=https://nexuschat-viru876.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "C. Configure Build & Start (Settings tab):" -ForegroundColor Cyan
Write-Host "   Build: npm install && npm run db:generate && npm run build" -ForegroundColor White
Write-Host "   Start: npm start" -ForegroundColor White
Write-Host ""
Write-Host ""
Write-Host "Press Enter when you've done this..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host ""

# Step 3: Push Database Schema
Write-Host "STEP 3: Push Database Schema" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "After Railway deployment completes, push the database schema." -ForegroundColor White
Write-Host ""
Write-Host "Do you want to do this now? (Y/N): " -ForegroundColor Yellow -NoNewline
$schemaResponse = Read-Host

if ($schemaResponse -eq "Y" -or $schemaResponse -eq "y") {
    Write-Host ""
    Write-Host "Checking Railway CLI..." -ForegroundColor Yellow
    
    $railwayInstalled = $null -ne (Get-Command railway -ErrorAction SilentlyContinue)
    
    if (-not $railwayInstalled) {
        Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
        npm i -g @railway/cli
    }
    
    Write-Host ""
    Write-Host "Logging in to Railway..." -ForegroundColor Yellow
    railway login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Linking to project..." -ForegroundColor Yellow
        railway link
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Pushing database schema..." -ForegroundColor Yellow
            Set-Location server
            railway run npm run db:push
            Set-Location ..
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Schema pushed successfully!" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host ""
    Write-Host "You can do this later by running:" -ForegroundColor Yellow
    Write-Host "  railway login" -ForegroundColor White
    Write-Host "  railway link" -ForegroundColor White
    Write-Host "  cd server" -ForegroundColor White
    Write-Host "  railway run npm run db:push" -ForegroundColor White
}

Write-Host ""
Write-Host ""

# Step 4: Test
Write-Host "STEP 4: Test Your Backend" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Testing backend..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://nexuschat-server-production-1c58.up.railway.app/api/health" -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Host ""
        Write-Host "SUCCESS! Your backend is working!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Status: $($data.status)" -ForegroundColor White
        Write-Host "Service: $($data.service)" -ForegroundColor White
        Write-Host "Developer: $($data.developer)" -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "Backend not responding yet." -ForegroundColor Yellow
    Write-Host "This is normal if Railway is still deploying." -ForegroundColor White
    Write-Host ""
    Write-Host "Wait 2-3 minutes and test manually:" -ForegroundColor Yellow
    Write-Host "https://nexuschat-server-production-1c58.up.railway.app/api/health" -ForegroundColor White
}

Write-Host ""
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for Railway deployment to complete (check Railway dashboard)" -ForegroundColor White
Write-Host "2. Test: https://nexuschat-server-production-1c58.up.railway.app/api/health" -ForegroundColor White
Write-Host "3. Update Vercel frontend env vars to use Railway backend" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- FIX_RAILWAY_NOW.md - Quick reference" -ForegroundColor White
Write-Host "- RAILWAY_DEPLOYMENT.md - Complete guide" -ForegroundColor White
Write-Host "- RAILWAY_ENV_VARS.txt - All environment variables" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
