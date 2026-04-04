/** Prefijo del ERP en producción (/app/); en dev es '/'. */
export function publicPath(pathname) {
  const b = import.meta.env.BASE_URL || '/'
  const clean = String(pathname || '').replace(/^\//, '')
  return `${b}${clean}`
}
