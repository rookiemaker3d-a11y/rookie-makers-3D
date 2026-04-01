/**
 * Compila el sitio Replit/Content-Hub (rookie-makers-3d) → public/content-hub.
 * Usa pnpm vía npx (evita depender de corepack en Windows).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const contentHubRoot = path.join(repoRoot, 'Content-Hub')
const artifact = path.join(contentHubRoot, 'artifacts', 'rookie-makers-3d')

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('npx', ['--yes', 'pnpm@9', 'install', '--ignore-scripts'], contentHubRoot)
run('npx', ['vite', 'build', '--config', 'vite.standalone.config.ts'], artifact)

console.log('content-hub → frontend/public/content-hub listo.')
