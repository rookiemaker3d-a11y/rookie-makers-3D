/**
 * Build estático para incrustar en frontend/public/content-hub (sin PORT/BASE_PATH de Replit).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/content-hub/",
  // Evita subir al postcss.config.mjs del monorepo rokie (pide autoprefixer fuera de Content-Hub).
  css: {
    postcss: { plugins: [] },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, "../../../frontend/public/content-hub"),
    emptyOutDir: true,
  },
});
