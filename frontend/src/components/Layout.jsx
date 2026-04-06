import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calculator,
  Package,
  FileText,
  Users,
  UserCog,
  Video,
  Globe,
  LogOut,
  BarChart3,
  RefreshCw,
  Sun,
  Moon,
  Boxes,
  Shield,
  Bell,
  Settings,
  FileEdit,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { publicPath } from '../utils/publicPath'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/cotizaciones-espera', label: 'Cotizaciones espera', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/vendedores', label: 'Diseñadores', icon: UserCog, adminOnly: true },
  { to: '/perfiles', label: 'Perfiles (bloquear)', icon: Shield, adminOnly: true },
  { to: '/alertas', label: 'Alarmas / Alertas', icon: Bell, adminOnly: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
  { to: '/seguridad', label: 'Seguridad', icon: Shield },
  { to: '/videos-promocionales', label: 'Videos promocionales', icon: Video },
  { to: '/pagina-publica', label: 'Página pública (costos)', icon: FileEdit, adminOnly: true },
  { to: '/editor-web', label: 'Editor web (archivos)', icon: FileEdit, adminOnly: true },
  { to: '/analisis', label: 'Análisis', icon: BarChart3 },
  { href: '/', label: 'Web pública', icon: Globe, external: true },
]

/** Menú reducido para rol vendedor_ventas: solo Dashboard, Productos, Nueva cotización, Cotizaciones espera, Análisis (solo sus datos). */
const NAV_VENDEDOR_VENTAS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator },
  { to: '/cotizaciones-espera', label: 'Cotizaciones espera', icon: FileText },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
  { to: '/analisis', label: 'Análisis', icon: BarChart3 },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoError, setLogoError] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b transition-colors duration-300"
      style={{
        backgroundImage: 'linear-gradient(to bottom, var(--theme-bg-page), var(--theme-bg-page-via), var(--theme-bg-page))',
      }}
    >
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-header)' }}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0 theme-text" title="Rookie Makers 3D">
            {logoError ? (
              <span className="theme-text font-semibold text-lg">Rookie Makers 3D</span>
            ) : (
              <img
                src={publicPath('logos/logo-cotizacion.png')}
                alt="Rookie Makers 3D"
                className="h-8 w-auto object-contain max-w-[180px]"
                onError={() => setLogoError(true)}
              />
            )}
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:opacity-90"
              style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-bg-card)' }}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              title="Volver al inicio"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar
            </Link>
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
              {user?.nombre ?? user?.email}
            </span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--theme-text-dim)' }}>({user?.role})</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <nav
        className="border-b backdrop-blur-sm transition-colors duration-300"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-nav)' }}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-2">
          <ul className="flex flex-wrap items-center gap-1">
            {(user?.role === 'vendedor_ventas' ? NAV_VENDEDOR_VENTAS : NAV.filter((item) => !item.adminOnly || user?.role === 'administrador')).map((item) => {
              const { to, href, label, icon: Icon, external } = item
              const isActive =
                to != null &&
                (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)))
              const linkClass = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? 'shadow-[0_2px_12px_rgba(var(--theme-accent),0.15)]' : ''
              }`
              const linkStyle = isActive
                ? { background: 'var(--theme-bg-card-hover)', color: 'var(--theme-text)', border: '1px solid var(--theme-border-hover)' }
                : { color: 'var(--theme-text-muted)' }
              const hoverProps = {
                onMouseEnter: (e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--theme-bg-card)'
                    e.currentTarget.style.color = 'var(--theme-text)'
                  }
                },
                onMouseLeave: (e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = ''
                    e.currentTarget.style.color = 'var(--theme-text-muted)'
                  }
                },
              }
              if (external && href) {
                return (
                  <li key={href}>
                    <a
                      href={href}
                      className={linkClass}
                      style={linkStyle}
                      {...hoverProps}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </a>
                  </li>
                )
              }
              return (
                <li key={to}>
                  <Link to={to} className={linkClass} style={linkStyle} {...hoverProps}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
