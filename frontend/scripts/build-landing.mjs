/**
 * Web pública desde Paginaweb/Content-Hub → frontend/landing-dist.
 * Si falta Content-Hub (clone sin archivos / submódulo vacío) y ALLOW_MINIMAL_LANDING=1, genera landing mínima → /app/
 */
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const contentHubRoot = path.join(repoRoot, 'Paginaweb', 'Content-Hub')
const artifact = path.join(contentHubRoot, 'artifacts', 'rookie-makers-3d')
const contentHubPkg = path.join(contentHubRoot, 'package.json')
const artifactPkg = path.join(artifact, 'package.json')
const landingDist = path.join(repoRoot, 'frontend', 'landing-dist')

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function writeMinimalLanding() {
  fs.mkdirSync(landingDist, { recursive: true })
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=/app/" />
  <title>Rookie Makers 3D</title>
  <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0}a{color:#22d3ee}</style>
</head>
<body>
  <p>Redirigiendo al sistema… <a href="/app/">Entrar al ERP</a>.</p>
  <p style="font-size:14px;margin-top:1rem;opacity:0.75">La web pública completa requiere subir Paginaweb/Content-Hub al repositorio.</p>
</body>
</html>
`
  fs.writeFileSync(path.join(landingDist, 'index.html'), html, 'utf8')
  console.warn(
    '[build-landing] Content-Hub ausente: landing mínima (ALLOW_MINIMAL_LANDING=1). Sube Content-Hub al repo para la landing real.',
  )
}

const hasContentHub = fs.existsSync(contentHubPkg) && fs.existsSync(artifactPkg)
const allowMinimal = process.env.ALLOW_MINIMAL_LANDING === '1'

if (!hasContentHub) {
  writeMinimalLanding()
  process.exit(0)
}

run('npx', ['--yes', 'pnpm@9', 'install', '--ignore-scripts'], contentHubRoot)
run('npx', ['vite', 'build', '--config', 'vite.root-landing.config.ts'], artifact)

// Vite con outDir fuera del proyecto a veces no copia todo `public/`; forzar galería.
const portfolioSrc = path.join(artifact, 'public', 'portfolio')
const portfolioDest = path.join(landingDist, 'portfolio')
if (fs.existsSync(portfolioSrc)) {
  fs.mkdirSync(portfolioDest, { recursive: true })
  fs.cpSync(portfolioSrc, portfolioDest, { recursive: true })
}

console.log('landing → frontend/landing-dist (Content-Hub).')
