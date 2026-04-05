/**
 * Única fuente de la web pública: Paginaweb/Content-Hub → frontend/landing-dist (build; no duplicar fuentes).
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

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

if (!fs.existsSync(contentHubPkg) || !fs.existsSync(artifactPkg)) {
  console.error(
    '[build-landing] Falta Paginaweb/Content-Hub (o artifacts/rookie-makers-3d). Ruta esperada:\n  ' +
      contentHubRoot,
  )
  process.exit(1)
}

run('npx', ['--yes', 'pnpm@9', 'install', '--ignore-scripts'], contentHubRoot)
run('npx', ['vite', 'build', '--config', 'vite.root-landing.config.ts'], artifact)

console.log('landing → frontend/landing-dist (solo Content-Hub).')
