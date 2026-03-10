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

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Clientes</h1>
      {msg && <p className="text-slate-400 text-sm mb-2">{msg}</p>}
      <form onSubmit={submit} className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6 space-y-3 max-w-md">
        <h2 className="text-lg font-medium text-white">Nuevo cliente</h2>
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
        />
        <input
          type="email"
          placeholder="Correo *"
          value={form.correo}
          onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
        />
        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white">Guardar</button>
      </form>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="p-3 text-slate-400">ID</th>
              <th className="p-3 text-slate-400">Nombre</th>
              <th className="p-3 text-slate-400">Correo</th>
              <th className="p-3 text-slate-400">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-700">
                <td className="p-3 text-white">{c.id}</td>
                <td className="p-3 text-white">{c.nombre}</td>
                <td className="p-3 text-white">{c.correo}</td>
                <td className="p-3 text-slate-400">{c.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
