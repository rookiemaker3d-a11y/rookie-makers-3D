/**
 * Compila la web pública desde Paginaweb/Content-Hub → frontend/landing-dist
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const contentHubRoot = path.join(repoRoot, 'Paginaweb', 'Content-Hub')
const artifact = path.join(contentHubRoot, 'artifacts', 'rookie-makers-3d')

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('npx', ['--yes', 'pnpm@9', 'install', '--ignore-scripts'], contentHubRoot)
run('npx', ['vite', 'build', '--config', 'vite.root-landing.config.ts'], artifact)

console.log('landing → frontend/landing-dist listo.')
