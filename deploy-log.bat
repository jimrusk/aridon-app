@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo Checking Vercel login status...
vercel whoami > deploy-output.txt 2>&1
echo Running deployment...
vercel --yes >> deploy-output.txt 2>&1
echo Done. Output saved to deploy-output.txt
type deploy-output.txt
pause
