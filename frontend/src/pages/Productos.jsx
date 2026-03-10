import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Trash2 } from 'lucide-react'

export default function Productos() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [importForm, setImportForm] = useState({ descripcion: '', costo_produccion: '', costo_final: '' })
  const [msg, setMsg] = useState('')

  const isAdmin = user?.role === 'administrador'

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
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Productos autorizados"
        subtitle="Ventas importadas y autorizadas. Solo el administrador puede importar o eliminar; los vendedores pueden ver y usar para cotizaciones."
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
              <th className="p-3 theme-text-muted font-medium">ID</th>
              <th className="p-3 theme-text-muted font-medium">Descripción</th>
              <th className="p-3 theme-text-muted font-medium">Costo prod.</th>
              <th className="p-3 theme-text-muted font-medium">Costo final</th>
              <th className="p-3 theme-text-muted font-medium">Ganancia</th>
              {isAdmin && <th className="p-3 theme-text-muted font-medium w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const gan = (p.costo_final || 0) - (p.costo_base || 0)
              return (
                <tr key={p.id} className="border-b hover:bg-[var(--theme-table-row-hover)]">
                  <td className="p-3 theme-text tabular-nums">{p.id}</td>
                  <td className="p-3 theme-text">{p.descripcion}</td>
                  <td className="p-3 theme-text tabular-nums">${(p.costo_base || 0).toFixed(2)}</td>
                  <td className="p-3 theme-text tabular-nums">${(p.costo_final || 0).toFixed(2)}</td>
                  <td className="p-3 text-emerald-600 font-medium tabular-nums">${gan.toFixed(2)}</td>
                  {isAdmin && (
                    <td className="p-3">
                      <button
                        onClick={() => deleteOne(p.id)}
                        className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition flex items-center gap-1"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div className="flex flex-wrap gap-6 text-sm">
        <span className="theme-text-muted">Total costo: <strong className="theme-text tabular-nums">${totalCosto.toFixed(2)}</strong></span>
        <span className="theme-text-muted">Total venta: <strong className="theme-text tabular-nums">${totalVenta.toFixed(2)}</strong></span>
        <span className={ganancia >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>Ganancia neta: <strong className="tabular-nums">${ganancia.toFixed(2)}</strong></span>
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
    </div>
  )
}
