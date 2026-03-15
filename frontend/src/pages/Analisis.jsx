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
import { TrendingUp, Package, DollarSign, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { COTIZADOR_DEFAULTS, EXTRAS_CONFIG } from '../config/cotizador'

const COLORS = ['#4f8ef7', '#22c55e', '#eab308', '#f97316', '#ec4899']

const DEFAULT_FORMULA_VARS = {
  materialGramos: 200,
  materialCostoKg: 500,
  maquinaHoras: 2.5,
  maquinaCostoHora: COTIZADOR_DEFAULTS.costoHoraMaquina,
  disenoHoras: 3,
  disenoTarifa: COTIZADOR_DEFAULTS.tarifaDisenoHora,
  correccionSTL: COTIZADOR_DEFAULTS.costoCorreccionSTL,
  ingReversaHoras: 1.5,
  ingReversaTarifa: COTIZADOR_DEFAULTS.tarifaIngenieriaReversaHora,
  extraLijado: EXTRAS_CONFIG[0]?.defaultCosto ?? 80,
  extraPintura: EXTRAS_CONFIG[1]?.defaultCosto ?? 120,
  extraInsertos: EXTRAS_CONFIG[2]?.defaultCosto ?? 15,
  costoTotalEjemplo: 500,
  margenPorcentaje: COTIZADOR_DEFAULTS.margenDefault,
  anticipoPorcentaje: COTIZADOR_DEFAULTS.anticipoPorcentaje,
}

export default function Analisis() {
  const { api, user } = useAuth()
  const [totals, setTotals] = useState(null)
  const [productos, setProductos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [showFormulas, setShowFormulas] = useState(false)
  const [formulaVars, setFormulaVars] = useState(DEFAULT_FORMULA_VARS)

  const isAdmin = user?.role === 'administrador'

  const updateFormulaVar = (key, value) => {
    const num = value === '' || value === undefined ? null : Number(value)
    setFormulaVars((v) => ({ ...v, [key]: Number.isNaN(num) ? value : num }))
  }

  const materialResult = (formulaVars.materialGramos / 1000) * (Number(formulaVars.materialCostoKg) || 0)
  const maquinaResult = (Number(formulaVars.maquinaHoras) || 0) * (Number(formulaVars.maquinaCostoHora) || 0)
  const disenoResult = (Number(formulaVars.disenoHoras) || 0) * (Number(formulaVars.disenoTarifa) || 0)
  const ingReversaResult = (Number(formulaVars.ingReversaHoras) || 0) * (Number(formulaVars.ingReversaTarifa) || 0)
  const precioClienteResult = (Number(formulaVars.costoTotalEjemplo) || 0) * (1 + (Number(formulaVars.margenPorcentaje) || 0) / 100)
  const anticipoResult = precioClienteResult * ((Number(formulaVars.anticipoPorcentaje) || 0) / 100)

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

      <Card>
        <button
          type="button"
          onClick={() => setShowFormulas((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left p-4 rounded-lg hover:bg-white/[0.05] transition"
        >
          <span className="flex items-center gap-3 theme-text font-semibold text-base">
            <Calculator className="w-5 h-5 text-cyan-500" />
            Costos — Ver fórmulas (orden de cotización)
          </span>
          {showFormulas ? <ChevronUp className="w-5 h-5 theme-text-muted" /> : <ChevronDown className="w-5 h-5 theme-text-muted" />}
        </button>
        {showFormulas && (
          <div className="mt-5 pt-5 border-t space-y-6" style={{ borderColor: 'var(--theme-border)' }}>
            <div>
              <h3 className="text-lg font-semibold theme-text mb-1">Apartado de costos</h3>
              <p className="text-base theme-text-muted">
                Cada línea de la cotización se calcula así. Modifica los valores para ver el resultado. Los costos por kg se editan en Inventario → Costos de filamentos.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Costo material */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Costo material</div>
                <div className="theme-text-muted font-mono text-sm">(gramos ÷ 1000) × costo_por_kg</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={1} value={formulaVars.materialGramos} onChange={(e) => updateFormulaVar('materialGramos', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">g ×</span>
                  <input type="number" min={0} step={10} value={formulaVars.materialCostoKg} onChange={(e) => updateFormulaVar('materialCostoKg', e.target.value)} className="w-28 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">$/kg =</span>
                  <span className="font-mono font-semibold theme-text text-lg">${materialResult.toFixed(0)}</span>
                </div>
              </div>
              {/* Costo tiempo máquina */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Costo tiempo máquina</div>
                <div className="theme-text-muted font-mono text-sm">horas × costo_hora_máquina</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={0.5} value={formulaVars.maquinaHoras} onChange={(e) => updateFormulaVar('maquinaHoras', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">hr ×</span>
                  <input type="number" min={0} step={1} value={formulaVars.maquinaCostoHora} onChange={(e) => updateFormulaVar('maquinaCostoHora', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">$/hr =</span>
                  <span className="font-mono font-semibold theme-text text-lg">${maquinaResult.toFixed(0)}</span>
                </div>
              </div>
              {/* Diseño desde cero */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Diseño desde cero</div>
                <div className="theme-text-muted font-mono text-sm">horas_diseño × tarifa_diseño</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={0.5} value={formulaVars.disenoHoras} onChange={(e) => updateFormulaVar('disenoHoras', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">hr ×</span>
                  <input type="number" min={0} step={10} value={formulaVars.disenoTarifa} onChange={(e) => updateFormulaVar('disenoTarifa', e.target.value)} className="w-28 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">=</span>
                  <span className="font-mono font-semibold theme-text text-lg">${disenoResult.toFixed(0)}</span>
                </div>
              </div>
              {/* Corrección STL */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Corrección STL</div>
                <div className="theme-text-muted font-mono text-sm">Costo fijo (una vez por pedido)</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={10} value={formulaVars.correccionSTL} onChange={(e) => updateFormulaVar('correccionSTL', e.target.value)} className="w-28 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">MXN</span>
                </div>
              </div>
              {/* Ingeniería reversa */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Ingeniería reversa</div>
                <div className="theme-text-muted font-mono text-sm">horas × tarifa_ingeniería</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={0.5} value={formulaVars.ingReversaHoras} onChange={(e) => updateFormulaVar('ingReversaHoras', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">hr ×</span>
                  <input type="number" min={0} step={10} value={formulaVars.ingReversaTarifa} onChange={(e) => updateFormulaVar('ingReversaTarifa', e.target.value)} className="w-28 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">=</span>
                  <span className="font-mono font-semibold theme-text text-lg">${ingReversaResult.toFixed(0)}</span>
                </div>
              </div>
              {/* Extras */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Extras (ejemplo)</div>
                <div className="theme-text-muted font-mono text-sm">valor fijo o cantidad × valor</div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="theme-text-muted">Lijado $</span>
                  <input type="number" min={0} value={formulaVars.extraLijado} onChange={(e) => updateFormulaVar('extraLijado', e.target.value)} className="w-20 px-2 py-1.5 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted">Pintura $</span>
                  <input type="number" min={0} value={formulaVars.extraPintura} onChange={(e) => updateFormulaVar('extraPintura', e.target.value)} className="w-20 px-2 py-1.5 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted">Insertos $</span>
                  <input type="number" min={0} value={formulaVars.extraInsertos} onChange={(e) => updateFormulaVar('extraInsertos', e.target.value)} className="w-20 px-2 py-1.5 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                </div>
              </div>
              {/* Costo total (orden) */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Costo total (orden)</div>
                <div className="theme-text-muted font-mono text-sm">Material + Tiempo + Diseño + Extras</div>
                <p className="text-sm theme-text-muted">Suma de todos los conceptos anteriores.</p>
              </div>
              {/* Precio al cliente */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Precio al cliente</div>
                <div className="theme-text-muted font-mono text-sm">Costo total × (1 + margen%)</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" min={0} step={50} value={formulaVars.costoTotalEjemplo} onChange={(e) => updateFormulaVar('costoTotalEjemplo', e.target.value)} className="w-28 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">× (1 +</span>
                  <input type="number" min={0} max={200} step={5} value={formulaVars.margenPorcentaje} onChange={(e) => updateFormulaVar('margenPorcentaje', e.target.value)} className="w-20 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">%) =</span>
                  <span className="font-mono font-semibold theme-text text-xl">${precioClienteResult.toFixed(0)}</span>
                </div>
              </div>
              {/* Anticipo */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
                <div className="font-semibold theme-text text-base">Anticipo</div>
                <div className="theme-text-muted font-mono text-sm">Precio cliente × (anticipo% ÷ 100)</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="theme-text-muted text-sm">${precioClienteResult.toFixed(0)} ×</span>
                  <input type="number" min={0} max={100} step={5} value={formulaVars.anticipoPorcentaje} onChange={(e) => updateFormulaVar('anticipoPorcentaje', e.target.value)} className="w-20 px-3 py-2 rounded-lg border text-base bg-white/5 border-white/20 theme-text" />
                  <span className="theme-text-muted text-sm">% =</span>
                  <span className="font-mono font-semibold theme-text text-lg">${anticipoResult.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
