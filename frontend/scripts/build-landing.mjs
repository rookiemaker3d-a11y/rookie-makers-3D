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
  <title>Rookie Makers 3D — Impresión 3D a medida</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column}
    .hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem}
    h1{font-family:'Bebas Neue',sans-serif;font-size:3rem;color:#22d3ee;margin-bottom:0.5rem}
    p.sub{color:#94a3b8;font-size:1.1rem;max-width:500px;margin-bottom:2rem}
    .cta{display:inline-block;background:#22d3ee;color:#0f172a;padding:0.8rem 2rem;border-radius:12px;text-decoration:none;font-weight:700;font-size:1rem;transition:background 0.2s}
    .cta:hover{background:#06b6d4}
    .footer{padding:1.5rem;text-align:center;color:#64748b;font-size:0.85rem}
    .footer a{color:#22d3ee;text-decoration:none}
  </style>
</head>
<body>
  <div class="hero">
    <h1>Rookie Makers 3D</h1>
    <p class="sub">Impresión 3D personalizada. Cotiza tu proyecto en segundos y recibe tu pieza en la puerta de tu casa.</p>
    <a href="/app/" class="cta">Entrar al sistema</a>
  </div>
  <div class="footer">
    <p>&copy; 2026 Rookie Makers 3D &middot; <a href="/app/login">Iniciar sesión</a></p>
  </div>
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

// Si landing-dist ya tiene contenido (pre-construida en el repo), usarla directamente
const indexHtml = path.join(landingDist, 'index.html')
if (fs.existsSync(indexHtml) && fs.readFileSync(indexHtml, 'utf8').includes('Rookie Makers 3D')) {
  console.log('[build-landing] landing-dist pre-construida encontrada. Saltando build de Content-Hub.')
  process.exit(0)
}

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
