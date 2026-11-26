@echo off
cd /d "%~dp0"
if not exist "node_modules\mysql2" (
  echo Instalando dependencias de la API...
  call npm ci --ignore-scripts
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Conserva abierta una terminal de Ubuntu y esta ventana mientras usas el proyecto.
wsl -d Ubuntu -u root -- systemctl start mysql
if errorlevel 1 (
  echo No se pudo iniciar MySQL en Ubuntu.
  pause
  exit /b 1
)
node api/app.js
pause
