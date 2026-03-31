// Polyfill Buffer for @react-pdf/renderer in browser (evita "Buffer is not defined" al generar PDF)
import { Buffer } from 'buffer'
if (typeof globalThis !== 'undefined') globalThis.Buffer = Buffer
if (typeof window !== 'undefined') window.Buffer = Buffer

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </StrictMode>,
)
