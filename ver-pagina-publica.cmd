@echo off
setlocal EnableExtensions
rem Web publica SOLO desde esta ruta (no hay copia en frontend/public):
set "CH=C:\Users\norbe\Desktop\rokie\Paginaweb\Content-Hub"
cd /d "%CH%" 2>nul
if errorlevel 1 (
  echo No se pudo entrar a: %CH%
  pause
  exit /b 1
)
if not exist "package.json" (
  echo Falta package.json en Content-Hub.
  pause
  exit /b 1
)
if not exist "artifacts\rookie-makers-3d\package.json" (
  echo Falta artifacts\rookie-makers-3d en Content-Hub.
  pause
  exit /b 1
)

echo Instalando workspace pnpm en Content-Hub (primera vez tarda)...
call npx --yes pnpm@9 install --ignore-scripts
if errorlevel 1 (
  echo Error en pnpm install
  pause
  exit /b 1
)

cd /d "%CH%\artifacts\rookie-makers-3d"
echo.
echo Web publica:  http://localhost:5174   (o tu IP de red, ej. 172.x.x.x:5174)
echo Para ENTRAR al ERP: deja corriendo en OTRA ventana el front del sistema:
echo   cd rokie\frontend ^&^& npm run dev   --^>  http://localhost:5173/login
echo.
echo Cierra esta ventana para detener solo la web publica.
echo.
call npx vite --config vite.root-landing.config.ts --port 5174 --host
endlocal
