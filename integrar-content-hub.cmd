@echo off
chcp 65001 >nul
set REPO=C:\Users\norbe\Desktop\rokie
cd /d "%REPO%"

echo [1/4] Quitando puntero git de Content-Hub (si sigue en el indice)...
git rm -r --cached Paginaweb\Content-Hub 2>nul

echo [2/4] Borrando carpeta .git DENTRO de Content-Hub (CMD, no PowerShell)...
if exist "Paginaweb\Content-Hub\.git" (
  rmdir /s /q "Paginaweb\Content-Hub\.git"
  echo    Hecho: ya no es repo embebido.
) else (
  echo    No habia .git interno, sigue.
)

echo [3/4] Anadiendo archivos reales de Content-Hub...
git add Paginaweb\Content-Hub
git add frontend\Dockerfile frontend\scripts\build-landing.mjs integrar-content-hub.cmd 2>nul

echo [4/4] Estado:
git status

echo.
echo Si ves Paginaweb/Content-Hub en verde con miles de archivos, ejecuta:
echo   git commit -m "fix: Content-Hub como archivos en repo"
echo   git push origin main
echo.
pause
