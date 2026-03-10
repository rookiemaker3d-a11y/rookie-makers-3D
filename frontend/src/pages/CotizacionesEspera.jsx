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
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  function load() {
    api('/cotizaciones-en-espera')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const getEstado = (c) => (c.detalles && c.detalles.estado) || 'espera'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pipeline de pedidos"
        subtitle="Cotizaciones por etapa. Usa el botón para avanzar de estado."
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
                {list.map((c) => (
                  <Card key={c.id} padding className="p-3 text-left">
                    <p className="theme-text font-medium text-sm truncate" title={c.descripcion}>
                      {c.descripcion}
                    </p>
                    <p className="theme-text-muted text-xs mt-0.5">${(c.costo_final || 0).toFixed(2)} · {c.vendedor}</p>
                    <p className="theme-text-dim text-xs mt-0.5">{formatDate(c.created_at)}</p>
                    {est.id === 'anexo_foto' && (
                      <AnexoFotosCard cotizacion={c} onSave={() => load()} api={api} setUpdating={setUpdating} />
                    )}
                    <div className="flex items-center justify-between gap-1 mt-2">
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
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
