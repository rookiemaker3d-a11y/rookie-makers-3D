import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Inventario() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [filamentos, setFilamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [editingCostoId, setEditingCostoId] = useState(null)
  const [costoTemp, setCostoTemp] = useState('')

  const isAdmin = user?.role === 'administrador'

  function loadFilamentos() {
    api('/materiales-filamento')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFilamentos(Array.isArray(data) ? data : []))
      .catch(() => setFilamentos([]))
  }

  function load() {
    setLoading(true)
    Promise.all([
      api('/inventario').then((r) => (r.ok ? r.json() : [])).then((data) => setItems(Array.isArray(data) ? data : [])),
      api('/materiales-filamento').then((r) => (r.ok ? r.json() : [])).then((data) => setFilamentos(Array.isArray(data) ? data : [])),
    ]).catch(() => setError('Error al cargar inventario')).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const saveCostoFilamento = async (id) => {
    const val = Number(costoTemp)
    if (Number.isNaN(val) || val < 0) return
    try {
      await api(`/materiales-filamento/${id}`, { method: 'PATCH', body: JSON.stringify({ costo_por_kg: val }) })
      setEditingCostoId(null)
      setCostoTemp('')
      loadFilamentos()
      setMsg('Costo actualizado.')
    } catch {
      setError('Error al actualizar costo.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nombre?.trim()) {
      setMsg('El nombre es obligatorio.')
      return
    }
    setError('')
    setMsg('')
    try {
      if (editingId) {
        await api(`/inventario/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion?.trim() || null,
            cantidad: Number(form.cantidad) || 0,
            unidad: form.unidad || 'pza',
          }),
        })
        setMsg('Ítem actualizado.')
      } else {
        await api('/inventario', {
          method: 'POST',
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion?.trim() || null,
            cantidad: Number(form.cantidad) || 0,
            unidad: form.unidad || 'pza',
          }),
        })
        setMsg('Ítem agregado.')
      }
      setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
      setEditingId(null)
      setFormOpen(false)
      load()
    } catch (err) {
      setError(err.status === 403 ? 'No tienes permiso para editar este ítem.' : 'Error al guardar.')
    }
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar este ítem del inventario?')) return
    try {
      await api(`/inventario/${id}`, { method: 'DELETE' })
      setMsg('Ítem eliminado.')
      load()
    } catch (err) {
      setError(err.status === 403 ? 'No tienes permiso para eliminar este ítem.' : 'Error al eliminar.')
    }
  }

  const startEdit = (item) => {
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      cantidad: item.cantidad ?? 0,
      unidad: item.unidad || 'pza',
    })
    setEditingId(item.id)
    setFormOpen(true)
  }

  const cancelForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Costos de filamentos para cotizador */}
      <SectionHeader
        title="Costos de filamentos"
        subtitle="Tipos de material que manejamos y su costo por kg. Estos costos se usan en la cotización (paso calculadora). Edita el valor y guarda para actualizar."
      />
      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Material</th>
              <th className="p-3 theme-text-muted font-medium">Costo por kg (MXN)</th>
              <th className="p-3 theme-text-muted font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {filamentos.map((f) => (
              <tr key={f.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3 theme-text font-medium">{f.nombre}</td>
                <td className="p-3">
                  {editingCostoId === f.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={costoTemp}
                        onChange={(e) => setCostoTemp(e.target.value)}
                        className="theme-input w-28 px-2 py-1.5 rounded-lg border text-sm"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveCostoFilamento(f.id)} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs">Guardar</button>
                      <button type="button" onClick={() => { setEditingCostoId(null); setCostoTemp(''); }} className="px-2 py-1 rounded-lg bg-slate-600 text-white text-xs">Cancelar</button>
                    </div>
                  ) : (
                    <span className="theme-text tabular-nums">${(f.costo_por_kg ?? 0).toFixed(0)}</span>
                  )}
                </td>
                <td className="p-3">
                  {editingCostoId !== f.id && (
                    <button
                      type="button"
                      onClick={() => { setEditingCostoId(f.id); setCostoTemp(String(f.costo_por_kg ?? 0)); }}
                      className="p-1.5 rounded text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      aria-label="Editar costo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filamentos.length === 0 && !loading && (
          <div className="p-6 text-center theme-text-muted text-sm">
            No hay materiales cargados. Ejecuta el seed del backend para cargar los filamentos por defecto.
          </div>
        )}
      </Card>

      <SectionHeader
        title="Inventario (materiales / materias primas)"
        subtitle={
          isAdmin
            ? 'Ves todo el inventario. Puedes agregar ítems sin asignar vendedor o gestionar los de cualquier vendedor.'
            : 'Solo ves y editas los ítems que tú has subido.'
        }
        action={
          <button
            onClick={() => { setFormOpen(true); setEditingId(null); setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary hover:opacity-95 text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar ítem
          </button>
        }
      />
      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {(formOpen || editingId) && (
        <Card className="theme-table">
          <form onSubmit={submit} className="p-4 space-y-3">
            <h2 className="text-lg font-medium theme-text">{editingId ? 'Editar ítem' : 'Nuevo ítem'}</h2>
            <input
              placeholder="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-lg border"
            />
            <input
              placeholder="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-lg border"
            />
            <div className="flex gap-4 flex-wrap">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Cantidad"
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="theme-input w-32 px-3 py-2 rounded-lg border"
              />
              <select
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
                className="theme-input px-3 py-2 rounded-lg border"
              >
                <option value="pza">pza</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="L">L</option>
                <option value="rollo">rollo</option>
                <option value="caja">caja</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg btn-primary font-medium">
                {editingId ? 'Guardar cambios' : 'Agregar'}
              </button>
              <button type="button" onClick={cancelForm} className="px-4 py-2 rounded-lg bg-slate-600 text-white">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Descripción</th>
              <th className="p-3 theme-text-muted font-medium">Cantidad</th>
              <th className="p-3 theme-text-muted font-medium">Unidad</th>
              {isAdmin && <th className="p-3 theme-text-muted font-medium">Vendedor ID</th>}
              <th className="p-3 theme-text-muted font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3 theme-text font-medium">{item.nombre}</td>
                <td className="p-3 theme-text-muted">{item.descripcion || '—'}</td>
                <td className="p-3 theme-text tabular-nums">{item.cantidad}</td>
                <td className="p-3 theme-text-muted">{item.unidad || 'pza'}</td>
                {isAdmin && <td className="p-3 theme-text-muted">{item.vendedor_id ?? '—'}</td>}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOne(item.id)}
                      className="p-1.5 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-8 text-center theme-text-muted">
            No hay ítems en el inventario. Agrega el primero con el botón «Agregar ítem».
          </div>
        )}
      </Card>
    </div>
  )
}
