@echo off
cd /d "%~dp0"
echo ============================================================
echo  Aridon Executive Photo Generator
echo ============================================================
echo.
echo You need your OpenAI API key to generate the photos.
echo Get one at: https://platform.openai.com/api-keys
echo (Click "Create new secret key" -- takes 30 seconds)
echo.
SET /P OPENAI_API_KEY=Paste your OpenAI API key here and press Enter:
echo.
echo Generating 7 executive portraits via DALL-E 3...
echo This takes about 2 minutes. Do not close this window.
echo.
node generate-exec-photos.js
echo.
pause
