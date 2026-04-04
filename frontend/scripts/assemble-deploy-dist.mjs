/**
 * Une landing-dist (raíz del dominio) + dist (ERP bajo /app/) para Vercel u otra salida única.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const landing = path.join(root, 'landing-dist')
const erp = path.join(root, 'dist')
const out = path.join(root, 'deploy-dist')

if (!fs.existsSync(landing)) {
  console.error('Falta landing-dist. Ejecuta build:landing antes.')
  process.exit(1)
}
if (!fs.existsSync(erp)) {
  console.error('Falta dist del ERP (vite build).')
  process.exit(1)
}

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
fs.cpSync(landing, out, { recursive: true })
const appDir = path.join(out, 'app')
fs.mkdirSync(appDir, { recursive: true })
fs.cpSync(erp, appDir, { recursive: true })

console.log('deploy-dist listo (landing en /, ERP en /app/).')
