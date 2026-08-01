@echo off
title Aridon Customer Provisioner
cd /d "%~dp0"
echo.
echo  ================================================
echo   Aridon Customer Provisioner
echo   Deploy a fresh Aridon site for a new customer
echo  ================================================
echo.
node provision-customer.js
echo.
pause
