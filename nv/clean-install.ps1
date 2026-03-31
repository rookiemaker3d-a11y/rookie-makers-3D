# Limpia node_modules corrupto y reinstala (evita ENOTEMPTY en Windows).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ">> Borrando node_modules (puede tardar un minuto)..."
if (Test-Path "node_modules") {
  npx --yes rimraf@5 "node_modules"
}

Write-Host ">> npm install..."
npm install --no-audit --no-fund

if ($LASTEXITCODE -ne 0) {
  Write-Host ">> Fallo. Prueba: cerrar Cursor/IDE, repetir, o reiniciar el PC si sigue bloqueado." -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host ">> Listo. Ejecuta: npm run dev" -ForegroundColor Green
