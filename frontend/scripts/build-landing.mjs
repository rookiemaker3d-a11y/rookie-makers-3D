/**
 * Compila la web pública desde Paginaweb/Content-Hub → frontend/landing-dist.
 * Si Content-Hub no está (clone sin submódulo / carpeta vacía), genera una landing mínima con enlace al ERP en /app/.
 */
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const contentHubRoot = path.join(repoRoot, 'Paginaweb', 'Content-Hub')
const artifact = path.join(contentHubRoot, 'artifacts', 'rookie-makers-3d')
const landingDist = path.join(repoRoot, 'frontend', 'landing-dist')
const contentHubPkg = path.join(contentHubRoot, 'package.json')

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
  <p>Redirigiendo al sistema… Si no cambia la página, <a href="/app/">entra aquí</a>.</p>
</body>
</html>
`
  fs.writeFileSync(path.join(landingDist, 'index.html'), html, 'utf8')
  console.warn(
    '[build-landing] Paginaweb/Content-Hub sin package.json (submódulo no inicializado o vacío). Se generó landing-dist mínima → /app/',
  )
}

if (!fs.existsSync(contentHubPkg)) {
  writeMinimalLanding()
  process.exit(0)
}

run('npx', ['--yes', 'pnpm@9', 'install', '--ignore-scripts'], contentHubRoot)
run('npx', ['vite', 'build', '--config', 'vite.root-landing.config.ts'], artifact)

console.log('landing → frontend/landing-dist listo.')
