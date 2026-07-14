import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Globe, Save, Plus, Trash2, RefreshCw } from 'lucide-react'

const emptyRow = () => ({
  id: `mat_${Date.now()}`,
  name: 'Nuevo material',
  costoPorKg: 300,
  type: 'FDM',
})

export default function EditorPaginaPublica() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [rows, setRows] = useState([])

  const load = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const res = await api('/pagina-publica/landing')
      if (!res.ok) throw new Error('No se pudo cargar la landing')
      const data = await res.json()
      const list = Array.isArray(data.calculatorMaterials) ? data.calculatorMaterials : []
      setRows(
        list.length
          ? list.map((r) => ({
              id: String(r.id ?? ''),
              name: String(r.name ?? ''),
              costoPorKg: Number(r.costoPorKg) || 0,
              type: r.type === 'SLA' ? 'SLA' : 'FDM',
            }))
          : [emptyRow()],
      )
    } catch (e) {
      setErr(e.message || 'Error')
      setRows([emptyRow()])
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  const updateRow = (i, patch) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }

  const save = async () => {
    setErr('')
    setMsg('')
    const calculatorMaterials = rows
      .filter((r) => r.id.trim() && r.name.trim() && r.costoPorKg > 0)
      .map((r) => ({
        id: r.id.trim(),
        name: r.name.trim(),
        costoPorKg: Number(r.costoPorKg),
        type: r.type === 'SLA' ? 'SLA' : 'FDM',
      }))
    if (!calculatorMaterials.length) {
      setErr('Añade al menos un material con id, nombre y costo > 0.')
      return
    }
    setSaving(true)
    try {
      const res = await api('/pagina-publica/landing', {
        method: 'PUT',
        body: JSON.stringify({ calculatorMaterials }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(typeof d.detail === 'string' ? d.detail : 'No autorizado o error al guardar')
      }
      setMsg('Guardado. La web pública cargará estos costos al abrir la calculadora (misma API /api).')
    } catch (e) {
      setErr(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Página pública — calculadora"
        subtitle="Los costos por kg (MXN) y tipo FDM/SLA se usan en la calculadora de la web. Alinea con Inventario → costos de filamentos si quieres coherencia con cotizaciones internas."
      />

      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Globe className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-medium">Materiales visibles en rookiemakers3d.com (sección cotizador)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              type="button"
              onClick={() => setRows((r) => [...r, emptyRow()])}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/15"
            >
              <Plus className="w-4 h-4" />
              Fila
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar en servidor'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm theme-text-muted">Cargando…</p>
        ) : (
          <div className="overflow-x-auto theme-table rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 font-semibold">Id (clave)</th>
                  <th className="p-3 font-semibold">Nombre</th>
                  <th className="p-3 font-semibold">$/kg MXN</th>
                  <th className="p-3 font-semibold">Tipo</th>
                  <th className="p-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`row-${i}`} className="border-b border-white/5">
                    <td className="p-2">
                      <input
                        value={row.id}
                        onChange={(e) => updateRow(i, { id: e.target.value })}
                        className="w-full min-w-[100px] px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm"
                        placeholder="pla_plus"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        className="w-full min-w-[120px] px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm"
                        placeholder="PLA+"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={row.costoPorKg}
                        onChange={(e) => updateRow(i, { costoPorKg: Number(e.target.value) || 0 })}
                        className="w-28 px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(i, { type: e.target.value })}
                        className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-sm"
                      >
                        <option value="FDM">FDM (infill)</option>
                        <option value="SLA">SLA</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        aria-label="Eliminar fila"
                        onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
