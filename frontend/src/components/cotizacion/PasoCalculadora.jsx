import { motion } from 'framer-motion'
import { Plus, ArrowRight } from 'lucide-react'
import { Card } from '../ui'
import { useEffect, useMemo, useState } from 'react'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]'

export default function PasoCalculadora({ cotizador, wizardData = {}, setWizardData, onNext, soloResumen = false, api }) {
  if (!cotizador) return null
  const lineas = wizardData.lineas || []
  const proyectoNombre = wizardData.proyecto?.nombre || 'Producto'
  const nombreProductoDraft = (wizardData?.productoNombreDraft ?? proyectoNombre).toString()
  const descuento = Number(wizardData.descuento) || 0
  const round2 = (n) => Math.round((n ?? 0) * 100) / 100
  const addProduct = () => {
    const d = cotizador.desglose
    const costoBaseUnit = Number(d.costoTotal) || 0
    const costoUnit = Number(d.precioCliente) || 0
    const cantidad = 1
    const id = `P${String(lineas.length + 1).padStart(3, '0')}`
    const nombreProducto = (nombreProductoDraft || proyectoNombre).trim() || proyectoNombre
    setWizardData((prev) => ({
      ...prev,
      lineas: [
        ...(prev.lineas || []),
        {
          id_producto: id,
          nombre_producto: nombreProducto,
          descripcion: 'Impresión',
          costo_base_unitario: round2(costoBaseUnit),
          costo_unitario: costoUnit,
          cantidad,
          costo_base_total: round2(costoBaseUnit * cantidad),
          costo_final: round2(costoUnit * cantidad),
        },
      ],
    }))
  }

  const {
    config,
    MATERIALES,
    EXTRAS_CONFIG,
    materialId,
    setMaterialId,
    material,
    gramos,
    setGramos,
    materialEspecial,
    setMaterialEspecial,
    materialEspecialCosto,
    setMaterialEspecialCosto,
    horasMaquina,
    setHorasMaquina,
    requiereDiseno,
    setRequiereDiseno,
    horasDiseno,
    setHorasDiseno,
    requiereCorreccionSTL,
    setRequiereCorreccionSTL,
    requiereIngenieriaReversa,
    setRequiereIngenieriaReversa,
    horasIngenieria,
    setHorasIngenieria,
    extras,
    updateExtra,
    margenPorcentaje,
    setMargenPorcentaje,
    costoMaterial,
    costoTiempoMaquina,
    costoDisenoYArchivo,
    costoExtras,
    costoTotal,
    precioCliente,
    ganancia,
    anticipoMonto,
    desglose,
  } = cotizador

  // ─── Inventario extra (tira LED, focos, etc.) ──────────────────────────────
  const [inventario, setInventario] = useState([])
  const [invSelId, setInvSelId] = useState('')
  const [invQty, setInvQty] = useState('')

  useEffect(() => {
    if (!api || soloResumen) return
    api('/inventario')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInventario(Array.isArray(data) ? data : []))
      .catch(() => setInventario([]))
  }, [api, soloResumen])

  const invById = useMemo(() => {
    const map = new Map()
    inventario.forEach((it) => map.set(String(it.id), it))
    return map
  }, [inventario])

  const materialesExtra = Array.isArray(wizardData.materiales_extra) ? wizardData.materiales_extra : []
  const addInventarioExtra = () => {
    const it = invById.get(String(invSelId))
    const qty = Number(invQty)
    if (!it || !Number.isFinite(qty) || qty <= 0) return
    const unitCost = Number(it.costo_unitario ?? 0) || 0
    const costoTotal = round2(unitCost * qty)
    setWizardData((prev) => ({
      ...prev,
      materiales_extra: [
        ...(Array.isArray(prev.materiales_extra) ? prev.materiales_extra : []),
        {
          inventario_id: it.id,
          nombre: it.nombre,
          unidad: it.unidad || 'pza',
          cantidad: qty,
          costo_unitario: unitCost,
          costo_total: costoTotal,
        },
      ],
    }))
    setInvQty('')
  }

  const removeInventarioExtra = (idx) => {
    setWizardData((prev) => ({
      ...prev,
      materiales_extra: (Array.isArray(prev.materiales_extra) ? prev.materiales_extra : []).filter((_, i) => i !== idx),
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      <div className="flex-1 space-y-6 min-w-0">
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold theme-text">Nombre del producto</h3>
            <p className="theme-text-dim text-xs mt-0.5">Puedes cotizar varias piezas con nombres distintos</p>
          </div>
          <div className="pt-2">
            <input
              value={nombreProductoDraft}
              onChange={(e) => setWizardData((prev) => ({ ...prev, productoNombreDraft: e.target.value }))}
              placeholder="Ej. Separador de pilas"
              className={inputClass}
            />
            <p className="theme-text-dim text-xs mt-1">Tip: el nombre del Paso 2 se usa como sugerencia, pero aquí lo puedes cambiar por cada producto.</p>
          </div>
        </Card>
        {/* A — Material */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold theme-text">Material de impresión</h3>
            <p className="theme-text-dim text-xs mt-0.5">Costo por kg y gramos estimados</p>
          </div>
          <div className="space-y-3 pt-2">
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className={`${inputClass} theme-input`}
              aria-label="Material de impresión"
            >
              {MATERIALES.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} — ${m.costoPorKg}/kg</option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={materialEspecial}
                onChange={(e) => setMaterialEspecial(e.target.checked)}
                className="rounded border-white/20"
              />
              <span className="theme-text-muted text-sm">Material especial o premium (costo manual)</span>
            </label>
            {materialEspecial ? (
              <input
                type="number"
                min={0}
                step={0.01}
                value={materialEspecialCosto || ''}
                onChange={(e) => setMaterialEspecialCosto(Number(e.target.value) || 0)}
                placeholder="Costo en MXN"
                className={inputClass}
              />
            ) : (
              <div>
                <label className="theme-text-muted text-sm">Gramos estimados</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={gramos || ''}
                  onChange={(e) => setGramos(Number(e.target.value) || 0)}
                  className={inputClass}
                />
                <p className="theme-text-dim text-xs mt-1">
                  Costo = (gramos/1000) × ${material?.costoPorKg ?? 500}/kg
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Inventario (consumibles) */}
        {!soloResumen && (
          <Card>
            <div className="border-b border-white/[0.08] pb-3 mb-3">
              <h3 className="text-sm font-semibold theme-text">Materiales / consumibles (Inventario)</h3>
              <p className="theme-text-dim text-xs mt-0.5">Ej. tira LED (m), plástico para tira LED (m), focos, socket. Se suman al total.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[220px]">
                <label className="block theme-text-muted text-xs mb-1">Ítem</label>
                <select value={invSelId} onChange={(e) => setInvSelId(e.target.value)} className={`${inputClass} theme-input`}>
                  <option value="">Selecciona…</option>
                  {inventario.map((it) => (
                    <option key={it.id} value={String(it.id)}>
                      {it.nombre} — ${Number(it.costo_unitario ?? 0).toFixed(2)}/{it.unidad || 'pza'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block theme-text-muted text-xs mb-1">Cantidad</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={invQty}
                  onChange={(e) => setInvQty(e.target.value)}
                  placeholder={invById.get(String(invSelId))?.unidad === 'm' ? 'metros' : 'pzas'}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={addInventarioExtra}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {materialesExtra.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-black/40 theme-text">
                      <th className="text-left py-2 px-2 font-medium">Ítem</th>
                      <th className="text-right py-2 px-2 font-medium">Costo</th>
                      <th className="text-right py-2 px-2 font-medium">Cantidad</th>
                      <th className="text-right py-2 px-2 font-medium">Total</th>
                      <th className="text-right py-2 px-2 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialesExtra.map((m, i) => (
                      <tr key={i} className="border-b border-white/[0.06]">
                        <td className="py-2 px-2 theme-text">{m.nombre}</td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">${Number(m.costo_unitario ?? 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">{Number(m.cantidad ?? 0)} {m.unidad || ''}</td>
                        <td className="py-2 px-2 text-right theme-text tabular-nums">${Number(m.costo_total ?? 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">
                          <button type="button" onClick={() => removeInventarioExtra(i)} className="px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 text-xs">Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* B — Tiempo máquina */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold theme-text">Tiempo de máquina</h3>
            <p className="theme-text-dim text-xs mt-0.5">${config.costoHoraMaquina} MXN/hr</p>
          </div>
          <div className="space-y-3 pt-2">
            <input
              type="number"
              min={0}
              step={0.25}
              value={horasMaquina || ''}
              onChange={(e) => setHorasMaquina(Number(e.target.value) || 0)}
              placeholder="Ej: 6.5 = 6 h 30 min"
              className={inputClass}
            />
            <p className="theme-text-dim text-xs mt-1">Usa decimales: 6:30 h = 6.5</p>
          </div>
        </Card>

        {/* C — Diseño y corrección */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold theme-text">Diseño y corrección</h3>
            <p className="theme-text-dim text-xs mt-0.5">Diseño, STL e ingeniería reversa</p>
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between gap-4">
              <span className="theme-text-secondary text-sm">¿Requiere diseño desde cero?</span>
              <input
                type="checkbox"
                checked={requiereDiseno}
                onChange={(e) => setRequiereDiseno(e.target.checked)}
                className="rounded border-white/20"
              />
            </label>
            {requiereDiseno && (
              <input
                type="number"
                min={0}
                step={0.5}
                value={horasDiseno || ''}
                onChange={(e) => setHorasDiseno(Number(e.target.value) || 0)}
                placeholder={`Horas × $${config.tarifaDisenoHora}/hr`}
                className={inputClass}
              />
            )}
            <label className="flex items-center justify-between gap-4">
              <span className="theme-text-secondary text-sm">¿Requiere corrección de STL?</span>
              <input
                type="checkbox"
                checked={requiereCorreccionSTL}
                onChange={(e) => setRequiereCorreccionSTL(e.target.checked)}
                className="rounded border-white/20"
              />
            </label>
            {requiereCorreccionSTL && (
              <p className="theme-text-dim text-xs">Costo fijo: ${config.costoCorreccionSTL} MXN</p>
            )}
            <label className="flex items-center justify-between gap-4">
              <span className="theme-text-secondary text-sm">¿Requiere ingeniería reversa?</span>
              <input
                type="checkbox"
                checked={requiereIngenieriaReversa}
                onChange={(e) => setRequiereIngenieriaReversa(e.target.checked)}
                className="rounded border-white/20"
              />
            </label>
            {requiereIngenieriaReversa && (
              <input
                type="number"
                min={0}
                step={0.5}
                value={horasIngenieria || ''}
                onChange={(e) => setHorasIngenieria(Number(e.target.value) || 0)}
                placeholder={`Horas × $${config.tarifaIngenieriaReversaHora}/hr`}
                className={inputClass}
              />
            )}
          </div>
        </Card>

        {/* D — Extras */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold theme-text">Extras y acabados</h3>
            <p className="theme-text-dim text-xs mt-0.5">Cada concepto con su costo</p>
          </div>
          <div className="space-y-3 pt-2">
            {EXTRAS_CONFIG.map((ec) => {
              const e = extras[ec.id] || { on: false, valor: ec.defaultCosto, cantidad: 0 }
              return (
                <label
                  key={ec.id}
                  className="flex flex-wrap items-center gap-3 py-2 border-b border-white/[0.06] last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={!!e.on}
                    onChange={(ev) => updateExtra(ec.id, { on: ev.target.checked })}
                    className="rounded border-white/20"
                  />
                  <span className="theme-text-secondary text-sm flex-1 min-w-0">{ec.label}</span>
                  {ec.porUnidad ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        value={e.cantidad ?? 0}
                        onChange={(ev) => updateExtra(ec.id, { cantidad: Number(ev.target.value) || 0 })}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] theme-text text-sm"
                      />
                      <span className="theme-text-dim">×</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={e.valor ?? ''}
                        onChange={(ev) => updateExtra(ec.id, { valor: Number(ev.target.value) || 0 })}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] theme-text text-sm"
                      />
                      <span className="theme-text-dim text-xs">MXN</span>
                    </>
                  ) : (
                    <>
                      <span className="theme-text-dim text-xs">+</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={e.valor ?? ''}
                        onChange={(ev) => updateExtra(ec.id, { valor: Number(ev.target.value) || 0 })}
                        className="w-24 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] theme-text text-sm"
                      />
                      <span className="theme-text-dim text-xs">MXN</span>
                    </>
                  )}
                </label>
              )
            })}
          </div>
        </Card>
      </div>

      {/* E — Resumen sticky */}
      <div className="lg:w-80 shrink-0">
        <div className="lg:sticky lg:top-24">
          <Card>
            <div className="border-b border-white/[0.08] pb-3 mb-3">
              <h3 className="text-sm font-semibold theme-text">Resumen</h3>
              <p className="theme-text-dim text-xs mt-0.5">Precio en tiempo real</p>
            </div>
            <div className="space-y-2 text-sm">
              {!soloResumen && (
                <>
                  <div className="flex justify-between theme-text-muted">
                    <span>Material</span>
                    <span className="tabular-nums theme-text">${costoMaterial.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between theme-text-muted">
                    <span>Tiempo máquina</span>
                    <span className="tabular-nums theme-text">${costoTiempoMaquina.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between theme-text-muted">
                    <span>Diseño / archivo</span>
                    <span className="tabular-nums theme-text">${costoDisenoYArchivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between theme-text-muted">
                    <span>Extras</span>
                    <span className="tabular-nums theme-text">${costoExtras.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/[0.08] pt-2 mt-2 flex justify-between font-medium theme-text">
                    <span>COSTO TOTAL</span>
                    <span className="tabular-nums">${costoTotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    <label className="theme-text-muted text-xs">Margen deseado (%)</label>
                    <input
                      type="range"
                      min={config.margenMin}
                      max={config.margenMax}
                      value={margenPorcentaje}
                      onChange={(e) => setMargenPorcentaje(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                    <p className="theme-text-dim text-xs mt-0.5">{margenPorcentaje}%</p>
                  </div>
                </>
              )}
              <div className="border-t border-white/[0.08] pt-2 mt-2 flex justify-between font-semibold theme-text">
                <span>PRECIO CLIENTE</span>
                <span className="tabular-nums">${precioCliente.toFixed(2)}</span>
              </div>
              {soloResumen && descuento > 0 && (
                <div className="flex justify-between theme-text-muted">
                  <span>Descuento</span>
                  <span className="tabular-nums theme-text">${descuento.toFixed(2)}</span>
                </div>
              )}
              {!soloResumen && (
                <div className="flex justify-between text-emerald-400">
                  <span>Ganancia</span>
                  <span className="tabular-nums">${ganancia.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between theme-text-muted">
                <span>Anticipo ({config.anticipoPorcentaje}%)</span>
                <span className="tabular-nums theme-text">${anticipoMonto.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-3 mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] theme-text text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Añadir producto a la cotización
                </button>
                {lineas.length > 0 && onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 theme-text text-sm font-medium"
                  >
                    Siguiente (ver tabla)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {lineas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.08]">
                  <p className="theme-text-muted text-xs mb-2">Partidas añadidas: {lineas.length}</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {lineas.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs theme-text-secondary">
                        <span>{l.id_producto} – {l.nombre_producto}</span>
                        <span className="tabular-nums">${(l.costo_final || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="theme-text-dim text-xs mt-1">Más productos: completa la calculadora arriba y pulsa «Añadir producto».</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
