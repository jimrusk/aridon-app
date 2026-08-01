@echo off
title Aridon AWG-1000 Pitch Deck Generator
cd /d "%~dp0"
echo.
echo  ================================================
echo   Aridon AWG-1000 Pitch Deck Generator
echo   18-Slide Full Investor Pitch
echo  ================================================
echo.
echo  Installing pptxgenjs (if needed)...
call npm install pptxgenjs --save-dev --silent 2>nul
echo.
echo  Building pitch deck...
echo.
node generate-pitch.js
echo.
echo  Check your .codex folder for:
echo  Aridon-AWG1000-Pitch.pptx
echo.
pause
