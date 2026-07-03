@echo off
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
echo ========================================
echo   ARIDON - Push to GitHub via Git
echo ========================================
echo.

:: Set global git identity FIRST (required before any commit)
git config --global user.email "jimrusk66@gmail.com"
git config --global user.name "Jim Rusk"
echo Git identity set ✓

:: Initialize repo if not already done
if not exist ".git" (
  echo Initializing git...
  git init -b main
) else (
  echo Git repo found ✓
)
echo.

:: Set remote to jimrusk/aridon-app
git remote remove origin 2>nul
git remote add origin https://github.com/jimrusk/aridon-app.git
echo Remote set to jimrusk/aridon-app ✓
echo.

:: Stage everything
echo Staging all files...
git add -A
echo.

:: Check if there's anything to commit
git diff --cached --quiet
if %errorlevel% equ 0 (
  echo Nothing new to commit - forcing with empty commit...
  git commit --allow-empty -m "Aridon v0.3 - force redeploy"
) else (
  echo Committing changes...
  git commit -m "Aridon v0.3 - portraits, Supabase, CSS fix"
)
echo.

:: Push (force to override any history mismatch)
echo Pushing to GitHub...
echo When asked for username: jimrusk
echo When asked for password: paste your GitHub PAT
echo.
git push -u origin main --force

echo.
if %errorlevel% equ 0 (
  echo ========================================
  echo   SUCCESS!
  echo   Vercel will auto-deploy in ~60 sec.
  echo   Check: aridon-v02.vercel.app/test.html
  echo ========================================
) else (
  echo PUSH FAILED.
  echo.
  echo Most likely fix:
  echo   1. github.com/settings/tokens/new
  echo   2. Check REPO scope, generate token
  echo   3. Run this file again
  echo   4. Username: jimrusk
  echo   5. Password: paste the token
)
echo.
pause
