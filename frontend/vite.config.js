import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En producción el ERP vive bajo /app/; la web pública va en / (landing-dist).
  base: command === 'build' ? '/app/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts/')) return 'vendor-recharts'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router') || id.includes('node_modules/framer-motion/')) return 'vendor-react'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8001', changeOrigin: true } },
  },
}))
