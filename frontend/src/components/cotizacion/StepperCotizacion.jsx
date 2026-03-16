import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  FileText,
  Calculator,
  Eye,
  FileDown,
  CheckCircle,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Cliente', icon: User },
  { id: 2, label: 'Proyecto', icon: FileText },
  { id: 3, label: 'Costos', icon: Calculator },
  { id: 4, label: 'Vista previa', icon: Eye },
  { id: 5, label: 'PDF', icon: FileDown },
  { id: 6, label: 'Confirmación', icon: CheckCircle },
]

const STEPS_VENDEDOR = [
  { id: 1, label: 'Cliente', icon: User },
  { id: 2, label: 'Proyecto', icon: FileText },
  { id: 3, label: 'Empaque y envío', icon: Calculator },
  { id: 4, label: 'Vista previa', icon: Eye },
  { id: 5, label: 'PDF', icon: FileDown },
  { id: 6, label: 'Confirmación', icon: CheckCircle },
]

export default function StepperCotizacion({ pasoActual, onPasoClick, isVendedorVentas = false }) {
  const steps = isVendedorVentas ? STEPS_VENDEDOR : STEPS
  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-4 mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isActive = pasoActual === step.id
        const isPast = pasoActual > step.id
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onPasoClick && onPasoClick(step.id)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-white/[0.1] border border-white/[0.15] shadow-[0_2px_12px_rgba(79,142,247,0.15)]'
                  : isPast
                    ? 'text-emerald-400/90 hover:bg-white/[0.05]'
                    : 'theme-text-dim hover:theme-text-muted hover:bg-white/[0.04]'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive
                    ? 'bg-[rgba(79,142,247,0.3)] theme-text'
                    : isPast
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.06] theme-text-muted'
                }`}
              >
                {isPast ? <CheckCircle className="w-5 h-5" /> : step.id}
              </span>
              <span className="text-xs font-medium hidden sm:block">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 sm:w-10 mx-1 rounded ${
                  isPast ? 'bg-emerald-500/40' : 'bg-white/[0.08]'
                }`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
