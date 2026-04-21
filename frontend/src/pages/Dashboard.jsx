import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import {
  DollarSign,
  TrendingUp,
  Package,
  Calculator,
  FileText,
  Users,
  UserCog,
  Video,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const QUICK_LINKS = [
  { to: '/cotizacion/nueva', label: 'Nueva cotización', icon: Calculator },
  { to: '/productos', label: 'Productos autorizados', icon: Package },
  { to: '/cotizaciones-espera', label: 'Cotizaciones en espera', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/vendedores', label: 'Vendedores', icon: UserCog },
  { to: '/videos-promocionales', label: 'Videos promocionales', icon: Video },
]

const PORCENTAJE_INVERSION_KEY = 'porcentajeInversion'
const defaultPorcentajeInversion = () => {
  try {
    const v = Number(localStorage.getItem(PORCENTAJE_INVERSION_KEY))
    if (!Number.isNaN(v) && v >= 0 && v <= 100) return v
  } catch (_) {}
  return 10
}

export default function Dashboard() {
  const { api, user } = useAuth()
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [porcentajeInversion, setPorcentajeInversion] = useState(defaultPorcentajeInversion)

  const quickLinks = QUICK_LINKS.filter((link) => link.to !== '/vendedores' || user?.role === 'administrador')

  const savePorcentajeInversion = (pct) => {
    const n = Math.min(100, Math.max(0, Number(pct) || 0))
    setPorcentajeInversion(n)
    try { localStorage.setItem(PORCENTAJE_INVERSION_KEY, String(n)) } catch (_) {}
  }

  useEffect(() => {
    api('/dashboard/totals')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setTotals(data); else setErr('No se pudieron cargar los totales') })
      .catch(() => setErr('No se pudieron cargar los totales'))
      .finally(() => setLoading(false))
  }, [api])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="theme-text-muted flex items-center gap-2">
          <div className="w-5 h-5 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
          Cargando...
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400"
      >
        {err}
      </motion.div>
    )
  }

  const totalCosto = totals?.total_costo ?? 0
  const totalVenta = totals?.total_venta ?? 0
  const gananciaNeta = totals?.ganancia_neta ?? 0
  const cantidadProductos = totals?.cantidad_productos ?? 0
  const inversion = gananciaNeta * (porcentajeInversion / 100)
  const gananciaQueQueda = gananciaNeta - inversion

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-8"
    >
      <SectionHeader
        title="Dashboard"
        subtitle="Resumen de costos, ventas y ganancia de productos autorizados"
      />

      {/* KPIs con CountUp */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <Card hover className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium theme-text-muted">Total costo</span>
              <DollarSign className="w-5 h-5 theme-text-dim" />
            </div>
            <p className="text-2xl font-bold tabular-nums theme-text">
              $<CountUp end={totalCosto} decimals={2} duration={1} separator="," />
            </p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card hover className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium theme-text-muted">Total venta</span>
              <TrendingUp className="w-5 h-5 theme-text-dim" />
            </div>
            <p className="text-2xl font-bold tabular-nums theme-text">
              $<CountUp end={totalVenta} decimals={2} duration={1} separator="," />
            </p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card hover className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium theme-text-muted">Ganancia neta</span>
              <TrendingUp className="w-5 h-5 theme-text-dim" />
            </div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                gananciaNeta >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              $<CountUp end={gananciaNeta} decimals={2} duration={1} separator="," />
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Al término de la venta: inversión y ganancia que te queda */}
      <motion.div variants={item} className="rounded-xl border p-4 sm:p-5 theme-border theme-bg-card">
        <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wider mb-3">Al término de la venta</h3>
        <p className="text-sm theme-text-muted mb-4">Cuánto va a inversión y cuánto te queda de ganancia. Por defecto 10% a inversión; puedes subir el porcentaje aquí.</p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span className="text-sm theme-text-muted">% para inversión</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={porcentajeInversion}
              onChange={(e) => savePorcentajeInversion(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border theme-input text-sm"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white/[0.04] border theme-border">
            <span className="theme-text-muted block text-xs">Inversión ({porcentajeInversion}%)</span>
            <span className="theme-text font-semibold tabular-nums">${inversion.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.04] border theme-border">
            <span className="theme-text-muted block text-xs">Ganancia que te queda</span>
            <span className={`font-semibold tabular-nums ${gananciaQueQueda >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${gananciaQueQueda.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.04] border theme-border">
            <span className="theme-text-muted block text-xs">Ganancia neta (total)</span>
            <span className={`font-semibold tabular-nums ${gananciaNeta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${gananciaNeta.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>

      <motion.p variants={item} className="text-sm theme-text-muted">
        Productos autorizados: <span className="theme-text-secondary font-medium">{cantidadProductos}</span>
      </motion.p>

      <motion.section variants={item} className="space-y-3">
        <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wider">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ to, label, icon: Icon }, i) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 theme-border theme-bg-card hover:bg-[var(--theme-bg-card-hover)] hover:border-[var(--theme-border-hover)] hover:shadow-[var(--theme-shadow-accent)]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 theme-bg-card theme-border border">
                <Icon className="w-5 h-5 theme-text-muted" />
              </div>
              <span className="font-medium theme-text">{label}</span>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
