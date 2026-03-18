import { useEffect, useState, Fragment } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { COTIZADOR_DEFAULTS, EXTRAS_CONFIG } from '../config/cotizador'

const PORCENTAJE_INVERSION_KEY = 'porcentajeInversion'
const defaultPorcentajeInversion = () => {
  try {
    const v = Number(localStorage.getItem(PORCENTAJE_INVERSION_KEY))
    if (!Number.isNaN(v) && v >= 0 && v <= 100) return v
  } catch (_) {}
  return 10
}

export default function Productos() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [importForm, setImportForm] = useState({ descripcion: '', costo_produccion: '', costo_final: '' })
  const [msg, setMsg] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [porcentajeInversion, setPorcentajeInversion] = useState(defaultPorcentajeInversion)

  const isAdmin = user?.role === 'administrador'

  const savePorcentajeInversion = (pct) => {
    const n = Math.min(100, Math.max(0, Number(pct) || 0))
    setPorcentajeInversion(n)
    try { localStorage.setItem(PORCENTAJE_INVERSION_KEY, String(n)) } catch (_) {}
  }

  function load() {
    api('/productos')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await api(`/productos/${id}`, { method: 'DELETE' })
    load()
  }

  const openEdit = (p) => {
    const det = p.detalles || {}
    const extrasObj = det.extras || {}
    const form = {
      gramos: det.gramos ?? 200,
      horasMaquina: det.horasMaquina ?? 0,
      costoPorKg: det.costoPorKg ?? 500,
      costoHoraMaquina: COTIZADOR_DEFAULTS.costoHoraMaquina,
      horasDiseno: det.horasDiseno ?? 0,
      tarifaDiseno: COTIZADOR_DEFAULTS.tarifaDisenoHora,
      correccionSTL: det.correccionSTL ? 1 : 0,
      costoCorreccionSTL: COTIZADOR_DEFAULTS.costoCorreccionSTL,
      horasIngReversa: det.horasIngReversa ?? 0,
      tarifaIngReversa: COTIZADOR_DEFAULTS.tarifaIngenieriaReversaHora,
      margenPorcentaje: det.margenPorcentaje ?? COTIZADOR_DEFAULTS.margenDefault,
      extras: EXTRAS_CONFIG.reduce((acc, ec) => {
        const e = extrasObj[ec.id] || { on: false, valor: ec.defaultCosto, cantidad: 0 }
        acc[ec.id] = { on: !!e.on, valor: e.valor ?? ec.defaultCosto, cantidad: e.cantidad ?? 0 }
        return acc
      }, {}),
    }
    setEditProduct(p)
    setEditForm(form)
  }

  const updateEditForm = (path, value) => {
    if (path.startsWith('extras.')) {
      const [, id, field] = path.split('.')
      setEditForm((f) => ({
        ...f,
        extras: {
          ...f.extras,
          [id]: { ...(f.extras[id] || {}), [field]: value },
        },
      }))
      return
    }
    setEditForm((f) => ({ ...f, [path]: value }))
  }

  const recalcEdit = () => {
    if (!editForm) return { costo_base: 0, costo_final: 0, detalles: {} }
    const material = (editForm.gramos / 1000) * (Number(editForm.costoPorKg) || 0)
    const tiempoMaquina = (Number(editForm.horasMaquina) || 0) * (Number(editForm.costoHoraMaquina) || 0)
    const disenoArchivo = (Number(editForm.horasDiseno) || 0) * (Number(editForm.tarifaDiseno) || 0)
    const correccionSTL = editForm.correccionSTL ? (Number(editForm.costoCorreccionSTL) || 0) : 0
    const ingReversa = (Number(editForm.horasIngReversa) || 0) * (Number(editForm.tarifaIngReversa) || 0)
    let extrasTotal = 0
    Object.entries(editForm.extras || {}).forEach(([id, e]) => {
      if (!e.on) return
      const ec = EXTRAS_CONFIG.find((x) => x.id === id)
      if (ec?.porUnidad) extrasTotal += (e.cantidad || 0) * (Number(e.valor) || 0)
      else extrasTotal += Number(e.valor) || 0
    })
    const costo_base = material + tiempoMaquina + disenoArchivo + correccionSTL + ingReversa + extrasTotal
    const margen = Number(editForm.margenPorcentaje) || 0
    const costo_final = costo_base * (1 + margen / 100)
    const detalles = {
      material: Math.round(material * 100) / 100,
      tiempoMaquina: Math.round(tiempoMaquina * 100) / 100,
      disenoArchivo: Math.round(disenoArchivo * 100) / 100,
      correccionSTL: Math.round(correccionSTL * 100) / 100,
      ingReversa: Math.round(ingReversa * 100) / 100,
      extras: Math.round(extrasTotal * 100) / 100,
      gramos: editForm.gramos,
      horasMaquina: editForm.horasMaquina,
      horasDiseno: editForm.horasDiseno,
      horasIngReversa: editForm.horasIngReversa,
      costoPorKg: editForm.costoPorKg,
      costoHoraMaquina: editForm.costoHoraMaquina,
      margenPorcentaje: editForm.margenPorcentaje,
      extrasDetalle: editForm.extras,
    }
    return { costo_base, costo_final, detalles }
  }

  const saveEdit = async () => {
    if (!editProduct) return
    const { costo_base, costo_final, detalles } = recalcEdit()
    await api(`/productos/${editProduct.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ detalles, costo_base, costo_final }),
    })
    setEditProduct(null)
    setEditForm(null)
    load()
  }

  const saveImported = async (e) => {
    e.preventDefault()
    const costo_base = parseFloat(importForm.costo_produccion)
    const costo_final = parseFloat(importForm.costo_final)
    if (!importForm.descripcion || isNaN(costo_base) || isNaN(costo_final)) {
      setMsg('Completa todos los campos con valores válidos.')
      return
    }
    await api('/productos', {
      method: 'POST',
      body: JSON.stringify({
        descripcion: importForm.descripcion,
        costo_base,
        costo_final,
        cantidad: 1,
        vendedor: 'Importado',
        detalles: {},
      }),
    })
    setImportOpen(false)
    setImportForm({ descripcion: '', costo_produccion: '', costo_final: '' })
    load()
    setMsg('Venta importada.')
  }

  let totalCosto = 0
  let totalVenta = 0
  items.forEach((p) => {
    totalCosto += p.costo_base || 0
    totalVenta += p.costo_final || 0
  })
  const ganancia = totalVenta - totalCosto
  const inversion = ganancia * (porcentajeInversion / 100)
  const gananciaQueQueda = ganancia - inversion

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Productos autorizados"
        subtitle="Ventas importadas y autorizadas. Ver análisis para desglose de costos; editar horas/gramos/extras para recalcular."
        action={isAdmin && (
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary hover:opacity-95 text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Importar venta
          </button>
        )}
      />
      {msg && <p className="theme-text-muted text-sm">{msg}</p>}
      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 theme-text-muted font-medium w-8"></th>
              <th className="p-3 theme-text-muted font-medium">ID</th>
              <th className="p-3 theme-text-muted font-medium">Descripción</th>
              <th className="p-3 theme-text-muted font-medium">Costo prod.</th>
              <th className="p-3 theme-text-muted font-medium">Costo final</th>
              <th className="p-3 theme-text-muted font-medium">Ganancia</th>
              {isAdmin && <th className="p-3 theme-text-muted font-medium w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const gan = (p.costo_final || 0) - (p.costo_base || 0)
              const det = p.detalles || {}
              const isExpanded = expandedId === p.id
              return (
                <Fragment key={p.id}>
                  <tr className="border-b hover:bg-[var(--theme-table-row-hover)]">
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="p-1 rounded hover:bg-white/10 theme-text-muted hover:theme-text"
                        aria-label={isExpanded ? 'Cerrar análisis' : 'Ver análisis'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3 theme-text tabular-nums">{p.id}</td>
                    <td className="p-3 theme-text">{p.descripcion}</td>
                    <td className="p-3 theme-text tabular-nums">${(p.costo_base || 0).toFixed(2)}</td>
                    <td className="p-3 theme-text tabular-nums">${(p.costo_final || 0).toFixed(2)}</td>
                    <td className="p-3 text-emerald-600 font-medium tabular-nums">${gan.toFixed(2)}</td>
                    {isAdmin && (
                      <td className="p-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 text-sm"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => deleteOne(p.id)}
                          className="inline-flex items-center gap-1 p-1 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-1"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <tr key={`${p.id}-analisis`}>
                      <td colSpan={isAdmin ? 7 : 6} className="p-0 bg-white/[0.02]">
                        <div className="p-4 border-t border-white/[0.06]">
                          <h4 className="text-xs font-semibold theme-text-muted uppercase tracking-wide mb-3">Análisis de costos</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Material</span>
                              <span className="theme-text font-mono">${(det.material ?? 0).toFixed(2)}</span>
                              {det.gramos != null && <span className="theme-text-dim text-xs block">{det.gramos} g</span>}
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Tiempo máquina</span>
                              <span className="theme-text font-mono">${(det.tiempoMaquina ?? 0).toFixed(2)}</span>
                              {det.horasMaquina != null && <span className="theme-text-dim text-xs block">{det.horasMaquina} h</span>}
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Diseño / archivo</span>
                              <span className="theme-text font-mono">${(det.disenoArchivo ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Extras</span>
                              <span className="theme-text font-mono">${(det.extras ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Costo base</span>
                              <span className="theme-text font-semibold">${(p.costo_base ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                              <span className="theme-text-muted block text-xs">Costo final</span>
                              <span className="text-emerald-500 font-semibold">${(p.costo_final ?? 0).toFixed(2)}</span>
                            </div>
                          </div>
                          {det.extrasDetalle && Object.keys(det.extrasDetalle).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06]">
                              <span className="theme-text-muted text-xs block mb-2">Extras aplicados</span>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(det.extrasDetalle).map(([id, e]) => {
                                  if (!e.on) return null
                                  const ec = EXTRAS_CONFIG.find((x) => x.id === id)
                                  const label = ec?.label || id
                                  const val = ec?.porUnidad ? (e.cantidad || 0) * (e.valor || 0) : (e.valor || 0)
                                  return (
                                    <span key={id} className="px-2 py-1 rounded bg-white/[0.06] text-xs theme-text">
                                      {label}: ${Number(val).toFixed(2)}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="theme-text-muted">Total costo: <strong className="theme-text tabular-nums">${totalCosto.toFixed(2)}</strong></span>
          <span className="theme-text-muted">Total venta: <strong className="theme-text tabular-nums">${totalVenta.toFixed(2)}</strong></span>
          <span className={ganancia >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>Ganancia neta: <strong className="tabular-nums">${ganancia.toFixed(2)}</strong></span>
          <label className="flex items-center gap-2 theme-text-muted">
            % inversión
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={porcentajeInversion}
              onChange={(e) => savePorcentajeInversion(e.target.value)}
              className="w-16 px-2 py-1 rounded border theme-input text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="theme-text-muted">Inversión ({porcentajeInversion}%): <strong className="theme-text tabular-nums">${inversion.toFixed(2)}</strong></span>
          <span className={gananciaQueQueda >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>Ganancia que te queda: <strong className="tabular-nums">${gananciaQueQueda.toFixed(2)}</strong></span>
        </div>
      </div>

      {importOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border-2 theme-border theme-bg-card backdrop-blur-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold theme-text mb-4">Importar venta</h2>
            <form onSubmit={saveImported} className="space-y-3">
              <input
                placeholder="Descripción"
                value={importForm.descripcion}
                onChange={(e) => setImportForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[var(--theme-focus-ring)]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo de producción"
                value={importForm.costo_produccion}
                onChange={(e) => setImportForm((f) => ({ ...f, costo_produccion: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[var(--theme-focus-ring)]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo final de venta"
                value={importForm.costo_final}
                onChange={(e) => setImportForm((f) => ({ ...f, costo_final: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-[var(--theme-focus-ring)]"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 rounded-xl btn-primary font-medium">Guardar</button>
                <button type="button" onClick={() => setImportOpen(false)} className="px-4 py-2 rounded-xl btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editProduct && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-2xl border-2 theme-border theme-bg-card backdrop-blur-xl p-6 w-full max-w-2xl shadow-xl my-8">
            <h2 className="text-lg font-bold theme-text mb-2">Editar costos · {editProduct.descripcion}</h2>
            <p className="text-sm theme-text-muted mb-4">Modifica gramos, horas o extras; el costo se actualiza al guardar.</p>
            {(() => {
              const { costo_base, costo_final } = recalcEdit()
              return (
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div><span className="theme-text-muted text-xs">Costo base</span><p className="theme-text font-mono font-semibold">${costo_base.toFixed(2)}</p></div>
                  <div><span className="theme-text-muted text-xs">Costo final (con margen)</span><p className="text-emerald-500 font-mono font-semibold">${costo_final.toFixed(2)}</p></div>
                </div>
              )
            })()}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Gramos</label>
                  <input type="number" min={0} value={editForm.gramos} onChange={(e) => updateEditForm('gramos', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Costo por kg ($)</label>
                  <input type="number" min={0} value={editForm.costoPorKg} onChange={(e) => updateEditForm('costoPorKg', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Horas máquina</label>
                  <input type="number" min={0} step={0.25} value={editForm.horasMaquina} onChange={(e) => updateEditForm('horasMaquina', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Costo hora máquina ($)</label>
                  <input type="number" min={0} value={editForm.costoHoraMaquina} onChange={(e) => updateEditForm('costoHoraMaquina', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Horas diseño</label>
                  <input type="number" min={0} step={0.5} value={editForm.horasDiseno} onChange={(e) => updateEditForm('horasDiseno', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Tarifa diseño ($/h)</label>
                  <input type="number" min={0} value={editForm.tarifaDiseno} onChange={(e) => updateEditForm('tarifaDiseno', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!editForm.correccionSTL} onChange={(e) => updateEditForm('correccionSTL', e.target.checked ? 1 : 0)} className="rounded border-white/20" />
                    <span className="text-xs theme-text-muted">Corrección STL</span>
                  </label>
                  <input type="number" min={0} value={editForm.costoCorreccionSTL} onChange={(e) => updateEditForm('costoCorreccionSTL', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg mt-1" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Horas ing. reversa</label>
                  <input type="number" min={0} step={0.5} value={editForm.horasIngReversa} onChange={(e) => updateEditForm('horasIngReversa', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Margen %</label>
                  <input type="number" min={0} max={200} value={editForm.margenPorcentaje} onChange={(e) => updateEditForm('margenPorcentaje', Number(e.target.value) || 0)} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold theme-text mb-2">Extras</h4>
                <div className="space-y-2">
                  {EXTRAS_CONFIG.map((ec) => {
                    const e = editForm.extras[ec.id] || { on: false, valor: ec.defaultCosto, cantidad: 0 }
                    return (
                      <div key={ec.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[180px]">
                          <input type="checkbox" checked={!!e.on} onChange={(ev) => updateEditForm(`extras.${ec.id}.on`, ev.target.checked)} className="rounded border-white/20" />
                          <span className="text-sm theme-text">{ec.label}</span>
                        </label>
                        {e.on && (
                          <>
                            {ec.porUnidad ? (
                              <>
                                <input type="number" min={0} placeholder="Cant" value={e.cantidad} onChange={(ev) => updateEditForm(`extras.${ec.id}.cantidad`, Number(ev.target.value) || 0)} className="theme-input w-16 px-2 py-1 rounded text-sm" />
                                <span className="theme-text-muted text-sm">×</span>
                                <input type="number" min={0} placeholder="$" value={e.valor} onChange={(ev) => updateEditForm(`extras.${ec.id}.valor`, Number(ev.target.value) || 0)} className="theme-input w-20 px-2 py-1 rounded text-sm" />
                              </>
                            ) : (
                              <input type="number" min={0} placeholder="$" value={e.valor} onChange={(ev) => updateEditForm(`extras.${ec.id}.valor`, Number(ev.target.value) || 0)} className="theme-input w-24 px-2 py-1 rounded text-sm" />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4 mt-4 border-t theme-border">
              <button type="button" onClick={saveEdit} className="px-4 py-2 rounded-xl btn-primary font-medium">Guardar y actualizar costo</button>
              <button type="button" onClick={() => { setEditProduct(null); setEditForm(null) }} className="px-4 py-2 rounded-xl btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
