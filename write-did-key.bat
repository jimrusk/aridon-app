@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo.
echo ============================================
echo   Write D-ID Key to .env.production
echo ============================================
echo.

powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$k = Read-Host 'Paste your D-ID API key';" ^
  "if ($k.Trim().Length -eq 0) { Write-Host 'No key entered - exiting.' -ForegroundColor Red; exit 1 }" ^
  "$path = Join-Path (Get-Location) '.env.production';" ^
  "[IO.File]::WriteAllText($path, 'DID_API_KEY=' + $k.Trim() + \"`n\");" ^
  "Write-Host ('Key written! Length: ' + $k.Trim().Length) -ForegroundColor Green"

if not exist ".env.production" (
    echo.
    echo FAILED to write .env.production  - check PowerShell output above.
    pause
    exit /b 1
)

echo.
echo Deploying to Vercel...
vercel --prod --yes --archive=tgz
echo.
echo ============================================
echo Check: https://aridon-v02.vercel.app/api/did/debug
echo ============================================
pause
