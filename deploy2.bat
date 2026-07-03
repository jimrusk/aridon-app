@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
vercel deploy --yes
echo.
echo Exit code: %ERRORLEVEL%
pause
