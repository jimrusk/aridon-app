@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo Removing cached Vercel project link...
rmdir /s /q .vercel 2>nul
echo Done. Deploying fresh...
vercel --yes
pause
