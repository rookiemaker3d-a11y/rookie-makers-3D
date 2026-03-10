import { motion } from 'framer-motion'
import { Card } from '../ui'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]'

export default function PasoCalculadora({ cotizador }) {
  if (!cotizador) return null

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      <div className="flex-1 space-y-6 min-w-0">
        {/* A — Material */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold text-white">Material de impresión</h3>
            <p className="text-slate-500 text-xs mt-0.5">Costo por kg y gramos estimados</p>
          </div>
          <div className="space-y-3 pt-2">
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className={inputClass}
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
              <span className="text-slate-400 text-sm">Material especial o premium (costo manual)</span>
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
                <label className="text-slate-400 text-sm">Gramos estimados</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={gramos || ''}
                  onChange={(e) => setGramos(Number(e.target.value) || 0)}
                  className={inputClass}
                />
                <p className="text-slate-500 text-xs mt-1">
                  Costo = (gramos/1000) × ${material?.costoPorKg ?? 500}/kg
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* B — Tiempo máquina */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold text-white">Tiempo de máquina</h3>
            <p className="text-slate-500 text-xs mt-0.5">${config.costoHoraMaquina} MXN/hr</p>
          </div>
          <div className="space-y-3 pt-2">
            <input
              type="number"
              min={0}
              step={0.25}
              value={horasMaquina || ''}
              onChange={(e) => setHorasMaquina(Number(e.target.value) || 0)}
              placeholder="Horas estimadas"
              className={inputClass}
            />
          </div>
        </Card>

        {/* C — Diseño y corrección */}
        <Card>
          <div className="border-b border-white/[0.08] pb-3 mb-3">
            <h3 className="text-sm font-semibold text-white">Diseño y corrección</h3>
            <p className="text-slate-500 text-xs mt-0.5">Diseño, STL e ingeniería reversa</p>
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between gap-4">
              <span className="text-slate-300 text-sm">¿Requiere diseño desde cero?</span>
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
              <span className="text-slate-300 text-sm">¿Requiere corrección de STL?</span>
              <input
                type="checkbox"
                checked={requiereCorreccionSTL}
                onChange={(e) => setRequiereCorreccionSTL(e.target.checked)}
                className="rounded border-white/20"
              />
            </label>
            {requiereCorreccionSTL && (
              <p className="text-slate-500 text-xs">Costo fijo: ${config.costoCorreccionSTL} MXN</p>
            )}
            <label className="flex items-center justify-between gap-4">
              <span className="text-slate-300 text-sm">¿Requiere ingeniería reversa?</span>
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
            <h3 className="text-sm font-semibold text-white">Extras y acabados</h3>
            <p className="text-slate-500 text-xs mt-0.5">Cada concepto con su costo</p>
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
                  <span className="text-slate-300 text-sm flex-1 min-w-0">{ec.label}</span>
                  {ec.porUnidad ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        value={e.cantidad ?? 0}
                        onChange={(ev) => updateExtra(ec.id, { cantidad: Number(ev.target.value) || 0 })}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm"
                      />
                      <span className="text-slate-500">×</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={e.valor ?? ''}
                        onChange={(ev) => updateExtra(ec.id, { valor: Number(ev.target.value) || 0 })}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm"
                      />
                      <span className="text-slate-500 text-xs">MXN</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 text-xs">+</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={e.valor ?? ''}
                        onChange={(ev) => updateExtra(ec.id, { valor: Number(ev.target.value) || 0 })}
                        className="w-24 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white text-sm"
                      />
                      <span className="text-slate-500 text-xs">MXN</span>
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
              <h3 className="text-sm font-semibold text-white">Resumen</h3>
              <p className="text-slate-500 text-xs mt-0.5">Precio en tiempo real</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Material</span>
                <span className="tabular-nums text-white">${costoMaterial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tiempo máquina</span>
                <span className="tabular-nums text-white">${costoTiempoMaquina.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Diseño / archivo</span>
                <span className="tabular-nums text-white">${costoDisenoYArchivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Extras</span>
                <span className="tabular-nums text-white">${costoExtras.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 mt-2 flex justify-between font-medium text-white">
                <span>COSTO TOTAL</span>
                <span className="tabular-nums">${costoTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2">
                <label className="text-slate-400 text-xs">Margen deseado (%)</label>
                <input
                  type="range"
                  min={config.margenMin}
                  max={config.margenMax}
                  value={margenPorcentaje}
                  onChange={(e) => setMargenPorcentaje(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <p className="text-slate-500 text-xs mt-0.5">{margenPorcentaje}%</p>
              </div>
              <div className="border-t border-white/[0.08] pt-2 mt-2 flex justify-between font-semibold text-white">
                <span>PRECIO CLIENTE</span>
                <span className="tabular-nums">${precioCliente.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Ganancia</span>
                <span className="tabular-nums">${ganancia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Anticipo ({config.anticipoPorcentaje}%)</span>
                <span className="tabular-nums text-white">${anticipoMonto.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
