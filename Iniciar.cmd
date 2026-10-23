@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js 18 o superior, o abre esta carpeta con Live Server.
  pause
  exit /b 1
)
start "" http://localhost:4173
node servidor.cjs
pause
