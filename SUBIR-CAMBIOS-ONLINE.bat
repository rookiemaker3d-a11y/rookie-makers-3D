@echo off
title Actualizacion - Rookie Makers 3D
cd /d "%~dp0"

echo.
echo ============================================
echo   ACTUALIZACION DEL PROCESO - SUBIR CAMBIOS
echo   Rookie Makers 3D ERP
echo ============================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado.
    echo Instala desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist ".git" (
    echo [Paso 0] Inicializando repositorio...
    git init
    git branch -M main
    echo.
    echo Conecta tu repo con:
    echo   git remote add origin URL_DE_TU_REPO
    echo.
    pause
    exit /b 0
)

echo [Paso 1/3] Anadiendo archivos...
git add .
if errorlevel 1 (
    echo [ERROR] Fallo git add.
    pause
    exit /b 1
)
echo   OK.
echo.

echo [Paso 2/3] Creando commit...
set MSG=Actualizacion: mejoras y correcciones
if not "%~1"=="" set MSG=%~1
git commit -m "%MSG%"
if errorlevel 1 (
    echo   No hay cambios nuevos o ya estan guardados.
    echo   Si quieres forzar un commit vacio no uses este script.
    pause
    exit /b 0
)
echo   OK.
echo.

echo [Paso 3/3] Subiendo a GitHub (origin main)...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] Fallo el push. Revisa:
    echo   - git remote -v
    echo   - Token o credenciales de GitHub
    pause
    exit /b 1
)

echo.
echo ============================================
echo   LISTO. Actualizacion enviada.
echo ============================================
echo.
echo   Vercel y Render redesplegaran en 2-5 min.
echo   Revisa ACTUALIZACION-SERVIDOR.md para:
echo   - Comprobar despliegue
echo   - Migraciones SQL si hay tablas nuevas
echo   - Variables de entorno
echo.
pause
