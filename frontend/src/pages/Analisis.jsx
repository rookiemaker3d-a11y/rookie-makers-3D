import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { TrendingUp, Package, DollarSign } from 'lucide-react'

const COLORS = ['#4f8ef7', '#22c55e', '#eab308', '#f97316', '#ec4899']

export default function Analisis() {
  const { api, user } = useAuth()
  const [totals, setTotals] = useState(null)
  const [productos, setProductos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')

  const isAdmin = user?.role === 'administrador'

  useEffect(() => {
    Promise.all([
      api('/dashboard/totals').then((r) => r.ok ? r.json() : {}),
      api(isAdmin ? '/productos' : '/productos?for_analysis=1').then((r) => r.json()),
      api('/cotizaciones-en-espera').then((r) => r.json()),
    ])
      .then(([t, p, c]) => {
        setTotals(t || {})
        setProductos(p || [])
        setCotizaciones(c || [])
      })
      .finally(() => setLoading(false))
  }, [api])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalVenta = totals?.total_venta ?? 0
  const totalCosto = totals?.total_costo ?? 0
  const ganancia = totals?.ganancia_neta ?? 0
  const cantidad = totals?.cantidad_productos ?? 0
  const ticketPromedio = cantidad > 0 ? totalVenta / cantidad : 0
  const margenPromedio = totalVenta > 0 ? (ganancia / totalVenta) * 100 : 0

  const ingresosPorMes = (() => {
    const byMonth = {}
    productos.forEach((p) => {
      const created = p.created_at?.slice(0, 7)
      if (created) {
        byMonth[created] = (byMonth[created] || 0) + (p.costo_final || 0)
      }
    })
    return Object.entries(byMonth)
      .map(([mes, valor]) => ({ mes, ingresos: valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)
  })()

  const enEspera = cotizaciones.filter((c) => (c.detalles?.estado || 'espera') === 'espera')
  const aprobadas = cotizaciones.filter((c) => (c.detalles?.estado || '') === 'aprobado').length
  const conversion = cotizaciones.length > 0 ? (aprobadas / cotizaciones.length) * 100 : 0
  const montoEspera = enEspera.reduce((s, c) => s + (c.costo_final || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <SectionHeader
        title="Análisis y reportes"
        subtitle={isAdmin ? 'Resumen ejecutivo y gráficas (todos los datos)' : 'Tus ventas y estadísticas personales'}
      />

      <div className="flex flex-wrap gap-2">
        {['mes', 'semana', '3meses'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`px-3 py-1.5 rounded-lg text-sm ${periodo === p ? 'bg-white/[0.1] theme-text' : 'bg-white/[0.04] theme-text-muted'}`}
          >
            {p === 'mes' ? 'Este mes' : p === 'semana' ? 'Esta semana' : 'Últimos 3 meses'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="theme-text-muted text-sm">Ingresos totales</span>
            <DollarSign className="w-4 h-4 theme-text-dim" />
          </div>
          <p className="text-xl font-bold theme-text tabular-nums">
            $<CountUp end={totalVenta} decimals={0} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="theme-text-muted text-sm">Pedidos completados</span>
            <Package className="w-4 h-4 theme-text-dim" />
          </div>
          <p className="text-xl font-bold theme-text tabular-nums">
            <CountUp end={cantidad} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="theme-text-muted text-sm">Ticket promedio</span>
          </div>
          <p className="text-xl font-bold theme-text tabular-nums">
            $<CountUp end={ticketPromedio} decimals={0} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="theme-text-muted text-sm">Margen bruto %</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-500 tabular-nums">
            <CountUp end={margenPromedio} decimals={1} duration={1} />%
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold theme-text mb-4">Ingresos por periodo</h3>
        <div className="h-64">
          {ingresosPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ingresosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                <XAxis dataKey="mes" stroke="var(--theme-text-dim)" fontSize={11} />
                <YAxis stroke="var(--theme-text-dim)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} formatter={(v) => [`$${Number(v).toFixed(0)}`, 'Ingresos']} />
                <Line type="monotone" dataKey="ingresos" stroke="#4f8ef7" strokeWidth={2} dot={{ fill: '#4f8ef7' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="theme-text-dim text-sm flex items-center justify-center h-full">Sin datos de ingresos aún</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold theme-text mb-4">Cotizaciones</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="theme-text-muted">En espera</span>
              <span className="theme-text tabular-nums">{enEspera.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-muted">Monto en espera</span>
              <span className="theme-text tabular-nums">${montoEspera.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-muted">Tasa conversión (aprobadas)</span>
              <span className="text-emerald-500 tabular-nums">{conversion.toFixed(0)}%</span>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold theme-text mb-4">Resumen de costos</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="theme-text-muted">Total costo</span>
              <span className="theme-text tabular-nums">${totalCosto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-muted">Ganancia neta</span>
              <span className={`${ganancia >= 0 ? 'text-emerald-500' : 'text-red-500'} tabular-nums`}>${ganancia.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
