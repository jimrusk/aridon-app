@echo off
title Aridon Document Generator
cd /d "%~dp0"
echo.
echo  ================================================
echo   Aridon Document Generator  v2
echo   Full Strategic Business Model — Word + PowerPoint
echo  ================================================
echo.
echo  Installing packages (first time only)...
echo.
call npm install docx pptxgenjs --save --silent 2>nul
echo.
echo  Generating documents...
echo.
node generate-docs.js
echo.
echo  Check your .codex folder for the files!
echo.
pause
