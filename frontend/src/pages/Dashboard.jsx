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

export default function Dashboard() {
  const { api } = useAuth()
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/dashboard/totals')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setTotals)
      .catch(() => setErr('No se pudieron cargar los totales'))
      .finally(() => setLoading(false))
  }, [api])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="theme-text-muted flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
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

      <motion.p variants={item} className="text-sm theme-text-muted">
        Productos autorizados: <span className="theme-text-secondary font-medium">{cantidadProductos}</span>
      </motion.p>

      <motion.section variants={item} className="space-y-3">
        <h3 className="text-sm font-semibold theme-text-muted uppercase tracking-wider">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, label, icon: Icon }, i) => (
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
