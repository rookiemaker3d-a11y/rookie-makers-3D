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
  const { api } = useAuth()
  const [totals, setTotals] = useState(null)
  const [productos, setProductos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => {
    Promise.all([
      api('/dashboard/totals').then((r) => r.ok ? r.json() : {}),
      api('/productos').then((r) => r.json()),
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
        <div className="w-6 h-6 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
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
        subtitle="Resumen ejecutivo y gráficas"
      />

      <div className="flex flex-wrap gap-2">
        {['mes', 'semana', '3meses'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`px-3 py-1.5 rounded-lg text-sm ${periodo === p ? 'bg-white/[0.1] text-white' : 'bg-white/[0.04] text-slate-400'}`}
          >
            {p === 'mes' ? 'Este mes' : p === 'semana' ? 'Esta semana' : 'Últimos 3 meses'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-sm">Ingresos totales</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold text-white tabular-nums">
            $<CountUp end={totalVenta} decimals={0} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-sm">Pedidos completados</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold text-white tabular-nums">
            <CountUp end={cantidad} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-sm">Ticket promedio</span>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">
            $<CountUp end={ticketPromedio} decimals={0} duration={1} />
          </p>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-sm">Margen bruto %</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">
            <CountUp end={margenPromedio} decimals={1} duration={1} />%
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Ingresos por periodo</h3>
        <div className="h-64">
          {ingresosPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ingresosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} formatter={(v) => [`$${Number(v).toFixed(0)}`, 'Ingresos']} />
                <Line type="monotone" dataKey="ingresos" stroke="#4f8ef7" strokeWidth={2} dot={{ fill: '#4f8ef7' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm flex items-center justify-center h-full">Sin datos de ingresos aún</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Cotizaciones</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">En espera</span>
              <span className="text-white tabular-nums">{enEspera.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monto en espera</span>
              <span className="text-white tabular-nums">${montoEspera.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tasa conversión (aprobadas)</span>
              <span className="text-emerald-400 tabular-nums">{conversion.toFixed(0)}%</span>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Resumen de costos</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total costo</span>
              <span className="text-white tabular-nums">${totalCosto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ganancia neta</span>
              <span className={`${ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'} tabular-nums`}>${ganancia.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
