import { motion } from 'framer-motion'
import { ArrowRight, Package } from 'lucide-react'
import { Card } from '../ui'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]'

export default function PasoEmpaqueEnvio({ wizardData, setWizardData, onNext }) {
  const empaque = Number(wizardData.empaque) || 0
  const envio = Number(wizardData.envio) || 0

  const setEmpaque = (v) => setWizardData((prev) => ({ ...prev, empaque: Number(v) || 0 }))
  const setEnvio = (v) => setWizardData((prev) => ({ ...prev, envio: Number(v) || 0 }))

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="max-w-xl"
    >
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
    </motion.div>
  )
}
