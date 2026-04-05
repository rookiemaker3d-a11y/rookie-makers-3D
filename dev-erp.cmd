@echo off
setlocal
cd /d "%~dp0"

echo [1/3] Levantando solo Postgres + API (sin nginx Docker, n8n ni ollama)...
docker compose up -d db backend
if errorlevel 1 (
  echo Error en docker compose. Comprueba que Docker Desktop este en marcha.
  pause
  exit /b 1
)

echo.
echo [2/3] API en http://127.0.0.1:8002  (docs: http://127.0.0.1:8002/docs )
echo Si es la primera vez, en otra ventana CMD ejecuta UNA VEZ:
echo   docker compose exec backend python -m app.seed
echo Usuario seed: norbertomoro4@gmail.com / admin123
echo.

echo [3/3] Frontend Vite (ERP) en http://localhost:5173  — rutas: /login, /, etc.
cd frontend
call npm run dev

endlocal
