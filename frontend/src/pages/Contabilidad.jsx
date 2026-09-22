import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { DollarSign, TrendingUp, Package, Wrench, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react'

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

function veredicto(ganancia, pct) {
  if (ganancia > 0 && pct >= 15) return { ok: true, label: 'Sí renta', tone: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' }
  if (ganancia > 0 && pct > 0) return { ok: true, label: 'Renta poco', tone: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40' }
  if (ganancia === 0) return { ok: false, label: 'Sin margen', tone: 'text-slate-300', bg: 'bg-slate-500/15 border-slate-500/40' }
  return { ok: false, label: 'No renta (pérdida)', tone: 'text-red-400', bg: 'bg-red-500/15 border-red-500/40' }
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

  const totals = useMemo(() => {
    const ingreso = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
    const ganancia = ventas.reduce((s, v) => s + (Number(v.ganancia_neta) || 0), 0)
    const costo = ingreso - ganancia
    const pct = margenPct(ingreso, ganancia)
    const porOrigen = { servicio: { ingreso: 0, ganancia: 0, n: 0 }, impresion: { ingreso: 0, ganancia: 0, n: 0 }, otro: { ingreso: 0, ganancia: 0, n: 0 } }
    for (const v of ventas) {
      const o = origenVenta(v)
      porOrigen[o].ingreso += Number(v.total) || 0
      porOrigen[o].ganancia += Number(v.ganancia_neta) || 0
      porOrigen[o].n += 1
    }
    const prodBase = productos.reduce((s, p) => s + (Number(p.costo_base) || 0), 0)
    const prodFinal = productos.reduce((s, p) => s + (Number(p.costo_final) || 0), 0)
    return {
      ingreso,
      ganancia,
      costo,
      pct,
      verd: veredicto(ganancia, pct),
      porOrigen,
      prodBase,
      prodFinal,
      margenProd: prodFinal - prodBase,
    }
  }, [ventas, productos])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contabilidad"
        subtitle="Conectada al ERP: al autorizar una cotización de impresión o al terminar un servicio/reparación, el dinero entra aquí con costo, ingreso y ganancia."
      />

      <div className={`rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3 ${totals.verd.bg}`}>
        {totals.verd.ok ? (
          <CheckCircle2 className={`w-6 h-6 ${totals.verd.tone}`} />
        ) : (
          <AlertTriangle className={`w-6 h-6 ${totals.verd.tone}`} />
        )}
        <div>
          <div className={`text-lg font-bold ${totals.verd.tone}`}>{totals.verd.label}</div>
          <p className="text-sm theme-text-muted">
            En el periodo: margen {totals.pct.toFixed(1)}% · ganancia ${totals.ganancia.toFixed(2)} sobre ingresos ${totals.ingreso.toFixed(2)}
            {totals.ingreso <= 0 ? ' (aún no hay ventas cerradas en este rango).' : '.'}
          </p>
        </div>
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
        <h3 className="font-semibold theme-text mb-3">Movimientos (impresiones + servicios)</h3>
        {loading ? (
          <p className="text-sm theme-text-muted">Cargando…</p>
        ) : ventas.length === 0 ? (
          <p className="text-sm theme-text-muted">
            Aún no hay ventas cerradas en este rango. Los borradores o “cotizando / espera / pagado” no cuentan hasta que
            termines el servicio o autorices la pieza.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left theme-text-dim border-b border-white/10">
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Origen</th>
                  <th className="py-2 pr-2">Cliente</th>
                  <th className="py-2 pr-2">Detalle</th>
                  <th className="py-2 pr-2">Ingreso</th>
                  <th className="py-2 pr-2">Costo</th>
                  <th className="py-2 pr-2">Ganancia</th>
                  <th className="py-2">¿Renta?</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const total = Number(v.total) || 0
                  const gan = Number(v.ganancia_neta) || 0
                  const costo = total - gan
                  const pct = margenPct(total, gan)
                  const verd = veredicto(gan, pct)
                  const o = origenVenta(v)
                  return (
                    <tr key={v.id} className="border-b border-white/5">
                      <td className="py-2 pr-2 theme-text-muted">{v.fecha}</td>
                      <td className="py-2 pr-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                          {o === 'servicio' ? 'Servicio' : o === 'impresion' ? 'Pieza' : 'Otro'}
                        </span>
                      </td>
                      <td className="py-2 pr-2">{v.cliente_nombre || '—'}</td>
                      <td className="py-2 pr-2 theme-text-muted max-w-[200px] truncate">
                        {v.notas || (v.productos || []).map((p) => p.descripcion).join(', ')}
                      </td>
                      <td className="py-2 pr-2 font-medium">${total.toFixed(2)}</td>
                      <td className="py-2 pr-2 theme-text-dim">${costo.toFixed(2)}</td>
                      <td className={`py-2 pr-2 ${gan >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${gan.toFixed(2)}
                        <span className="theme-text-dim text-xs ml-1">({pct.toFixed(0)}%)</span>
                      </td>
                      <td className={`py-2 text-xs font-semibold ${verd.tone}`}>{verd.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
              const verd = veredicto(gan, pct)
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
                    <div className={`text-xs font-semibold ${verd.tone}`}>
                      {verd.label} · ${gan.toFixed(2)} ({pct.toFixed(0)}%)
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
