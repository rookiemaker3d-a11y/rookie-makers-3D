import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function VideosPromocionales() {
  const { api, user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titulo: '', url: '', red: 'TikTok' })
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'administrador'

  function load() {
    api('/videos-promocionales')
      .then((r) => r.json())
      .then(setList)
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.titulo || !form.url) {
      setMsg('Título y URL son obligatorios.')
      return
    }
    setError('')
    setMsg('')
    try {
      if (editingId) {
        await api(`/videos-promocionales/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        setMsg('Video actualizado.')
      } else {
        await api('/videos-promocionales', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        setMsg('Video agregado.')
      }
      setForm({ titulo: '', url: '', red: 'TikTok' })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.status === 403 ? 'Solo administrador puede agregar o editar videos.' : 'Error al guardar.')
    }
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar este video?')) return
    try {
      await api(`/videos-promocionales/${id}`, { method: 'DELETE' })
      load()
      setMsg('Video eliminado.')
    } catch {
      setError('Solo administrador puede eliminar.')
    }
  }

  const startEdit = (v) => {
    setForm({ titulo: v.titulo, url: v.url, red: v.red || 'TikTok' })
    setEditingId(v.id)
  }

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Videos promocionales</h1>
      <p className="text-slate-400 text-sm mb-6">
        Estos videos se muestran en la página pública de Proyectos.
        {isAdmin ? ' Puedes agregar, editar o eliminar videos con el formulario de abajo.' : ' Solo el administrador puede agregar o editar.'}
      </p>
      {msg && <p className="text-cyan-400 text-sm mb-2">{msg}</p>}
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      {isAdmin && (
        <form onSubmit={submit} className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6 space-y-3">
          <h2 className="text-lg font-medium text-white">{editingId ? 'Editar video' : 'Agregar video'}</h2>
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          />
          <input
            placeholder="URL (enlace al video en TikTok, Instagram, Facebook o YouTube)"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          />
          <select
            value={form.red}
            onChange={(e) => setForm((f) => ({ ...f, red: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          >
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="YouTube">YouTube</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
              {editingId ? 'Guardar cambios' : 'Agregar'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ titulo: '', url: '', red: 'TikTok' }); }} className="px-4 py-2 rounded-lg bg-slate-600 text-white">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-2">
        {list.map((v) => (
          <div key={v.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div>
              <span className="text-cyan-400 text-xs font-medium">{v.red}</span>
              <p className="font-medium text-white">{v.titulo}</p>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 text-sm hover:text-cyan-400 truncate block max-w-md">{v.url}</a>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(v)} className="text-cyan-400 hover:text-cyan-300 text-sm">Editar</button>
                <button type="button" onClick={() => deleteOne(v.id)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {list.length === 0 && (
        <p className="text-slate-500">
          {isAdmin ? 'No hay videos todavía. Usa el formulario de arriba para agregar el primero.' : 'No hay videos. Solo el administrador puede agregarlos.'}
        </p>
      )}
    </div>
  )
}
