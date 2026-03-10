import { motion } from 'framer-motion'
import { Card } from '../ui'

const folio = () => `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

export default function PasoPreview({ wizardData, desglose, notas, setNotas }) {
  const cliente = wizardData?.cliente
  const proyecto = wizardData?.proyecto
  const d = desglose || {}

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3">
          <h3 className="text-lg font-semibold text-white">Vista previa de cotización</h3>
          <p className="text-slate-500 text-sm mt-0.5">Folio: {folio()}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-slate-500 uppercase tracking-wide mb-1">Cliente</p>
            <p className="text-white font-medium">{cliente?.nombre ?? '—'}</p>
            <p className="text-slate-400">{cliente?.correo}</p>
            {cliente?.telefono && <p className="text-slate-400">{cliente.telefono}</p>}
          </div>
          <div>
            <p className="text-slate-500 uppercase tracking-wide mb-1">Proyecto</p>
            <p className="text-white font-medium">{proyecto?.nombre ?? '—'}</p>
            <p className="text-slate-400">{proyecto?.categoria ?? '—'}</p>
          </div>
        </div>
        <table className="w-full text-sm mt-4 border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-2 text-slate-400 font-medium">Concepto</th>
              <th className="text-right py-2 text-slate-400 font-medium">Monto (MXN)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.06]"><td className="py-2 text-slate-300">Material</td><td className="text-right text-white tabular-nums">${d.material?.toFixed(2)}</td></tr>
            <tr className="border-b border-white/[0.06]"><td className="py-2 text-slate-300">Tiempo máquina</td><td className="text-right text-white tabular-nums">${d.tiempoMaquina?.toFixed(2)}</td></tr>
            <tr className="border-b border-white/[0.06]"><td className="py-2 text-slate-300">Diseño / archivo</td><td className="text-right text-white tabular-nums">${d.disenoArchivo?.toFixed(2)}</td></tr>
            <tr className="border-b border-white/[0.06]"><td className="py-2 text-slate-300">Extras</td><td className="text-right text-white tabular-nums">${d.extras?.toFixed(2)}</td></tr>
            <tr className="border-t border-white/[0.08]">
              <td className="py-2 font-medium text-white">Total</td>
              <td className="text-right font-semibold text-white tabular-nums">${d.precioCliente?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-slate-500 text-xs mt-3">Vigencia: 7 días · Anticipo: {d.anticipoPorcentaje}% (${d.anticipoMonto?.toFixed(2)})</p>
        <div className="mt-4">
          <label className="block text-slate-400 text-sm mb-1">Notas adicionales</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Condiciones, tiempo de entrega..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm"
          />
        </div>
      </Card>
    </motion.div>
  )
}

export { folio }
