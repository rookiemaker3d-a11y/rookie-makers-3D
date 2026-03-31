@echo off
cd /d "%~dp0"
echo Borrando node_modules...
if exist node_modules rmdir /s /q node_modules
echo npm install...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo Si falla de nuevo, cierra Cursor y vuelve a ejecutar este archivo.
  exit /b 1
)
echo Listo. Ejecuta: npm run dev
