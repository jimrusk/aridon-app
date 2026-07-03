@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo Running next build locally...
npm run build > build-output.txt 2>&1
echo Exit code: %ERRORLEVEL% >> build-output.txt
echo Done. Check build-output.txt
pause
