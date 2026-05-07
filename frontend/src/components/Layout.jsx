import { useEffect, useMemo, useState } from 'react'
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
  Menu,
  X as CloseIcon,
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
  { to: '/perfiles', label: 'Perfiles y suscripción', icon: Shield, adminOnly: true },
  { to: '/alertas', label: 'Alarmas / Alertas', icon: Bell, adminOnly: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
  { to: '/seguridad', label: 'Seguridad', icon: Shield },
  { to: '/videos-promocionales', label: 'Videos promocionales', icon: Video },
  { to: '/pagina-publica', label: 'Página pública (costos)', icon: FileEdit, adminOnly: true },
  { to: '/editor-web', label: 'Editor web (archivos)', icon: FileEdit, adminOnly: true },
  { to: '/editor-galeria', label: 'Editor galería web', icon: FileEdit, adminOnly: true },
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
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = useMemo(() => {
    const base = user?.role === 'vendedor_ventas'
      ? NAV_VENDEDOR_VENTAS
      : NAV.filter((item) => !item.adminOnly || user?.role === 'administrador')
    return base
  }, [user?.role])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('layout_sidebar_open_v1')
      if (raw === '0') setSidebarOpen(false)
      if (raw === '1') setSidebarOpen(true)
    } catch (_) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('layout_sidebar_open_v1', sidebarOpen ? '1' : '0')
    } catch (_) {
      // ignore
    }
  }, [sidebarOpen])

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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:opacity-90"
              style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-bg-card)' }}
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {sidebarOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <Link to="/" className="flex items-center gap-2 theme-text" title="Rookie Makers 3D">
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
          </div>
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
              Inicio
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

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-4">
          <aside className={`shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
            <div className="rounded-2xl border backdrop-blur-sm p-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-nav)' }}>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const { to, href, label, icon: Icon, external } = item
                  const isActive = to != null && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)))
                  const baseClass = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 w-full group'
                  const style = isActive
                    ? { background: 'var(--theme-bg-card-hover)', color: 'var(--theme-text)', border: '1px solid var(--theme-border-hover)' }
                    : { color: 'var(--theme-text-muted)' }
                  if (external && href) {
                    return (
                      <li key={href}>
                        <a href={href} className={baseClass} style={style}>
                          <Icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                          {label}
                        </a>
                      </li>
                    )
                  }
                  return (
                    <li key={to} className="relative">
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r bg-cyan-500" />
                      )}
                      <Link to={to} className={baseClass} style={style}>
                        <Icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
