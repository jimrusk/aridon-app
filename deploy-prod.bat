@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo Deploying to Production...
vercel --prod --yes
echo.
echo Exit code: %ERRORLEVEL%
pause
