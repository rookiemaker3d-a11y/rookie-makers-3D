import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const landingIndex = path.join(root, 'landing-dist', 'index.html')
const erpIndex = path.join(root, 'dist', 'index.html')
const mergedLanding = path.join(root, 'deploy-dist', 'index.html')
const mergedErp = path.join(root, 'deploy-dist', 'app', 'index.html')

for (const [p, label] of [
  [landingIndex, 'landing-dist/index.html'],
  [erpIndex, 'dist/index.html (ERP)'],
  [mergedLanding, 'deploy-dist/index.html'],
  [mergedErp, 'deploy-dist/app/index.html'],
]) {
  if (!fs.existsSync(p)) {
    console.error(`Falta ${label}`)
    process.exit(1)
  }
}
