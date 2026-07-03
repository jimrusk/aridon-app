@echo off
title Aridon GitHub Setup
color 0B
echo.
echo ========================================
echo   ARIDON - GitHub Setup
echo ========================================
echo.

:: Check git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed.
    echo Download it at: https://git-scm.com/download/win
    pause
    exit /b
)

for /f "tokens=*" %%i in ('git --version') do echo Git found: %%i
echo.
echo Working in: %~dp0
echo.

:: Initialize git if needed
cd /d "%~dp0"
if not exist ".git" (
    echo Initializing git repo...
    git init
    git branch -M main
)

:: Stage and commit
echo Staging all files...
git add .
echo.
echo Creating initial commit...
git commit -m "Initial commit - Aridon v0.2 AI Executive OS"

echo.
echo ========================================
echo   Connect to GitHub
echo ========================================
echo.
echo Step 1: Go to https://github.com/new
echo         Create a repo named: aridon-app
echo         Do NOT add README or .gitignore
echo.

set /p username=Step 2: Enter your GitHub username:

if "%username%"=="" (
    echo No username entered. Exiting.
    pause
    exit /b
)

echo.
echo Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/%username%/aridon-app.git

echo.
echo Pushing to GitHub...
echo (A credential window may pop up - sign in with your GitHub password or token)
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Code is live on GitHub.
    echo ========================================
    echo.
    echo NEXT STEP - Deploy on Vercel:
    echo   1. Go to https://vercel.com/new
    echo   2. Import from GitHub - select aridon-app
    echo   3. Add Environment Variable:
    echo      OPENAI_API_KEY = your-key-here
    echo   4. Click Deploy
    echo.
    start https://vercel.com/new
) else (
    echo.
    echo Push failed. You may need a Personal Access Token.
    echo.
    echo To create one:
    echo   https://github.com/settings/tokens/new
    echo   Scopes needed: repo (full control)
    echo   Use the token as your password when prompted.
    echo.
)

pause
