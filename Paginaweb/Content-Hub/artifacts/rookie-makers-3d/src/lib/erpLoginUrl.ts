/**
 * Enlace al login del ERP (React en `frontend`).
 * - Producción: misma web, ruta /app/login
 * - Desarrollo: mismo host que la web pública (localhost o IP de red) y puerto 5173
 * - Override: VITE_ERP_LOGIN_URL en .env del artifact
 */
export function erpLoginUrl(): string {
  const fromEnv = import.meta.env.VITE_ERP_LOGIN_URL?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5173/login`;
  }
  if (import.meta.env.DEV) return "http://localhost:5173/login";
  return "/app/login";
}
