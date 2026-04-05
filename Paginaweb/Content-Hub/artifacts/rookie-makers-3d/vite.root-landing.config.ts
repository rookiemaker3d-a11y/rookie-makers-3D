/**
 * Build de la web pública en la raíz del dominio (/, no /content-hub).
 * Salida: frontend/landing-dist (desde la raíz del monorepo rokie).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
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
    outDir: path.resolve(__dirname, "../../../../frontend/landing-dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: true,
  },
});
