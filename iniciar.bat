@echo off
cd /d "%~dp0"

echo Liberando puertos 8001 y 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8001') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5173') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Iniciando Rookie Makers 3D (frontend + backend)...
echo Abre en el navegador: http://localhost:5173
echo.
npm start
