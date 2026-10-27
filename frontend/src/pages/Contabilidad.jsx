import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { DollarSign, TrendingUp, Package, Wrench, Printer } from 'lucide-react'
import { cifrasMovimiento } from '../utils/estadoResultados'

const todayISO = () => new Date().toISOString().split('T')[0]
const firstDayOfMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function origenVenta(v) {
  const n = `${v.notas || ''} ${(v.productos || []).map((p) => p.descripcion || '').join(' ')}`.toLowerCase()
  if (n.includes('servicio') || n.includes('reparación') || n.includes('reparacion')) return 'servicio'
  if (n.includes('autorizado desde cotización') || n.includes('autorizado desde cotizacion')) return 'impresion'
  return 'otro'
}

function margenPct(total, ganancia) {
  const t = Number(total) || 0
  if (t <= 0) return 0
  return (Number(ganancia) || 0) / t * 100
}

export default function Contabilidad() {
  const { api } = useAuth()
  const [ventas, setVentas] = useState([])
  const [servicios, setServicios] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState(firstDayOfMonth())
  const [hasta, setHasta] = useState(todayISO())

  function load() {
    setLoading(true)
    const qs = new URLSearchParams()
    if (desde) qs.append('desde', desde)
    if (hasta) qs.append('hasta', hasta)
    Promise.all([
      api(`/ventas?${qs}`).then((r) => (r.ok ? r.json() : [])),
      api('/servicios/cotizaciones').then((r) => (r.ok ? r.json() : [])),
      api('/productos').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([v, s, p]) => {
        setVentas(v || [])
        setServicios((s || []).filter((x) => {
          const e = (x.estado || '').toLowerCase()
          return e === 'terminado' || e === 'finalizada' || e === 'finalizado'
        }))
        setProductos(p || [])
      })
      .catch(() => {
        setVentas([])
        setServicios([])
        setProductos([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api, desde, hasta])

  const movimientos = useMemo(
    () => ventas.map((v) => ({ v, ...cifrasMovimiento(v, productos) })),
    [ventas, productos],
  )

  const totals = useMemo(() => {
    const ingreso = movimientos.reduce((s, m) => s + m.ingreso, 0)
    const ganancia = movimientos.reduce((s, m) => s + m.ganancia, 0)
    const costo = movimientos.reduce((s, m) => s + m.costo, 0)
    const pct = margenPct(ingreso, ganancia)
    const porOrigen = { servicio: { ingreso: 0, ganancia: 0, n: 0 }, impresion: { ingreso: 0, ganancia: 0, n: 0 }, otro: { ingreso: 0, ganancia: 0, n: 0 } }
    for (const m of movimientos) {
      const o = origenVenta(m.v)
      porOrigen[o].ingreso += m.ingreso
      porOrigen[o].ganancia += m.ganancia
      porOrigen[o].n += 1
    }
    const prodBase = productos.reduce((s, p) => s + (Number(p.costo_base) || 0), 0)
    const prodFinal = productos.reduce((s, p) => s + (Number(p.costo_final) || 0), 0)
    return {
      ingreso,
      ganancia,
      costo,
      pct,
      porOrigen,
      prodBase,
      prodFinal,
      margenProd: prodFinal - prodBase,
    }
  }, [movimientos, productos])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contabilidad"
        subtitle="Conectada al ERP: al autorizar una cotización de impresión o al terminar un servicio/reparación, el dinero entra aquí con costo, ingreso y ganancia."
      />

      <div className="rounded-xl border border-white/10 px-4 py-3">
        <div className={`text-lg font-bold ${totals.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Ganancia ${totals.ganancia.toFixed(2)}
        </div>
        <p className="text-sm theme-text-muted">
          En el periodo: margen {totals.pct.toFixed(1)}% sobre ingresos ${totals.ingreso.toFixed(2)}.
          El costo suma material, tiempo de máquina y mano de obra. Entra desde que se autoriza y sigue contando hasta la entrega.
          Por cobrar ${movimientos.filter((m) => m.v.pago === 'adeudado').reduce((s, m) => s + m.ingreso, 0).toFixed(2)}.
          Cobrado ${movimientos.filter((m) => m.v.pago === 'pagado').reduce((s, m) => s + m.ingreso, 0).toFixed(2)}.
          {totals.ingreso <= 0 ? ' Aún no hay ventas cerradas en este rango.' : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="theme-text-muted">Desde</span>
          <input
            type="date"
            className="block mt-1 rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="theme-text-muted">Hasta</span>
          <input
            type="date"
            className="block mt-1 rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        <Link to="/ventas" className="text-sm text-cyan-400 underline">Ventas</Link>
        <Link to="/servicios" className="text-sm text-cyan-400 underline">Servicio / reparación</Link>
        <Link to="/cotizaciones-espera" className="text-sm text-cyan-400 underline">Cotizaciones piezas</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <div className="flex items-center gap-2 theme-text-muted text-xs mb-1">
            <DollarSign className="w-4 h-4" /> Ingresos
          </div>
          <div className="text-2xl font-semibold theme-text">${totals.ingreso.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 theme-text-muted text-xs mb-1">
            <Package className="w-4 h-4" /> Costos
          </div>
          <div className="text-2xl font-semibold theme-text">${totals.costo.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 theme-text-muted text-xs mb-1">
            <TrendingUp className="w-4 h-4" /> Ganancia neta
          </div>
          <div className={`text-2xl font-semibold ${totals.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${totals.ganancia.toFixed(2)}
          </div>
          <div className="text-xs theme-text-dim mt-1">Margen {totals.pct.toFixed(1)}%</div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium theme-text mb-2">
            <Wrench className="w-4 h-4" /> Desde módulo Servicio
          </div>
          <p className="text-sm theme-text-muted">
            {totals.porOrigen.servicio.n} venta(s) · ingreso ${totals.porOrigen.servicio.ingreso.toFixed(2)} · ganancia{' '}
            <span className={totals.porOrigen.servicio.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              ${totals.porOrigen.servicio.ganancia.toFixed(2)}
            </span>
          </p>
          <p className="text-xs theme-text-dim mt-1">Entra al marcar Continuar → Terminado en Servicio / reparación.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium theme-text mb-2">
            <Printer className="w-4 h-4" /> Desde cotizaciones de piezas
          </div>
          <p className="text-sm theme-text-muted">
            {totals.porOrigen.impresion.n} venta(s) · ingreso ${totals.porOrigen.impresion.ingreso.toFixed(2)} · ganancia{' '}
            <span className={totals.porOrigen.impresion.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              ${totals.porOrigen.impresion.ganancia.toFixed(2)}
            </span>
          </p>
          <p className="text-xs theme-text-dim mt-1">Entra al autorizar venta en Cotizaciones espera.</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold theme-text mb-2">Órdenes de este periodo</h3>
        <p className="text-sm theme-text mb-3">
          Entran al marcar Pagado o Adeudado, o al pasar la orden a Aprobado. El material y el tiempo siguen en el desglose de cada venta.
        </p>
        {movimientos.length === 0 ? (
          <p className="text-sm theme-text">Ninguna orden en este rango.</p>
        ) : (
          <ul className="space-y-2">
            {movimientos.map((m) => {
              const nombre = m.v.cliente_nombre || m.v.productos?.[0]?.descripcion || m.v.notas || 'Venta'
              const pago = m.v.pago === 'pagado' ? 'Pagado' : m.v.pago === 'adeudado' ? 'Adeudado' : 'Pago sin marcar'
              return (
                <li key={m.v.id} className="flex flex-wrap justify-between gap-2 text-sm border-b pb-2" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="font-semibold theme-text">{nombre}</span>
                  <span className="theme-text">{m.v.fecha} · {pago}</span>
                  <span className="theme-text">Venta ${m.ingreso.toFixed(2)} · Ganancia ${m.ganancia.toFixed(2)}</span>
                </li>
              )
            })}
          </ul>
        )}
        <Link to="/ventas" className="inline-block mt-3 text-sm text-cyan-400 underline">Ir a Ventas</Link>
      </Card>

      <Card>
        <h3 className="font-semibold theme-text mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4" /> Servicios terminados (detalle)
        </h3>
        {servicios.length === 0 ? (
          <p className="text-sm theme-text-muted">Ningún servicio terminado aún.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {servicios.map((s) => {
              const base = Number(s.costo_base) || 0
              const fin = Number(s.costo_final) || 0
              const gan = fin - base
              const pct = margenPct(fin, gan)
              return (
                <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2">
                  <div>
                    <div className="theme-text font-medium">
                      #{s.id} {[s.marca_impresora, s.modelo_impresora].filter(Boolean).join(' ')} — {s.cliente_nombre || 'Sin cliente'}
                    </div>
                    <div className="theme-text-dim text-xs">{s.descripcion}</div>
                    {s.venta_id && <div className="text-xs text-cyan-400">Venta #{s.venta_id} en contabilidad</div>}
                  </div>
                  <div className="text-right">
                    <div className="theme-text-dim text-xs">Costo ${base.toFixed(2)}</div>
                    <div>Cobrado ${fin.toFixed(2)}</div>
                    <div className={`text-xs font-semibold ${gan >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${gan.toFixed(2)} ({pct.toFixed(0)}%)
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold theme-text mb-2">Catálogo productos (referencia)</h3>
        <p className="text-sm theme-text-muted">
          Suma costo base ${totals.prodBase.toFixed(2)} · precio final ${totals.prodFinal.toFixed(2)} · margen $
          {totals.margenProd.toFixed(2)}
        </p>
      </Card>
    </div>
  )
}
