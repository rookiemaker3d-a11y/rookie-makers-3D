import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  Settings,
  Truck,
  ChevronRight,
  Trash2,
  FileDown,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import EstadoResultadosOrden from '../components/cotizacion/EstadoResultadosOrden'
import CotizacionPDF from '../components/cotizacion/CotizacionPDF'
import { sumarEstados } from '../utils/estadoResultados'

const ESTADOS = [
  { id: 'espera', label: 'Cotización en espera', color: 'slate', icon: Clock },
  { id: 'aprobado', label: 'Aprobado', color: 'emerald', icon: CheckCircle },
  { id: 'en_produccion', label: 'En producción', color: 'amber', icon: Settings },
  { id: 'entregado', label: 'Entregado', color: 'emerald', icon: Truck },
]

const ESTADO_EQUIV = {
  post_proceso: 'en_produccion',
  anexo_foto: 'en_produccion',
}

const colorClasses = {
  slate: 'border-slate-500/30 bg-slate-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/10',
  amber: 'border-amber-500/30 bg-amber-500/10',
  orange: 'border-orange-500/30 bg-orange-500/10',
  blue: 'border-blue-500/30 bg-blue-500/10',
}

function estadoDeOrden(cotizacion) {
  const lineas = cotizacion?.detalles?.lineas
  if (!Array.isArray(lineas)) return null
  const partes = lineas.map((l) => {
    const e = l?.estado_resultados
    if (!e) return null
    const cant = Number(l.cantidad) || 1
    return {
      material: (Number(e.material) || 0) * cant,
      luz: (Number(e.luz) || 0) * cant,
      internet: (Number(e.internet) || 0) * cant,
      desgaste: (Number(e.desgaste) || 0) * cant,
      mano_obra: (Number(e.mano_obra) || 0) * cant,
      costo_real: (Number(e.costo_real) || 0) * cant,
      precio: (Number(e.precio) || 0) * cant,
      ganancia: (Number(e.ganancia) || 0) * cant,
      horas: (Number(e.horas) || 0) * cant,
      gramos: (Number(e.gramos) || 0) * cant,
    }
  }).filter(Boolean)
  return partes.length ? sumarEstados(partes) : null
}

export default function CotizacionesEspera() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [cotizarModal, setCotizarModal] = useState(null) // { id, descripcion, costo_base, costo_final }
  const [cotizarSaving, setCotizarSaving] = useState(false)
  const [ordenAbierta, setOrdenAbierta] = useState(null)
  const [ordenAbiertaData, setOrdenAbiertaData] = useState(null)
  const [loadingOrden, setLoadingOrden] = useState(false)
  const [panelCotizar, setPanelCotizar] = useState({ costo_base: 0, costo_final: 0 })
  const [panelSaving, setPanelSaving] = useState(false)

  function load() {
    api('/cotizaciones-en-espera')
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  // Marcar como vistas cuando el vendedor de ventas entra a la página (deja de enviar recordatorios por correo)
  useEffect(() => {
    if (user?.role !== 'vendedor_ventas') return
    api('/cotizaciones-en-espera/marcar-vistas', { method: 'POST' }).catch(() => {})
  }, [api, user?.role])

  useEffect(() => {
    if (ordenAbierta == null) {
      setOrdenAbiertaData(null)
      return
    }
    setLoadingOrden(true)
    api(`/cotizaciones-en-espera/${ordenAbierta}`)
      .then((r) => r.json())
      .then((data) => {
        setOrdenAbiertaData(data)
        setPanelCotizar({ costo_base: data.costo_base ?? 0, costo_final: data.costo_final ?? 0 })
      })
      .catch(() => setOrdenAbiertaData(null))
      .finally(() => setLoadingOrden(false))
  }, [api, ordenAbierta])

  const descargarArchivo = async (cotizacionId) => {
    try {
      const res = await api(`/cotizaciones-en-espera/${cotizacionId}/archivo`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.split('filename="')?.[1]?.replace(/"/g, '') || `cotizacion_${cotizacionId}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (_) {}
  }

  const marcarComoCotizadoDesdePanel = async () => {
    if (!ordenAbiertaData) return
    setPanelSaving(true)
    try {
      const res = await api(`/cotizaciones-en-espera/${ordenAbiertaData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          costo_base: Number(panelCotizar.costo_base) || 0,
          costo_final: Number(panelCotizar.costo_final) || 0,
          detalles: { estado_cotizacion_vendedor: 'cotizado', visto_por_vendedor: false },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.detail || 'Error al actualizar')
        return
      }
      setOrdenAbierta(null)
      setOrdenAbiertaData(null)
      load()
    } catch {
      alert('Error de conexión')
    } finally {
      setPanelSaving(false)
    }
  }

  const getEstado = (c) => {
    const raw = (c.detalles && c.detalles.estado) || 'espera'
    return ESTADO_EQUIV[raw] || raw
  }
  const getEstadoVendedor = (c) => (c.detalles && c.detalles.estado_cotizacion_vendedor) || 'pendiente'
  const isOrdenVendedor = (c) => !!(c.detalles && c.detalles.orden_vendedor)
  const isDesigner = user?.role === 'administrador' || user?.role === 'vendedor'

  const marcarComoCotizado = async () => {
    if (!cotizarModal) return
    setCotizarSaving(true)
    try {
      const res = await api(`/cotizaciones-en-espera/${cotizarModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          costo_base: Number(cotizarModal.costo_base) || 0,
          costo_final: Number(cotizarModal.costo_final) || 0,
          detalles: { estado_cotizacion_vendedor: 'cotizado', visto_por_vendedor: false },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.detail || 'Error al cotizar')
        return
      }
      setCotizarModal(null)
      load()
    } catch {
      alert('Error de conexión')
    } finally {
      setCotizarSaving(false)
    }
  }

  const byEstado = ESTADOS.reduce((acc, e) => {
    acc[e.id] = items.filter((c) => getEstado(c) === e.id)
    return acc
  }, {})

  const descargarPdf = async (c) => {
    const d = c?.detalles || {}
    const lineas = (Array.isArray(d.lineas) ? d.lineas : []).filter((l) => !String(l?.id_producto || '').startsWith('R'))
    const folio = d.folio || `COT-${c.id}`
    const blob = await pdf(
      <CotizacionPDF
        folio={folio}
        cliente={{ nombre: d.cliente_nombre || c.descripcion, correo: d.cliente_correo, telefono: d.cliente_telefono }}
        proyecto={{ nombre: d.proyecto || c.descripcion }}
        lineas={lineas.length ? lineas : [{ nombre_producto: c.descripcion, horas_impresion: d.horas, color_producto: d.color, cantidad: c.cantidad || 1, costo_unitario: c.costo_final, costo_final: c.costo_final }]}
        subTotal={Number(d.sub_total) || Number(c.costo_final) || 0}
        descuento={Number(d.descuento) || 0}
        envio={Number(d.envio) || 0}
        empaque={Number(d.empaque) || 0}
        totalFinal={Number(d.total) || Number(c.costo_final) || 0}
        notas={d.notas || ''}
        vendedor={{ nombre: d.vendedor_nombre || c.vendedor, email: d.vendedor_email || '' }}
        transferencia={d.transferencia || { beneficiario: d.vendedor_nombre || c.vendedor }}
      />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Cotizacion-${folio}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const marcarPago = async (c, pago) => {
    setUpdating(c.id)
    try {
      await api(`/cotizaciones-en-espera/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ detalles: { pago } }),
      })
      if (c.detalles?.venta_id) {
        await api(`/ventas/${c.detalles.venta_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ pago }),
        })
      }
      load()
      setOrdenAbiertaData((prev) => prev && prev.id === c.id ? { ...prev, detalles: { ...(prev.detalles || {}), pago } } : prev)
    } finally {
      setUpdating(null)
    }
  }

  const setEstado = async (id, estado) => {
    setUpdating(id)
    try {
      await api(`/cotizaciones-en-espera/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ detalles: { estado } }),
      })
      setOrdenAbiertaData((prev) => prev && prev.id === id ? { ...prev, detalles: { ...(prev.detalles || {}), estado } } : prev)
      load()
    } catch {
      // error silencioso, el usuario ve que no avanza
    } finally {
      setUpdating(null)
    }
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar esta cotización?')) return
    try {
      await api(`/cotizaciones-en-espera/${id}`, { method: 'DELETE' })
      load()
    } catch {
      // error silencioso
    }
  }

  const autorizarVenta = async (id, catalogo) => {
    const msg = catalogo === 'propio'
      ? '¿Guardar como producto propio? Solo tú lo verás en tu catálogo.'
      : '¿Guardar como producto general? Todos los usuarios lo verán en el catálogo general.'
    if (!confirm(msg)) return
    try {
      const r = await api('/cotizaciones-en-espera/autorizar-venta', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], catalogo }),
      })
      if (!r.ok) throw new Error((await r.json()).detail || 'Error al autorizar')
      alert(`Producto guardado como ${catalogo === 'propio' ? 'propio' : 'general'}.`)
      load()
    } catch (err) {
      alert(err.message || 'Error de conexión')
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const dt = new Date(d)
      const now = new Date()
      const diff = Math.floor((now - dt) / (1000 * 60 * 60 * 24))
      if (diff === 0) return 'Hoy'
      if (diff === 1) return 'Ayer'
      if (diff < 7) return `Hace ${diff} días`
      return dt.toLocaleDateString()
    } catch {
      return d
    }
  }

  const noVistasCount = user?.role === 'vendedor_ventas' ? items.filter((c) => getEstadoVendedor(c) === 'cotizado' && !c.detalles?.visto_por_vendedor).length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {noVistasCount > 0 && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="theme-text font-medium">
            Tienes {noVistasCount} cotización(es) lista(s). Norberto ya las cotizó. Revisa el total y gastos de empaque/envío abajo.
          </p>
        </div>
      )}
      <SectionHeader
        title="Pipeline de pedidos"
        subtitle={user?.role === 'vendedor_ventas' ? 'Tus órdenes enviadas. "En espera" = sin cotizar aún. "Recibido" = ya cotizado.' : 'Cotizaciones por etapa. Usa el botón para avanzar de estado.'}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {ESTADOS.map((est) => {
          const list = byEstado[est.id] || []
          const Icon = est.icon
          return (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`min-w-[200px] rounded-xl border ${colorClasses[est.color]} p-3 flex flex-col max-h-[70vh] overflow-hidden`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 shrink-0 theme-text" />
                <span className="font-semibold theme-text text-sm">{est.label}</span>
              </div>
              <span className="theme-text-muted text-xs mb-2">{list.length} pedido(s)</span>
              <div className="flex-1 overflow-y-auto space-y-2">
                {list.length === 0 && (
                  <p className="text-xs font-medium theme-text">
                    {est.id === 'espera' ? 'Ningún pedido en espera.' : `Ningún pedido aquí. En la tarjeta anterior pulsa «Pasar a ${est.label}».`}
                  </p>
                )}
                {list.map((c) => {
                  const estadoOrden = estadoDeOrden(c)
                  const costo = estadoOrden ? Number(estadoOrden.costo_real) || 0 : Number(c.costo_base) || 0
                  const precio = Number(c.costo_final) || 0
                  const ganancia = Math.round((precio - costo) * 100) / 100
                  return (
                  <Card key={c.id} padding className="p-3 text-left">
                    <button type="button" onClick={() => setOrdenAbierta(c.id)} className="w-full text-left space-y-0.5">
                      <p className="theme-text font-medium text-sm truncate" title={c.descripcion}>{c.descripcion}</p>
                      <p className="theme-text-dim text-xs">{formatDate(c.created_at)}</p>
                      <p className="theme-text-muted text-xs truncate">{c.vendedor || '—'}</p>
                      <p className="text-xs theme-text">Costo ${costo.toFixed(2)}</p>
                      <p className={`text-xs font-semibold ${ganancia >= 0 ? 'text-money-ok' : 'text-money-bad'}`}>Ganancia ${ganancia.toFixed(2)}</p>
                      <p className="text-xs font-semibold theme-text">
                        {c.detalles?.pago === 'pagado' ? 'Pagado' : c.detalles?.pago === 'adeudado' ? 'Adeudado' : 'Pago sin marcar'}
                      </p>
                    </button>
                    <div className="flex flex-wrap gap-1 pt-2">
                      <button type="button" disabled={updating === c.id} onClick={() => marcarPago(c, 'pagado')} className={`btn-pago ${c.detalles?.pago === 'pagado' ? 'btn-pago-on' : ''}`}>Pagado</button>
                      <button type="button" disabled={updating === c.id} onClick={() => marcarPago(c, 'adeudado')} className={`btn-pago ${c.detalles?.pago === 'adeudado' ? 'btn-deuda-on' : ''}`}>Adeudado</button>
                      {ESTADOS.findIndex((e) => e.id === getEstado(c)) < ESTADOS.length - 1 && (
                        <button
                          type="button"
                          disabled={updating === c.id}
                          onClick={() => setEstado(c.id, ESTADOS[ESTADOS.findIndex((e) => e.id === getEstado(c)) + 1].id)}
                          className="btn-paso"
                        >
                          Pasar a {ESTADOS[ESTADOS.findIndex((e) => e.id === getEstado(c)) + 1].label}
                        </button>
                      )}
                    </div>
                  </Card>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {ordenAbierta != null && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setOrdenAbierta(null)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="w-full max-w-md border-l shadow-xl overflow-y-auto"
            style={{ borderColor: 'var(--theme-border)', background: 'color-mix(in srgb, var(--theme-bg-page) 90%, black)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <h3 className="text-lg font-semibold theme-text">Detalle de la orden</h3>
              <button type="button" onClick={() => setOrdenAbierta(null)} className="p-2 rounded-lg hover:bg-white/10 theme-text" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {loadingOrden ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ordenAbiertaData ? (
                <>
                  <div>
                    <p className="theme-text-muted text-xs">Descripción</p>
                    <p className="theme-text font-medium">{ordenAbiertaData.descripcion}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="theme-text-muted text-xs">Vendedor</p>
                      <p className="theme-text">{ordenAbiertaData.vendedor}</p>
                    </div>
                    <div>
                      <p className="theme-text-muted text-xs">Fecha</p>
                      <p className="theme-text">{formatDate(ordenAbiertaData.created_at)}</p>
                    </div>
                  </div>
                  {ordenAbiertaData.detalles && (
                    <div className="space-y-1 text-sm">
                      {ordenAbiertaData.detalles.folio && (
                        <p className="theme-text"><span className="theme-text-muted">Folio:</span> {ordenAbiertaData.detalles.folio}</p>
                      )}
                      {ordenAbiertaData.detalles.cliente_nombre && (
                        <p className="theme-text"><span className="theme-text-muted">Cliente:</span> {ordenAbiertaData.detalles.cliente_nombre}</p>
                      )}
                      {ordenAbiertaData.detalles.proyecto && (
                        <p className="theme-text"><span className="theme-text-muted">Proyecto:</span> {ordenAbiertaData.detalles.proyecto}</p>
                      )}
                      {(ordenAbiertaData.detalles.envio != null || ordenAbiertaData.detalles.empaque != null) && (
                        <p className="theme-text">
                          <span className="theme-text-muted">Envío / Empaque:</span> ${Number(ordenAbiertaData.detalles.envio || 0).toFixed(2)} / ${Number(ordenAbiertaData.detalles.empaque || 0).toFixed(2)}
                        </p>
                      )}
                      {estadoDeOrden(ordenAbiertaData) && (
                        <EstadoResultadosOrden estado={estadoDeOrden(ordenAbiertaData)} titulo="Estado de resultados" />
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {ESTADOS.map((e) => (
                      <span key={e.id} className={`text-[11px] px-2 py-1 rounded font-semibold ${getEstado(ordenAbiertaData) === e.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-900'}`}>
                        {e.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold theme-text">
                    {ordenAbiertaData.detalles?.pago === 'pagado' ? 'Pagado' : ordenAbiertaData.detalles?.pago === 'adeudado' ? 'Adeudado' : 'Pago sin marcar'}
                  </p>
                  <button type="button" onClick={() => descargarPdf(ordenAbiertaData)} className="btn-paso inline-flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    Descargar PDF
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => marcarPago(ordenAbiertaData, 'pagado')} className={`btn-pago ${ordenAbiertaData.detalles?.pago === 'pagado' ? 'btn-pago-on' : ''}`}>Pagado</button>
                    <button type="button" onClick={() => marcarPago(ordenAbiertaData, 'adeudado')} className={`btn-pago ${ordenAbiertaData.detalles?.pago === 'adeudado' ? 'btn-deuda-on' : ''}`}>Adeudado</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ESTADOS.findIndex((e) => e.id === getEstado(ordenAbiertaData)) < ESTADOS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setEstado(ordenAbiertaData.id, ESTADOS[ESTADOS.findIndex((e) => e.id === getEstado(ordenAbiertaData)) + 1].id)}
                        disabled={updating === ordenAbiertaData.id}
                        className="btn-paso inline-flex items-center gap-1"
                      >
                        Pasar a {ESTADOS[ESTADOS.findIndex((e) => e.id === getEstado(ordenAbiertaData)) + 1].label} <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {isOrdenVendedor(ordenAbiertaData) && getEstadoVendedor(ordenAbiertaData) === 'pendiente' && isDesigner && (
                      <button
                        type="button"
                        onClick={() => setCotizarModal({ id: ordenAbiertaData.id, descripcion: ordenAbiertaData.descripcion, costo_base: ordenAbiertaData.costo_base || 0, costo_final: ordenAbiertaData.costo_final || 0 })}
                        className="btn-paso"
                      >
                        Cotizar
                      </button>
                    )}
                    {(user?.role === 'administrador' || user?.role === 'vendedor') && (
                      <>
                        <button type="button" onClick={() => autorizarVenta(ordenAbiertaData.id, 'general')} className="btn-pago">Contar en ventas, catálogo general</button>
                        <button type="button" onClick={() => autorizarVenta(ordenAbiertaData.id, 'propio')} className="btn-pago">Contar en ventas, solo mío</button>
                      </>
                    )}
                    <button type="button" onClick={() => deleteOne(ordenAbiertaData.id)} className="text-red-400 p-1" aria-label="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {ordenAbiertaData.has_archivo && (
                    <div>
                      <button
                        type="button"
                        onClick={() => descargarArchivo(ordenAbiertaData.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 theme-text text-sm"
                      >
                        <FileDown className="w-4 h-4" />
                        Descargar archivo
                      </button>
                    </div>
                  )}
                  {isDesigner ? (
                    <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                      <div>
                        <label className="block theme-text-muted text-xs mb-1">Costo base (MXN)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={panelCotizar.costo_base}
                          onChange={(e) => setPanelCotizar((p) => ({ ...p, costo_base: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] theme-text text-sm"
                        />
                      </div>
                      <div>
                        <label className="block theme-text-muted text-xs mb-1">Precio final al cliente (MXN)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={panelCotizar.costo_final}
                          onChange={(e) => setPanelCotizar((p) => ({ ...p, costo_final: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] theme-text text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={marcarComoCotizadoDesdePanel}
                        disabled={panelSaving}
                        className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
                      >
                        {panelSaving ? 'Guardando...' : 'Marcar como cotizado'}
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                      <p className="theme-text-muted text-xs">Total</p>
                      <p className="theme-text text-lg font-semibold">${(ordenAbiertaData.costo_final ?? 0).toFixed(2)} MXN</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="theme-text-muted text-sm">No se pudo cargar la orden.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {cotizarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCotizarModal(null)}>
          <div className="border rounded-2xl shadow-xl max-w-md w-full p-6" style={{ borderColor: 'var(--theme-border)', background: 'color-mix(in srgb, var(--theme-bg-page) 90%, black)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold theme-text mb-2">Ya cotisé — Marcar como recibido para el vendedor</h3>
            <p className="theme-text-muted text-sm mb-4 truncate" title={cotizarModal.descripcion}>{cotizarModal.descripcion}</p>
            <div className="space-y-3">
              <div>
                <label className="block theme-text-muted text-xs mb-1">Costo base (MXN)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cotizarModal.costo_base}
                  onChange={(e) => setCotizarModal((m) => ({ ...m, costo_base: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] theme-text"
                />
              </div>
              <div>
                <label className="block theme-text-muted text-xs mb-1">Precio final al cliente (MXN)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cotizarModal.costo_final}
                  onChange={(e) => setCotizarModal((m) => ({ ...m, costo_final: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] theme-text"
                />
              </div>
            </div>
            <p className="theme-text-dim text-xs mt-3">El vendedor verá "Recibido" y el total en Cotizaciones espera y en el paso Empaque y envío. Para notificar por correo al vendedor se puede conectar Resend o SendGrid en el backend (misma app, sin otra app).</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={marcarComoCotizado} disabled={cotizarSaving} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">
                {cotizarSaving ? 'Guardando...' : 'Marcar como cotizado'}
              </button>
              <button type="button" onClick={() => setCotizarModal(null)} className="px-4 py-2 rounded-xl bg-white/[0.08] theme-text text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
