@echo off
cd /d "%~dp0"

where git >nul 2>&1
if not %errorlevel%==0 (
    echo Git no esta instalado. Instala desde https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist ".git" (
    echo Inicializando repo...
    git init
    git branch -M main
    echo Conecta tu repo: git remote add origin URL_DE_TU_REPO
    pause
    exit /b 0
)

echo Anadiendo archivos...
git add .

echo Creando commit...
git commit -m "Actualizacion: Inventario, editor plantilla, fixes"
if not %errorlevel%==0 (
    echo No hay cambios nuevos o ya estan guardados.
    pause
    exit /b 0
)

echo Subiendo a GitHub...
git push -u origin main
if not %errorlevel%==0 (
    echo Fallo el push. Revisa remote y token de GitHub.
    pause
    exit /b 1
)

echo.
echo LISTO. Vercel y Render redesplegaran. Espera 2-5 min y recarga la web.
pause
