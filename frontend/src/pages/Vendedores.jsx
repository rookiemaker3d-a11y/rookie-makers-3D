import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Pencil, UserPlus } from 'lucide-react'

export default function Vendedores() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createVentasOpen, setCreateVentasOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', clabe: '', tarjeta: '', new_password: '' })
  const [createForm, setCreateForm] = useState({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', clabe: '', password: '' })
  const [createVentasForm, setCreateVentasForm] = useState({ email: '', password: '' })
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
      clabe: v.clabe || '',
      tarjeta: '',
      new_password: '',
    })
    setEditOpen(true)
    setMsg('')
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditing(null)
    setForm({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', clabe: '', tarjeta: '', new_password: '' })
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
          clabe: form.clabe || null,
          ...(form.tarjeta.trim() ? { tarjeta_numero: form.tarjeta.trim() } : {}),
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

  const saveCreate = async (e) => {
    e.preventDefault()
    if (!createForm.nombre?.trim() || !createForm.correo?.trim()) {
      setMsg('Nombre y correo son obligatorios.')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await api('/vendedores', {
        method: 'POST',
        body: JSON.stringify({
          nombre: createForm.nombre.trim(),
          correo: createForm.correo.trim().toLowerCase(),
          telefono: createForm.telefono?.trim() || null,
          banco: createForm.banco?.trim() || null,
          cuenta: createForm.cuenta?.trim() || null,
          clabe: createForm.clabe?.trim() || null,
          password: createForm.password?.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsg(data?.detail || 'Error al crear')
        return
      }
      setMsg('Diseñador agregado correctamente.')
      setCreateForm({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', clabe: '', password: '' })
      setCreateOpen(false)
      load()
    } catch (err) {
      setMsg(err?.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const saveCreateVentas = async (e) => {
    e.preventDefault()
    if (!createVentasForm.email?.trim() || !createVentasForm.password?.trim()) {
      setMsg('Correo y contraseña son obligatorios.')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await api('/auth/usuarios-vendedor-ventas', {
        method: 'POST',
        body: JSON.stringify({
          email: createVentasForm.email.trim().toLowerCase(),
          password: createVentasForm.password.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsg(data?.detail || 'Error al crear')
        return
      }
      setMsg('Usuario vendedor de ventas creado. Ya puede iniciar sesión con ese correo.')
      setCreateVentasForm({ email: '', password: '' })
      setCreateVentasOpen(false)
    } catch (err) {
      setMsg(err?.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 theme-text-muted">Cargando...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold theme-text mb-2">Diseñadores</h1>
          <p className="theme-text-muted text-sm">Estos son los diseñadores (fabricantes). Edita datos, contraseñas y agrega nuevos. Solo el administrador ve este módulo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setCreateOpen(true); setMsg(''); setCreateForm({ nombre: '', correo: '', telefono: '', banco: '', cuenta: '', clabe: '', password: '' }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary font-medium text-sm"
          >
            <UserPlus className="w-5 h-5" />
            Agregar diseñador
          </button>
          <button
            type="button"
            onClick={() => { setCreateVentasOpen(true); setMsg(''); setCreateVentasForm({ email: '', password: '' }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)', background: 'var(--theme-bg-card)' }}
          >
            <UserPlus className="w-5 h-5" />
            Agregar vendedor de ventas
          </button>
        </div>
      </div>
      {msg && <p className={`text-sm mb-3 ${msg.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>{msg}</p>}
      <div className="theme-table rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--theme-table-border)' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 theme-text-muted font-medium">ID</th>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Correo</th>
              <th className="p-3 theme-text-muted font-medium">Teléfono</th>
              <th className="p-3 theme-text-muted font-medium">Banco / Cuenta</th>
              <th className="p-3 theme-text-muted font-medium">Tarjeta</th>
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
                <td className="p-3 theme-text-muted">{v.tarjeta_ultimos4 ? `**** ${v.tarjeta_ultimos4}` : '—'}</td>
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

      {createVentasOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border-2 theme-border theme-bg-card p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold theme-text mb-4">Agregar vendedor de ventas</h2>
            <p className="theme-text-muted text-sm mb-3">Solo verá: Dashboard, Productos, Nueva cotización, Cotizaciones espera y Análisis (sus datos).</p>
            <form onSubmit={saveCreateVentas} className="space-y-3">
              <input type="email" placeholder="Correo *" value={createVentasForm.email} onChange={(e) => setCreateVentasForm((f) => ({ ...f, email: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" required />
              <input type="password" placeholder="Contraseña (mín. 12 caracteres, mayúscula, minúscula, número y carácter especial)" value={createVentasForm.password} onChange={(e) => setCreateVentasForm((f) => ({ ...f, password: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" minLength={12} required autoComplete="new-password" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-60">{saving ? 'Guardando...' : 'Crear'}</button>
                <button type="button" onClick={() => setCreateVentasOpen(false)} className="px-4 py-2 rounded-xl btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl border-2 theme-border theme-bg-card p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold theme-text mb-4">Agregar diseñador</h2>
            <form onSubmit={saveCreate} className="space-y-3">
              <input placeholder="Nombre *" value={createForm.nombre} onChange={(e) => setCreateForm((f) => ({ ...f, nombre: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" required />
              <input type="email" placeholder="Correo *" value={createForm.correo} onChange={(e) => setCreateForm((f) => ({ ...f, correo: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" required />
              <input placeholder="Teléfono" value={createForm.telefono} onChange={(e) => setCreateForm((f) => ({ ...f, telefono: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <input placeholder="Banco" value={createForm.banco} onChange={(e) => setCreateForm((f) => ({ ...f, banco: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <input placeholder="Cuenta" value={createForm.cuenta} onChange={(e) => setCreateForm((f) => ({ ...f, cuenta: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <input placeholder="CLABE (18 dígitos)" value={createForm.clabe} onChange={(e) => setCreateForm((f) => ({ ...f, clabe: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <input type="password" placeholder="Contraseña para login (mín. 12 caracteres, mayúscula, minúscula, número y carácter especial)" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className="theme-input w-full px-4 py-2.5 rounded-xl border" minLength={12} autoComplete="new-password" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-60">{saving ? 'Guardando...' : 'Crear'}</button>
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                placeholder="CLABE (18 dígitos)"
                value={form.clabe}
                onChange={(e) => setForm((f) => ({ ...f, clabe: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
              />
              <input
                placeholder="Tarjeta (se guarda encriptada; solo se mostrará **** 1234)"
                value={form.tarjeta}
                onChange={(e) => setForm((f) => ({ ...f, tarjeta: e.target.value }))}
                className="theme-input w-full px-4 py-2.5 rounded-xl border"
                inputMode="numeric"
                autoComplete="off"
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
