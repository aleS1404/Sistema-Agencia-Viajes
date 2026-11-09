@echo off
title AndesGo - Instalar dependencias
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0AndesGo\scripts\instalar_dependencias.ps1"
echo.
pause
