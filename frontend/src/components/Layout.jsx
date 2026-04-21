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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator, section: 'General' },
  { to: '/productos', label: 'Productos', icon: Package, section: 'General' },
  { to: '/inventario', label: 'Inventario', icon: Boxes, section: 'General' },
  { to: '/cotizaciones-espera', label: 'Cotizaciones espera', icon: FileText, section: 'General' },
  { to: '/clientes', label: 'Clientes', icon: Users, section: 'General' },
  { to: '/analisis', label: 'Análisis', icon: BarChart3, section: 'General' },
  { to: '/configuracion', label: 'Configuración', icon: Settings, section: 'General' },
  { to: '/vendedores', label: 'Diseñadores', icon: UserCog, adminOnly: true, section: 'Admin' },
  { to: '/perfiles', label: 'Perfiles y suscripción', icon: Shield, adminOnly: true, section: 'Admin' },
  { to: '/alertas', label: 'Alarmas / Alertas', icon: Bell, adminOnly: true, section: 'Admin' },
  { to: '/videos-promocionales', label: 'Videos promocionales', icon: Video, section: 'Contenido' },
  { to: '/pagina-publica', label: 'Página pública (costos)', icon: FileEdit, adminOnly: true, section: 'Contenido' },
  { to: '/editor-web', label: 'Editor web (archivos)', icon: FileEdit, adminOnly: true, section: 'Contenido' },
  { to: '/seguridad', label: 'Seguridad', icon: Shield, section: 'Cuenta' },
  { href: '/', label: 'Web pública', icon: Globe, external: true, section: 'Cuenta' },
]

const NAV_VENDEDOR_VENTAS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
  { to: '/productos', label: 'Productos', icon: Package, section: 'General' },
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator, section: 'General' },
  { to: '/cotizaciones-espera', label: 'Cotizaciones espera', icon: FileText, section: 'General' },
  { to: '/analisis', label: 'Análisis', icon: BarChart3, section: 'General' },
  { to: '/configuracion', label: 'Configuración', icon: Settings, section: 'Cuenta' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoError, setLogoError] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOverlay, setMobileOverlay] = useState(false)

  const navItems = useMemo(() => {
    const base = user?.role === 'vendedor_ventas'
      ? NAV_VENDEDOR_VENTAS
      : NAV.filter((item) => !item.adminOnly || user?.role === 'administrador')
    return base
  }, [user?.role])

  const sections = useMemo(() => {
    const groups = {}
    for (const item of navItems) {
      const sec = item.section || 'General'
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(item)
    }
    return groups
  }, [navItems])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('layout_sidebar_open_v1')
      if (raw === '0') setSidebarOpen(false)
      if (raw === '1') setSidebarOpen(true)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('layout_sidebar_open_v1', sidebarOpen ? '1' : '0')
    } catch (_) {}
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOverlay((v) => !v)
    } else {
      setSidebarOpen((v) => !v)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b transition-colors duration-300"
      style={{
        backgroundImage: 'linear-gradient(to bottom, var(--theme-bg-page), var(--theme-bg-page-via), var(--theme-bg-page))',
      }}
    >
      {/* Mobile overlay */}
      {mobileOverlay && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOverlay(false)}
        />
      )}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-header)' }}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
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
              <span className="hidden sm:inline">Inicio</span>
            </Link>
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
              <span className="hidden sm:inline">{user?.nombre ?? user?.email}</span>
            </span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--theme-text-dim)' }}>({user?.role})</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-4">
          {/* Desktop sidebar */}
          <aside className={`hidden md:block shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
            <div className="rounded-2xl border backdrop-blur-sm p-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-nav)' }}>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const { to, href, label, icon: Icon, external } = item
                  const isActive = to != null && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)))
                  const baseClass = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 w-full group relative'
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

          {/* Mobile sidebar */}
          {mobileOverlay && (
            <aside className="fixed inset-y-0 left-0 z-50 w-72 md:hidden" style={{ background: 'var(--theme-bg-nav)' }}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="font-semibold theme-text">Menú</span>
                  <button type="button" onClick={() => setMobileOverlay(false)} className="p-2 rounded-lg hover:bg-white/10 theme-text">
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                  {Object.entries(sections).map(([section, items]) => (
                    <div key={section} className="mb-3">
                      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider theme-text-dim">{section}</p>
                      <ul className="space-y-1">
                        {items.map((item) => {
                          const { to, href, label, icon: Icon, external } = item
                          const isActive = to != null && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)))
                          if (external && href) {
                            return (
                              <li key={href}>
                                <a href={href} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium theme-text-muted">
                                  <Icon className="w-4 h-4 shrink-0" />
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
                              <Link
                                to={to}
                                onClick={() => setMobileOverlay(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                                style={isActive ? { background: 'var(--theme-bg-card-hover)', color: 'var(--theme-text)' } : { color: 'var(--theme-text-muted)' }}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
                <div className="p-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="flex items-center gap-2 text-sm theme-text-muted">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    {user?.email}
                  </div>
                  <span className="text-xs theme-text-dim">{user?.role}</span>
                </div>
              </div>
            </aside>
          )}

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}