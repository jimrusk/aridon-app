@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo.
echo =========================================
echo   Set D-ID API Key via Vercel CLI
echo =========================================
echo.
echo Paste your D-ID API key and press Enter:
set /p DID_KEY="> "
echo.

echo Your key starts with: %DID_KEY:~0,6%...
echo.

echo Writing key to temp file...
echo %DID_KEY%> did_key_temp.txt

echo Removing any existing DID_API_KEY...
vercel env rm DID_API_KEY production --yes 2>nul
vercel env rm DID_API_KEY preview --yes 2>nul
vercel env rm DID_API_KEY development --yes 2>nul

echo.
echo Adding DID_API_KEY to Production...
vercel env add DID_API_KEY production < did_key_temp.txt

echo Adding DID_API_KEY to Preview...
vercel env add DID_API_KEY preview < did_key_temp.txt

echo Adding DID_API_KEY to Development...
vercel env add DID_API_KEY development < did_key_temp.txt

echo.
echo Cleaning up...
del did_key_temp.txt

echo.
echo Verifying env vars are set...
vercel env ls

echo.
echo Deploying with --force to skip build cache...
vercel --prod --yes --archive=tgz --force > deploy-result.txt 2>&1
type deploy-result.txt

echo.
echo =========================================
echo DONE. Now check aridon-v02.vercel.app/api/did/debug
echo =========================================
pause
