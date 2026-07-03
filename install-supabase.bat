@echo off
echo Installing Supabase client...
cd /d "%~dp0"
npm install @supabase/supabase-js
echo.
echo Done! Now run deploy-prod.bat to deploy to Vercel.
pause
