@echo off
title AndesGo - Iniciar sistema
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AndesGo\scripts\iniciar_sistema.ps1"
echo.
pause
