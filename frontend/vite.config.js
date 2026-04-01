import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'proyectos-to-content-hub',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const u = req.url?.split('?')[0] ?? ''
          if (u === '/proyectos' || u === '/proyectos/') {
            res.statusCode = 302
            res.setHeader('Location', '/content-hub/index.html')
            res.end()
            return
          }
          next()
        })
      },
    },
    {
      name: 'content-hub-index',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const u = req.url?.split('?')[0] ?? ''
          if (u === '/content-hub' || u === '/content-hub/') req.url = '/content-hub/index.html'
          next()
        })
      },
    },
  ],
  build: {
    // Evitar warning en Vercel: chunk > 2000 kB (el bundle con recharts es grande)
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts/')) return 'vendor-recharts'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) return 'vendor-react'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8001', changeOrigin: true } },
  },
})
