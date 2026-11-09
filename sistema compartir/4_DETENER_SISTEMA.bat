@echo off
title AndesGo - Detener sistema
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AndesGo\scripts\detener_sistema.ps1"
echo.
pause
