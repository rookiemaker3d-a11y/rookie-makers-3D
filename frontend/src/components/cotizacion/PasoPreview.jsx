import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Card } from '../ui'

const folio = () => `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

export default function PasoPreview({ wizardData, setWizardData, desglose, lineas = [], subTotal = 0, descuento = 0, envio = 0, totalFinal = 0, notas, setNotas, onMasProductos }) {
  const cliente = wizardData?.cliente
  const proyecto = wizardData?.proyecto
  const d = desglose || {}
  const hasLineas = Array.isArray(lineas) && lineas.length > 0

  const setDescuento = (v) => setWizardData((prev) => ({ ...prev, descuento: Number(v) || 0 }))
  const setEnvio = (v) => setWizardData((prev) => ({ ...prev, envio: Number(v) || 0 }))

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Vista previa de cotización</h3>
            <p className="text-slate-500 text-sm mt-0.5">Folio: {folio()}</p>
          </div>
          {onMasProductos && (
            <button type="button" onClick={onMasProductos} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 text-sm">
              <Plus className="w-4 h-4" /> Más productos
            </button>
          )}
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

        {hasLineas ? (
          <>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black/40 text-white">
                    <th className="text-left py-2 px-2 font-medium">ID producto</th>
                    <th className="text-left py-2 px-2 font-medium">Producto</th>
                    <th className="text-left py-2 px-2 font-medium">Descripción</th>
                    <th className="text-right py-2 px-2 font-medium">Costo</th>
                    <th className="text-right py-2 px-2 font-medium">Cantidad</th>
                    <th className="text-right py-2 px-2 font-medium">Costo final</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l, i) => (
                    <tr key={i} className="border-b border-white/[0.06]">
                      <td className="py-2 px-2 text-slate-300">{l.id_producto}</td>
                      <td className="py-2 px-2 text-white">{l.nombre_producto}</td>
                      <td className="py-2 px-2 text-slate-400">{l.descripcion || '—'}</td>
                      <td className="py-2 px-2 text-right text-white tabular-nums">${(l.costo_unitario ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-white tabular-nums">{l.cantidad ?? 1}</td>
                      <td className="py-2 px-2 text-right text-white tabular-nums">${(l.costo_final ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 justify-end items-start">
              <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between gap-8"><span className="text-slate-400">Sub total</span><span className="tabular-nums text-white">${subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="text-slate-400">Descuento</span>
                  <input type="number" min={0} step={0.01} value={descuento} onChange={(e) => setDescuento(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-white text-right tabular-nums" />
                </div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="text-slate-400">Envío</span>
                  <input type="number" min={0} step={0.01} value={envio} onChange={(e) => setEnvio(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-white text-right tabular-nums" />
                </div>
                <div className="border-t border-white/[0.1] pt-2 mt-2 flex justify-between gap-8 font-semibold text-white">
                  <span>Total</span><span className="tabular-nums">${totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
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
        )}

        <p className="text-slate-500 text-xs mt-3">Vigencia: 7 días{hasLineas ? '' : ` · Anticipo: ${d.anticipoPorcentaje}% ($${d.anticipoMonto?.toFixed(2)})`}</p>
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
