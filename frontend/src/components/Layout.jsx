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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/cotizaciones-espera', label: 'Cotizaciones espera', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/vendedores', label: 'Vendedores', icon: UserCog },
  { to: '/videos-promocionales', label: 'Videos promocionales', icon: Video },
  { to: '/analisis', label: 'Análisis', icon: BarChart3 },
  { to: '/proyectos', label: 'Proyectos / Redes', icon: Globe },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight transition-colors hover:opacity-90"
            style={{ color: 'var(--theme-text)' }}
          >
            Rookie Makers 3D
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
              {user?.email}
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
        <div className="max-w-7xl mx-auto px-4 py-2">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? 'shadow-[0_2px_12px_rgba(var(--theme-accent),0.15)]' : ''
                    }`}
                    style={
                      isActive
                        ? { background: 'var(--theme-bg-card-hover)', color: 'var(--theme-text)', border: '1px solid var(--theme-border-hover)' }
                        : { color: 'var(--theme-text-muted)' }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--theme-bg-card)'
                        e.currentTarget.style.color = 'var(--theme-text)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = ''
                        e.currentTarget.style.color = 'var(--theme-text-muted)'
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
