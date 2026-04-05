/** API pública misma origen (nginx/Vercel → /api) o override en dev. */
export function landingApiUrl(path: string): string {
  const base = import.meta.env.VITE_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return path.startsWith("/") ? path : `/${path}`;
}
