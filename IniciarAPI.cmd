@echo off
cd /d "%~dp0"
if not exist "node_modules\express" (
  echo Instalando dependencias de la API...
  call npm ci --ignore-scripts
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Conserva abierta esta ventana mientras usas productos y cotizaciones.
node api/app.js
pause
