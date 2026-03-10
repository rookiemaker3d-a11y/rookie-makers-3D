import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, FileText, LayoutDashboard } from 'lucide-react'
import { Card } from '../ui'

export default function PasoConfirmacion({ folio, wizardData, desglose, onConfirm, saving }) {
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    const ok = await onConfirm()
    if (ok) setConfirmed(true)
  }

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">Cotización registrada</h3>
        <p className="text-slate-400 text-sm mb-6">Estado: En espera · Folio: {folio}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/cotizaciones-espera"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] text-white font-medium"
          >
            <FileText className="w-4 h-4" />
            Ver cotización creada
          </Link>
          <Link
            to="/cotizacion/nueva"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium"
          >
            Nueva cotización
          </Link>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Ir al dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3">
          <h3 className="text-lg font-semibold text-white">Confirmar y registrar</h3>
          <p className="text-slate-500 text-sm mt-0.5">La cotización quedará en estado &quot;En espera&quot;</p>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          Cliente: <strong className="text-white">{wizardData?.cliente?.nombre}</strong> · Total: <strong className="text-white">${desglose?.precioCliente?.toFixed(2)}</strong> MXN
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Registrar cotización en espera'}
        </button>
      </Card>
    </motion.div>
  )
}
