# NexusChat Deployment Health Check
Write-Host "================================" -ForegroundColor Cyan
Write-Host "NexusChat Deployment Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://nexuschat-server-production-1c58.up.railway.app/api/health"
$frontendUrl = "https://nexuschat-viru876.vercel.app"

# Check Backend
Write-Host "Checking Backend (Railway)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $backendUrl -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend is running!" -ForegroundColor Green
        Write-Host "   URL: $backendUrl" -ForegroundColor White
        $content = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($content.status)" -ForegroundColor White
        Write-Host "   Developer: $($content.developer)" -ForegroundColor White
    }
}
catch {
    Write-Host "Backend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: Web request failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix your Railway deployment:" -ForegroundColor Yellow
    Write-Host "   Read: RAILWAY_DEPLOYMENT.md" -ForegroundColor White
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Environment variables not set on Railway" -ForegroundColor White
    Write-Host "   2. Database not connected" -ForegroundColor White
    Write-Host "   3. Build/start commands not configured" -ForegroundColor White
}

Write-Host ""

# Check Frontend
Write-Host "Checking Frontend (Vercel)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend is running!" -ForegroundColor Green
        Write-Host "   URL: $frontendUrl" -ForegroundColor White
    }
}
catch {
    Write-Host "Frontend is NOT responding" -ForegroundColor Red
    Write-Host "   Error: Web request failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - RAILWAY_DEPLOYMENT.md  → Railway setup guide" -ForegroundColor White
Write-Host "   - server/SETUP.md        → Local development" -ForegroundColor White
Write-Host ""
