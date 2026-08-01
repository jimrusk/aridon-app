@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"

echo.
echo ============================================
echo   Aridon Deploy
echo ============================================
echo.

REM Check if .env.production exists with the D-ID key
if not exist ".env.production" (
    echo .env.production not found!
    echo Run setup-did.ps1 first to set your D-ID key:
    echo   powershell -ExecutionPolicy Bypass -File setup-did.ps1
    echo.
    pause
    exit /b 1
)

findstr /C:"DID_API_KEY" .env.production >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo .env.production exists but DID_API_KEY is missing from it.
    echo Run setup-did.ps1 to fix this.
    echo.
    pause
    exit /b 1
)

echo [OK] .env.production has DID_API_KEY
echo.
echo Installing packages...
call npm install --silent
echo.
echo Deploying to Vercel (uploading all files including .env.production)...
vercel --prod --yes --archive=tgz > deploy-result.txt 2>&1
echo.
echo Deploy finished. Opening result...
notepad deploy-result.txt
echo.
echo ============================================
echo Check: https://aridon-v02.vercel.app/api/did/debug
echo ============================================
pause
