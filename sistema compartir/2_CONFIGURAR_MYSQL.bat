@echo off
title AndesGo - Configurar MySQL
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AndesGo\scripts\configurar_mysql.ps1"
echo.
pause
