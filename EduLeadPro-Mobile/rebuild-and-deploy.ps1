# Force rebuild and deploy mobile app
Write-Host "Step 1: Attempting to remove dist folder..." -ForegroundColor Yellow

# Try to remove dist folder
if (Test-Path "dist") {
    try {
        Remove-Item -Path "dist" -Recurse -Force -ErrorAction Stop
        Write-Host "✓ dist folder removed" -ForegroundColor Green
    } catch {
        Write-Host "✗ Could not remove dist folder - it's locked by another process" -ForegroundColor Red
        Write-Host "Please close VS Code, File Explorer windows, and any terminals with this path open." -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "`nStep 2: Building web app..." -ForegroundColor Yellow
npm run build:web

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 3: Copying vercel.json to dist..." -ForegroundColor Yellow
Copy-Item -Path "vercel.json" -Destination "dist/vercel.json" -Force
Write-Host "✓ vercel.json copied" -ForegroundColor Green

Write-Host "`nStep 4: Deploying to Vercel..." -ForegroundColor Yellow
npx vercel dist --prod --yes

Write-Host "`n✓ Deployment complete!" -ForegroundColor Green
Write-Host "Check: https://eduleadapp.vercel.app" -ForegroundColor Cyan
