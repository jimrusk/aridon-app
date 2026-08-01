@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo Gathering Vercel info... please wait.
echo.

echo === VERCEL ACCOUNT === > vercel-debug.txt
vercel whoami >> vercel-debug.txt 2>&1

echo. >> vercel-debug.txt
echo === LINKED PROJECT === >> vercel-debug.txt
vercel inspect --yes >> vercel-debug.txt 2>&1

echo. >> vercel-debug.txt
echo === DEPLOYING NOW (verbose) === >> vercel-debug.txt
vercel --prod --yes --debug >> vercel-debug.txt 2>&1

echo Done! Opening results...
notepad vercel-debug.txt
pause
