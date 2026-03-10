import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Trash2 } from 'lucide-react'

export default function Productos() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [importForm, setImportForm] = useState({ descripcion: '', costo_produccion: '', costo_final: '' })
  const [msg, setMsg] = useState('')

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
    const costoProd = p.costo_base || 0
    const costoEnv = (p.detalles && p.detalles.costo_envio) || 0
    totalCosto += costoProd
    totalVenta += p.costo_final || 0
  })
  const ganancia = totalVenta - totalCosto

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Productos autorizados"
        subtitle="Ventas importadas y autorizadas"
        action={
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Importar venta
          </button>
        }
      />
      {msg && <p className="text-slate-400 text-sm">{msg}</p>}
      <Card padding={false} className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="p-3 text-slate-400 font-medium">ID</th>
              <th className="p-3 text-slate-400 font-medium">Descripción</th>
              <th className="p-3 text-slate-400 font-medium">Costo prod.</th>
              <th className="p-3 text-slate-400 font-medium">Costo final</th>
              <th className="p-3 text-slate-400 font-medium">Ganancia</th>
              <th className="p-3 text-slate-400 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const gan = (p.costo_final || 0) - (p.costo_base || 0)
              return (
                <tr key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="p-3 text-slate-300 tabular-nums">{p.id}</td>
                  <td className="p-3 text-white">{p.descripcion}</td>
                  <td className="p-3 text-white tabular-nums">${(p.costo_base || 0).toFixed(2)}</td>
                  <td className="p-3 text-white tabular-nums">${(p.costo_final || 0).toFixed(2)}</td>
                  <td className="p-3 text-emerald-400 tabular-nums">${gan.toFixed(2)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteOne(p.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition flex items-center gap-1"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div className="flex flex-wrap gap-6 text-sm">
        <span className="text-slate-400">Total costo: <strong className="text-white tabular-nums">${totalCosto.toFixed(2)}</strong></span>
        <span className="text-slate-400">Total venta: <strong className="text-white tabular-nums">${totalVenta.toFixed(2)}</strong></span>
        <span className={ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}>Ganancia neta: <strong className="tabular-nums">${ganancia.toFixed(2)}</strong></span>
      </div>

      {importOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/95 backdrop-blur-xl p-6 w-full max-w-md shadow-[0_4px_24px_rgba(79,142,247,0.12)]">
            <h2 className="text-lg font-bold text-white mb-4">Importar venta</h2>
            <form onSubmit={saveImported} className="space-y-3">
              <input
                placeholder="Descripción"
                value={importForm.descripcion}
                onChange={(e) => setImportForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo de producción"
                value={importForm.costo_produccion}
                onChange={(e) => setImportForm((f) => ({ ...f, costo_produccion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo final de venta"
                value={importForm.costo_final}
                onChange={(e) => setImportForm((f) => ({ ...f, costo_final: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] text-white font-medium">Guardar</button>
                <button type="button" onClick={() => setImportOpen(false)} className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
