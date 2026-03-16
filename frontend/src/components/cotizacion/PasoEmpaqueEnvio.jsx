import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, Clock, CheckCircle } from 'lucide-react'
import { Card } from '../ui'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]'

export default function PasoEmpaqueEnvio({ wizardData, setWizardData, onNext, api }) {
  const empaque = Number(wizardData.empaque) || 0
  const envio = Number(wizardData.envio) || 0
  const [ordenes, setOrdenes] = useState([])

  useEffect(() => {
    if (!api) return
    api('/cotizaciones-en-espera')
      .then((r) => r.json())
      .then((list) => setOrdenes(Array.isArray(list) ? list.slice(0, 6) : []))
      .catch(() => setOrdenes([]))
  }, [api])

  const setEmpaque = (v) => setWizardData((prev) => ({ ...prev, empaque: Number(v) || 0 }))
  const setEnvio = (v) => setWizardData((prev) => ({ ...prev, envio: Number(v) || 0 }))

  const getEstadoVendedor = (c) => (c.detalles && c.detalles.estado_cotizacion_vendedor) || 'pendiente'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      <div className="max-w-xl flex-1">
      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3">
          <h3 className="text-sm font-semibold theme-text flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-500" />
            Empaque y envío (opcional)
          </h3>
          <p className="theme-text-dim text-xs mt-1">
            Esta orden se enviará al diseñador para cotizar. Tú solo añades empaque y envío si aplican. Los costos del producto y acabados los calcula el diseñador.
          </p>
        </div>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block theme-text-muted text-sm mb-1">Empaque (MXN)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={empaque || ''}
              onChange={(e) => setEmpaque(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block theme-text-muted text-sm mb-1">Envío (MXN)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={envio || ''}
              onChange={(e) => setEnvio(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div className="border-t border-white/[0.08] pt-3 mt-3 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 theme-text text-sm font-medium"
            >
              Siguiente (vista previa)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
      </div>

      <div className="lg:w-80 shrink-0">
        <div className="lg:sticky lg:top-24">
          <Card>
            <div className="border-b border-white/[0.08] pb-3 mb-3">
              <h3 className="text-sm font-semibold theme-text">Estado de tus órdenes</h3>
              <p className="theme-text-dim text-xs mt-0.5">En espera = Norberto aún no la cotiza. Recibido = ya está cotizada.</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ordenes.length === 0 && <p className="theme-text-muted text-xs">No hay órdenes enviadas. Usa el paso Proyecto para enviar una.</p>}
              {ordenes.map((c) => {
                const estado = getEstadoVendedor(c)
                const isRecibido = estado === 'cotizado'
                return (
                  <Link
                    key={c.id}
                    to="/cotizaciones-espera"
                    className="block p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"
                  >
                    <p className="theme-text text-xs font-medium truncate" title={c.descripcion}>{c.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isRecibido ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" /> Recibido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                          <Clock className="w-3.5 h-3.5" /> En espera
                        </span>
                      )}
                      {isRecibido && <span className="text-xs theme-text-muted tabular-nums">${(c.costo_final ?? 0).toFixed(2)}</span>}
                    </div>
                    {isRecibido && (c.detalles?.empaque > 0 || c.detalles?.envio > 0) && (
                      <p className="theme-text-dim text-xs mt-0.5">Empaque + envío: ${((c.detalles?.empaque || 0) + (c.detalles?.envio || 0)).toFixed(2)}</p>
                    )}
                  </Link>
                )
              })}
            </div>
            <Link to="/cotizaciones-espera" className="block mt-3 pt-3 border-t border-white/[0.08] text-center text-sm theme-text-muted hover:theme-text">
              Ver todas en Cotizaciones espera
            </Link>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
