import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Clientes() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', direccion: '' })
  const [msg, setMsg] = useState('')

  function load() {
    api('/clientes')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.correo) {
      setMsg('Nombre y correo son obligatorios.')
      return
    }
    await api('/clientes', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    setForm({ nombre: '', correo: '', telefono: '', direccion: '' })
    load()
    setMsg('Cliente guardado.')
  }

  if (loading) return <div className="p-8 theme-text-muted">Cargando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold theme-text mb-4">Clientes</h1>
      {msg && <p className="theme-text-muted text-sm mb-2">{msg}</p>}
      <form onSubmit={submit} className="theme-table rounded-xl p-4 border mb-6 space-y-3 max-w-md">
        <h2 className="text-lg font-medium theme-text">Nuevo cliente</h2>
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          className="theme-input w-full px-3 py-2 rounded-lg border"
        />
        <input
          type="email"
          placeholder="Correo *"
          value={form.correo}
          onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
          className="theme-input w-full px-3 py-2 rounded-lg border"
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          className="theme-input w-full px-3 py-2 rounded-lg border"
        />
        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
          className="theme-input w-full px-3 py-2 rounded-lg border"
        />
        <button type="submit" className="px-4 py-2 rounded-lg btn-primary">Guardar</button>
      </form>
      <div className="theme-table rounded-xl border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 theme-text-muted">ID</th>
              <th className="p-3 theme-text-muted">Nombre</th>
              <th className="p-3 theme-text-muted">Correo</th>
              <th className="p-3 theme-text-muted">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3 theme-text">{c.id}</td>
                <td className="p-3 theme-text">{c.nombre}</td>
                <td className="p-3 theme-text">{c.correo}</td>
                <td className="p-3 theme-text-muted">{c.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
