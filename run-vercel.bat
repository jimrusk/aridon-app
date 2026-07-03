@echo off
title Aridon - Vercel Deploy
cd /d "%~dp0"
echo Deploying Aridon to Vercel...
echo.
vercel --yes --name aridon-app
echo.
echo Done! Check above for your deployment URL.
pause
