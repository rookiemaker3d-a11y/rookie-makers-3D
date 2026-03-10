@echo off
chcp 65001 >nul
echo ============================================
echo   SUBIR CAMBIOS A INTERNET (Vercel/Render)
echo ============================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no está instalado o no está en el PATH.
    echo.
    echo 1. Instala Git: https://git-scm.com/download/win
    echo 2. Cierra y abre de nuevo CMD.
    echo 3. Vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist ".git" (
    echo Inicializando repositorio Git...
    git init
    git branch -M main
    echo.
    echo [IMPORTANTE] Ahora debes conectar con tu repo de GitHub:
    echo   1. Entra a https://github.com y crea un repo NUEVO (o usa el que ya tiene Vercel/Render).
    echo   2. Copia la URL del repo (ej: https://github.com/TU_USUARIO/rokie.git).
    echo   3. Ejecuta en esta misma carpeta:
    echo      git remote add origin https://github.com/TU_USUARIO/rokie.git
    echo   4. Luego ejecuta de nuevo este .bat para hacer add, commit y push.
    echo.
    pause
    exit /b 0
)

echo Añadiendo todos los archivos...
git add .
echo.
echo Creando commit con los últimos cambios...
git commit -m "Estilos modo claro, vendedores solo admin, editar y contraseñas, permisos productos y análisis"
if errorlevel 1 (
    echo No hay cambios que subir, o ya están guardados.
    pause
    exit /b 0
)
echo.
echo Subiendo a la nube (origin main)...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Si es la primera vez, asegúrate de haber ejecutado:
    echo   git remote add origin URL_DE_TU_REPO_GITHUB
    echo Si ya tienes remote y falla, revisa usuario/contraseña o token de GitHub.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   LISTO. Vercel y Render redesplegarán solos.
echo   Espera 2-5 minutos y recarga la web.
echo ============================================
pause
