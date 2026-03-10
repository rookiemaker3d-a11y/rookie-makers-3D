import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Pencil } from 'lucide-react'

export default function Vendedores() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', new_password: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    api('/vendedores')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const openEdit = (v) => {
    setEditing(v)
    setForm({
      nombre: v.nombre || '',
      correo: v.correo || '',
      telefono: v.telefono || '',
      banco: v.banco || '',
      cuenta: v.cuenta || '',
      new_password: '',
    })
    setEditOpen(true)
    setMsg('')
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditing(null)
    setForm({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', new_password: '' })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setMsg('')
    try {
      let res = await api(`/vendedores/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: form.nombre,
          correo: form.correo,
          telefono: form.telefono || null,
          banco: form.banco || null,
          cuenta: form.cuenta || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsg(data?.detail || 'Error al guardar')
        return
      }
      if (form.new_password.trim() && editing.user_id) {
        res = await api(`/auth/users/${editing.user_id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ new_password: form.new_password.trim() }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setMsg(data?.detail || 'Error al guardar')
          return
        }
      }
      setMsg('Guardado correctamente.')
      load()
      closeEdit()
    } catch (err) {
      setMsg(err?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 theme-text-muted">Cargando...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold theme-text mb-2">Vendedores</h1>
      <p className="theme-text-muted text-sm mb-4">Edita datos y contraseñas. Solo el administrador ve este módulo.</p>
      <div className="theme-table rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--theme-table-border)' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 theme-text-muted font-medium">ID</th>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Correo</th>
              <th className="p-3 theme-text-muted font-medium">Teléfono</th>
              <th className="p-3 theme-text-muted font-medium">Banco / Cuenta</th>
              <th className="p-3 theme-text-muted font-medium w-24">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b hover:bg-[var(--theme-table-row-hover)]">
                <td className="p-3 theme-text">{v.id}</td>
                <td className="p-3 theme-text">{v.nombre}</td>
                <td className="p-3 theme-text">{v.correo}</td>
                <td className="p-3 theme-text-muted">{v.telefono}</td>
                <td className="p-3 theme-text-muted">{v.banco} — {v.cuenta}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => openEdit(v)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg btn-primary text-sm"
                    aria-label="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border-2 theme-border theme-bg-card p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold theme-text mb-4">Editar vendedor</h2>
            {msg && <p className={`text-sm mb-3 ${msg.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{msg}</p>}
            <form onSubmit={saveEdit} className="space-y-3">
              <input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
                required
              />
              <input
                type="email"
                placeholder="Correo"
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
                required
              />
              <input
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
              />
              <input
                placeholder="Banco"
                value={form.banco}
                onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
              />
              <input
                placeholder="Cuenta"
                value={form.cuenta}
                onChange={(e) => setForm((f) => ({ ...f, cuenta: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
              />
              <input
                type="password"
                placeholder="Nueva contraseña (mín. 12 caracteres, mayúscula, minúscula, número y carácter especial)"
                value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
                minLength={6}
                autoComplete="new-password"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-xl btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
