@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo === Aridon v0.3 Deploy ===
echo.
echo Step 1: Installing packages...
npm install
echo.
echo Step 2: Deploying to Production (includes portraits + Supabase code)...
vercel --prod --yes
echo.
echo Exit code: %ERRORLEVEL%
echo.
echo If you see errors above, copy and paste them so we can fix them.
pause
