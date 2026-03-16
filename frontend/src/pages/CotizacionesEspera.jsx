import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  Settings,
  Package,
  Camera,
  Truck,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import AnexoFotosCard from '../components/cotizacion/AnexoFotosCard'

const ESTADOS = [
  { id: 'espera', label: 'Cotización en espera', color: 'slate', icon: Clock },
  { id: 'aprobado', label: 'Aprobado y pagado', color: 'emerald', icon: CheckCircle },
  { id: 'en_produccion', label: 'En producción', color: 'amber', icon: Settings },
  { id: 'post_proceso', label: 'Post-proceso', color: 'orange', icon: Package },
  { id: 'anexo_foto', label: 'Anexo de foto', color: 'blue', icon: Camera },
  { id: 'entregado', label: 'Entregado', color: 'emerald', icon: Truck },
]

const colorClasses = {
  slate: 'border-slate-500/30 bg-slate-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/10',
  amber: 'border-amber-500/30 bg-amber-500/10',
  orange: 'border-orange-500/30 bg-orange-500/10',
  blue: 'border-blue-500/30 bg-blue-500/10',
}

export default function CotizacionesEspera() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [cotizarModal, setCotizarModal] = useState(null) // { id, descripcion, costo_base, costo_final }
  const [cotizarSaving, setCotizarSaving] = useState(false)

  function load() {
    api('/cotizaciones-en-espera')
      .then((r) => r.json())
      .then(setItems)
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

  const getEstado = (c) => (c.detalles && c.detalles.estado) || 'espera'
  const getEstadoVendedor = (c) => (c.detalles && c.detalles.estado_cotizacion_vendedor) || 'pendiente'
  const isOrdenVendedor = (c) => !!(c.detalles && c.detalles.orden_vendedor)
  const isDesigner = user?.role === 'administrador' || user?.role === 'vendedor'

  const marcarComoCotizado = async () => {
    if (!cotizarModal) return
    setCotizarSaving(true)
    try {
      await api(`/cotizaciones-en-espera/${cotizarModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          costo_base: Number(cotizarModal.costo_base) || 0,
          costo_final: Number(cotizarModal.costo_final) || 0,
          detalles: { estado_cotizacion_vendedor: 'cotizado', visto_por_vendedor: false },
        }),
      })
      setCotizarModal(null)
      load()
    } finally {
      setCotizarSaving(false)
    }
  }

  const byEstado = ESTADOS.reduce((acc, e) => {
    acc[e.id] = items.filter((c) => getEstado(c) === e.id)
    return acc
  }, {})

  const setEstado = async (id, estado) => {
    setUpdating(id)
    try {
      await api(`/cotizaciones-en-espera/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ detalles: { estado } }),
      })
      load()
    } finally {
      setUpdating(null)
    }
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar esta cotización?')) return
    await api(`/cotizaciones-en-espera/${id}`, { method: 'DELETE' })
    load()
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
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
                {list.map((c) => {
                  const estadoVendedor = getEstadoVendedor(c)
                  const ordenVendedor = isOrdenVendedor(c)
                  const pendienteCotizar = ordenVendedor && estadoVendedor === 'pendiente' && isDesigner
                  return (
                  <Card key={c.id} padding className="p-3 text-left">
                    {ordenVendedor && (
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded mb-1.5 ${estadoVendedor === 'cotizado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {estadoVendedor === 'cotizado' ? 'Recibido' : 'En espera'}
                      </span>
                    )}
                    <p className="theme-text font-medium text-sm truncate" title={c.descripcion}>
                      {c.descripcion}
                    </p>
                    <p className="theme-text-muted text-xs mt-0.5">${(c.costo_final || 0).toFixed(2)} · {c.vendedor}</p>
                    <p className="theme-text-dim text-xs mt-0.5">{formatDate(c.created_at)}</p>
                    {est.id === 'anexo_foto' && (
                      <AnexoFotosCard cotizacion={c} onSave={() => load()} api={api} setUpdating={setUpdating} />
                    )}
                    <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                      {pendienteCotizar && (
                        <button
                          type="button"
                          onClick={() => setCotizarModal({ id: c.id, descripcion: c.descripcion, costo_base: c.costo_base || 0, costo_final: c.costo_final || 0 })}
                          className="text-xs px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          Cotizar
                        </button>
                      )}
                      {ESTADOS.findIndex((e) => e.id === est.id) < ESTADOS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setEstado(c.id, ESTADOS[ESTADOS.findIndex((e) => e.id === est.id) + 1].id)}
                          disabled={updating === c.id}
                          className="text-xs flex items-center gap-0.5 theme-text-muted hover:text-[var(--theme-text)]"
                        >
                          Siguiente <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => deleteOne(c.id)}
                        className="text-red-400 hover:text-red-300 p-0.5"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </Card>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {cotizarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setCotizarModal(null)}>
          <div className="bg-[var(--theme-bg-card)] border rounded-2xl shadow-xl max-w-md w-full p-6" style={{ borderColor: 'var(--theme-border)' }} onClick={(e) => e.stopPropagation()}>
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
