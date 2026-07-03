@echo off
title Aridon - Push All to GitHub
cd /d "%~dp0"
echo Pushing all files (portraits + Supabase code) to GitHub...
echo Vercel will auto-deploy after this completes.
echo.
node push-all.js
pause
