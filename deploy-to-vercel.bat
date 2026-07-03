@echo off
title Aridon - Deploy to Vercel
color 0A
echo.
echo ========================================
echo   ARIDON - Deploy to Vercel (via CLI)
echo ========================================
echo.
echo This will install the Vercel CLI and deploy your app.
echo A browser window will open for you to log in to Vercel.
echo.
pause

cd /d "%~dp0"

echo.
echo Installing Vercel CLI...
call npm install -g vercel

if %errorlevel% neq 0 (
    echo.
    echo npm install failed. Make sure Node.js is installed.
    pause
    exit /b
)

echo.
echo ========================================
echo   Deploying Aridon...
echo ========================================
echo.
echo When prompted:
echo   - Set up and deploy: Y
echo   - Which scope: choose your account
echo   - Link to existing project: N
echo   - Project name: aridon-app
echo   - Which directory: .  (just press Enter)
echo   - Override settings: N
echo.
echo Your browser will open for Vercel login.
echo After login, come back here and follow the prompts.
echo.
pause

call vercel --yes

echo.
echo ========================================
echo   Add your OPENAI_API_KEY on Vercel:
echo ========================================
echo.
echo 1. Go to https://vercel.com/dashboard
echo 2. Click on aridon-app project
echo 3. Settings - Environment Variables
echo 4. Add: OPENAI_API_KEY = sk-...
echo 5. Redeploy
echo.
pause
