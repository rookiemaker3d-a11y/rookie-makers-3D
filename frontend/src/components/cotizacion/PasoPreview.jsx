import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Card } from '../ui'

const folio = () => `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

export default function PasoPreview({
  wizardData,
  setWizardData,
  desglose,
  lineas = [],
  subTotal = 0,
  descuento = 0,
  envio = 0,
  empaque = 0,
  totalFinal = 0,
  notas,
  setNotas,
  onMasProductos,
  isVendedorVentas = false,
  isAdmin = false,
  vendedores = [],
  vendedorSeleccionadoId,
  onChangeVendedorSeleccionadoId,
}) {
  const cliente = wizardData?.cliente
  const proyecto = wizardData?.proyecto
  const d = desglose || {}
  const hasLineas = Array.isArray(lineas) && lineas.length > 0
  const soloOrdenVendedor = isVendedorVentas && !hasLineas
  const modoProductos = wizardData?.modoProductos || 'unico'
  const kitNombre = wizardData?.kitNombre || ''
  const regaliaMarkupPct = Number(wizardData?.regalia_markup_pct) || 0
  const regaliaVendedorPct = Number(wizardData?.regalia_vendedor_pct) || 0
  const setRegaliaMarkupPct = (v) => setWizardData((prev) => ({ ...prev, regalia_markup_pct: Math.max(0, Number(v) || 0) }))
  const setRegaliaVendedorPct = (v) => setWizardData((prev) => ({ ...prev, regalia_vendedor_pct: Math.max(0, Number(v) || 0) }))

  const descuentoPct = Number(wizardData?.descuento_pct) || 0
  const setDescuentoPct = (v) => {
    const pct = Math.max(0, Math.min(100, Number(v) || 0))
    setWizardData((prev) => ({ ...prev, descuento_pct: pct, descuento: Math.round(subTotal * pct) / 100 }))
  }
  const setDescuento = (v) => setWizardData((prev) => {
    const val = Number(v) || 0
    const pct = subTotal > 0 ? Math.round((val / subTotal) * 10000) / 100 : 0
    return { ...prev, descuento: val, descuento_pct: pct }
  })
  const setEnvio = (v) => setWizardData((prev) => ({ ...prev, envio: Number(v) || 0 }))
  const setEmpaque = (v) => setWizardData((prev) => ({ ...prev, empaque: Number(v) || 0 }))

  const isProductRow = (l) => String(l?.id_producto || '').startsWith('P')
  const productLineas = lineas.filter(isProductRow)
  const extraLineas = lineas.filter((l) => !isProductRow(l))

  const updateWizardLinea = (idProducto, patch) => {
    setWizardData((prev) => ({
      ...prev,
      lineas: (prev.lineas || []).map((x) => (x.id_producto === idProducto ? { ...x, ...patch } : x)),
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold theme-text">Vista previa de cotización</h3>
            <p className="theme-text-dim text-sm mt-0.5">Folio: {folio()}</p>
          </div>
          {onMasProductos && !soloOrdenVendedor && (
            <button type="button" onClick={onMasProductos} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] theme-text-secondary text-sm">
              <Plus className="w-4 h-4" /> Más productos
            </button>
          )}
        </div>

        {isAdmin && Array.isArray(vendedores) && vendedores.length > 0 && typeof onChangeVendedorSeleccionadoId === 'function' && (
          <div className="mb-6 p-4 rounded-xl border bg-white/[0.04]" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold theme-text">Perfil de vendedor para la cotización</h4>
                <p className="theme-text-muted text-sm mt-0.5">Datos bancarios y nombre en el PDF. Elige aquí; en el paso de impresión solo verás la vista previa actualizada.</p>
              </div>
              <select
                value={vendedorSeleccionadoId ?? ''}
                onChange={(e) => onChangeVendedorSeleccionadoId(Number(e.target.value) || null)}
                className="theme-input px-3 py-2 rounded-xl border max-w-md"
              >
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} — {v.correo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="theme-text-dim uppercase tracking-wide mb-1">Cliente</p>
            <p className="theme-text font-medium">{cliente?.nombre ?? '—'}</p>
            <p className="theme-text-muted">{cliente?.correo}</p>
            {cliente?.telefono && <p className="theme-text-muted">{cliente.telefono}</p>}
          </div>
          <div>
            <p className="theme-text-dim uppercase tracking-wide mb-1">Proyecto</p>
            <p className="theme-text font-medium">{proyecto?.nombre ?? '—'}</p>
            <p className="theme-text-muted">{proyecto?.categoria ?? '—'}</p>
          </div>
        </div>

        {soloOrdenVendedor ? (
          <div className="mt-4 space-y-4">
            <p className="theme-text-muted text-sm rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2">
              Orden enviada para cotización. El diseñador asignará el precio del producto y los acabados. Aquí solo se muestran empaque y envío que añadiste.
            </p>
            <div className="flex flex-wrap gap-6 justify-end items-start">
              <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Empaque</span>
                  <input type="number" min={0} step={0.01} value={empaque} onChange={(e) => setEmpaque(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Envío</span>
                  <input type="number" min={0} step={0.01} value={envio} onChange={(e) => setEnvio(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                <div className="border-t border-white/[0.1] pt-2 mt-2 flex justify-between gap-8 font-semibold theme-text">
                  <span>Total (empaque + envío)</span><span className="tabular-nums">${totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : hasLineas ? (
          <>
            <div className="mt-4 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <p className="theme-text-muted text-xs mb-2">¿Cómo se autoriza esta cotización en Productos?</p>
              <div className="flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 text-sm theme-text-secondary cursor-pointer">
                  <input
                    type="radio"
                    name="modoProductos"
                    checked={modoProductos === 'unico'}
                    onChange={() => setWizardData((prev) => ({ ...prev, modoProductos: 'unico' }))}
                  />
                  Producto(s) único(s) (uno por partida)
                </label>
                <label className="flex items-center gap-2 text-sm theme-text-secondary cursor-pointer">
                  <input
                    type="radio"
                    name="modoProductos"
                    checked={modoProductos === 'kit'}
                    onChange={() => setWizardData((prev) => ({ ...prev, modoProductos: 'kit' }))}
                  />
                  Producto grupal (Kit)
                </label>
              </div>
              {modoProductos === 'kit' && (
                <div className="mt-2">
                  <label className="block theme-text-muted text-sm mb-1">Nombre del kit</label>
                  <input
                    value={kitNombre}
                    onChange={(e) => setWizardData((prev) => ({ ...prev, kitNombre: e.target.value }))}
                    placeholder="Ej. Kit separadores de pilas"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim text-sm"
                  />
                </div>
              )}
            </div>
            <div className="overflow-x-auto mt-4">
              <p className="theme-text-muted text-xs mb-2">Productos (lo que verá el cliente en el PDF). Regalías y materiales extra se integran en el precio y aparecen abajo solo para análisis interno.</p>
              <table className="w-full text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-black/40 theme-text">
                    <th className="text-left py-2 px-2 font-medium">ID</th>
                    <th className="text-left py-2 px-2 font-medium">Producto</th>
                    <th className="text-left py-2 px-2 font-medium">Material</th>
                    <th className="text-left py-2 px-2 font-medium">Color</th>
                    <th className="text-right py-2 px-2 font-medium">Horas imp.</th>
                    <th className="text-left py-2 px-2 font-medium">Notas</th>
                    <th className="text-right py-2 px-2 font-medium">Costo u.</th>
                    <th className="text-right py-2 px-2 font-medium">Cant.</th>
                    <th className="text-right py-2 px-2 font-medium">Final</th>
                    <th className="text-right py-2 px-2 font-medium w-20" />
                  </tr>
                </thead>
                <tbody>
                  {productLineas.map((l) => {
                    const id = l.id_producto
                    return (
                      <tr key={id} className="border-b border-white/[0.06]">
                        <td className="py-2 px-2 theme-text-secondary whitespace-nowrap">{id}</td>
                        <td className="py-2 px-2 theme-text">
                          <input
                            value={l.nombre_producto || ''}
                            onChange={(e) => updateWizardLinea(id, { nombre_producto: e.target.value })}
                            className="w-full min-w-[100px] px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 theme-text-muted text-xs">{l.tipo_material || '—'}</td>
                        <td className="py-2 px-2">
                          <input
                            value={l.color_producto || ''}
                            onChange={(e) => updateWizardLinea(id, { color_producto: e.target.value })}
                            placeholder="Ej. Azul petróleo"
                            className="w-full min-w-[100px] px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            value={l.horas_impresion ?? ''}
                            onChange={(e) => updateWizardLinea(id, { horas_impresion: Number(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 theme-text-muted">
                          <input
                            value={l.descripcion || ''}
                            onChange={(e) => updateWizardLinea(id, { descripcion: e.target.value })}
                            className="w-full min-w-[120px] px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text-muted text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={Number(l.costo_unitario ?? 0)}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0
                              setWizardData((prev) => ({
                                ...prev,
                                lineas: (prev.lineas || []).map((x) => {
                                  if (x.id_producto !== id) return x
                                  const cant = Number(x.cantidad ?? 1) || 1
                                  return { ...x, costo_unitario: v, costo_final: Math.round(v * cant * 100) / 100 }
                                }),
                              }))
                            }}
                            className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={Number(l.cantidad ?? 1)}
                            onChange={(e) => {
                              const cant = Math.max(1, Number(e.target.value) || 1)
                              setWizardData((prev) => ({
                                ...prev,
                                lineas: (prev.lineas || []).map((x) => {
                                  if (x.id_producto !== id) return x
                                  const cu = Number(x.costo_unitario ?? 0) || 0
                                  const cb = Number(x.costo_base_unitario ?? 0) || 0
                                  return {
                                    ...x,
                                    cantidad: cant,
                                    costo_final: Math.round(cu * cant * 100) / 100,
                                    costo_base_total: Math.round(cb * cant * 100) / 100,
                                  }
                                }),
                              }))
                            }}
                            className="w-16 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums text-sm"
                          />
                        </td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">${(l.costo_final ?? 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => setWizardData((prev) => ({ ...prev, lineas: (prev.lineas || []).filter((x) => x.id_producto !== id) }))}
                            className="px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 text-xs"
                          >
                            Borrar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {extraLineas.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <p className="theme-text-muted text-xs mb-2">Extras internos (no van como partidas en el PDF del cliente; sí en análisis)</p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-black/30 theme-text-muted">
                      <th className="text-left py-2 px-2 font-medium">ID</th>
                      <th className="text-left py-2 px-2 font-medium">Concepto</th>
                      <th className="text-right py-2 px-2 font-medium">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraLineas.map((l, j) => (
                      <tr key={`${l.id_producto}-${j}`} className="border-b border-white/[0.06]">
                        <td className="py-2 px-2 theme-text-secondary">{l.id_producto}</td>
                        <td className="py-2 px-2 theme-text">{l.nombre_producto}{l.descripcion ? ` — ${l.descripcion}` : ''}</td>
                        <td className="py-2 px-2 text-right tabular-nums theme-text">${(l.costo_final ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap gap-6 mt-4 justify-end items-start">
              <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Regalías (markup %)</span>
                  <input type="number" min={0} step={1} value={regaliaMarkupPct} onChange={(e) => setRegaliaMarkupPct(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Regalías (pago vendedor %)</span>
                  <input type="number" min={0} step={1} value={regaliaVendedorPct} onChange={(e) => setRegaliaVendedorPct(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                <div className="flex justify-between gap-8"><span className="theme-text-muted">Sub total</span><span className="tabular-nums theme-text">${subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Descuento %</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} step={1} value={descuentoPct || ''} onChange={(e) => setDescuentoPct(e.target.value)} className="w-16 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                    <span className="theme-text-dim text-xs">%</span>
                  </div>
                </div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Descuento $</span>
                  <input type="number" min={0} step={0.01} value={descuento} onChange={(e) => setDescuento(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                <div className="flex justify-between gap-8 items-center">
                  <span className="theme-text-muted">Envío</span>
                  <input type="number" min={0} step={0.01} value={envio} onChange={(e) => setEnvio(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                </div>
                {(empaque > 0) && (
                  <div className="flex justify-between gap-8 items-center">
                    <span className="theme-text-muted">Empaque</span>
                    <input type="number" min={0} step={0.01} value={empaque} onChange={(e) => setEmpaque(e.target.value)} className="w-24 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] theme-text text-right tabular-nums" />
                  </div>
                )}
                <div className="border-t border-white/[0.1] pt-2 mt-2 flex justify-between gap-8 font-semibold theme-text">
                  <span>Total</span><span className="tabular-nums">${totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <table className="w-full text-sm mt-4 border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left py-2 theme-text-muted font-medium">Concepto</th>
                <th className="text-right py-2 theme-text-muted font-medium">Monto (MXN)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]"><td className="py-2 theme-text-secondary">Material</td><td className="text-right theme-text tabular-nums">${d.material?.toFixed(2)}</td></tr>
              <tr className="border-b border-white/[0.06]"><td className="py-2 theme-text-secondary">Tiempo máquina</td><td className="text-right theme-text tabular-nums">${d.tiempoMaquina?.toFixed(2)}</td></tr>
              <tr className="border-b border-white/[0.06]"><td className="py-2 theme-text-secondary">Diseño / archivo</td><td className="text-right theme-text tabular-nums">${d.disenoArchivo?.toFixed(2)}</td></tr>
              <tr className="border-b border-white/[0.06]"><td className="py-2 theme-text-secondary">Extras</td><td className="text-right theme-text tabular-nums">${d.extras?.toFixed(2)}</td></tr>
              <tr className="border-t border-white/[0.08]">
                <td className="py-2 font-medium theme-text">Total</td>
                <td className="text-right font-semibold theme-text tabular-nums">${d.precioCliente?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <p className="theme-text-dim text-xs mt-3">Vigencia: 7 días{hasLineas ? '' : ` · Anticipo: ${d.anticipoPorcentaje}% ($${d.anticipoMonto?.toFixed(2)})`}</p>
        <div className="mt-4">
          <label className="block theme-text-muted text-sm mb-1">Notas adicionales</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Condiciones, tiempo de entrega..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim text-sm"
          />
        </div>
      </Card>
    </motion.div>
  )
}

export { folio }
