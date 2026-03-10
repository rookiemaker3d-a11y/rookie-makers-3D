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

  if (loading) return <div className="p-8 theme-text-muted">Cargando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold theme-text mb-2">Videos promocionales</h1>
      <p className="theme-text-muted text-sm mb-6">
        Estos videos se muestran en la página pública de Proyectos.
        {isAdmin ? ' Puedes agregar, editar o eliminar videos con el formulario de abajo.' : ' Solo el administrador puede agregar o editar.'}
      </p>
      {msg && <p className="text-cyan-500 text-sm mb-2">{msg}</p>}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {isAdmin && (
        <form onSubmit={submit} className="theme-table rounded-xl p-4 border mb-6 space-y-3">
          <h2 className="text-lg font-medium theme-text">{editingId ? 'Editar video' : 'Agregar video'}</h2>
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="theme-input w-full px-3 py-2 rounded-lg border"
          />
          <input
            placeholder="URL (enlace al video en TikTok, Instagram, Facebook o YouTube)"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="theme-input w-full px-3 py-2 rounded-lg border"
          />
          <select
            value={form.red}
            onChange={(e) => setForm((f) => ({ ...f, red: e.target.value }))}
            className="theme-input w-full px-3 py-2 rounded-lg border"
          >
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="YouTube">YouTube</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg btn-primary font-medium">
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
          <div key={v.id} className="flex items-center justify-between theme-bg-card theme-border rounded-xl p-4 border">
            <div>
              <span className="text-cyan-500 text-xs font-medium">{v.red}</span>
              <p className="font-medium theme-text">{v.titulo}</p>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="theme-text-muted text-sm hover:text-cyan-500 truncate block max-w-md">{v.url}</a>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(v)} className="text-cyan-500 hover:text-cyan-400 text-sm">Editar</button>
                <button type="button" onClick={() => deleteOne(v.id)} className="text-red-500 hover:text-red-400 text-sm">Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {list.length === 0 && (
        <p className="theme-text-dim">
          {isAdmin ? 'No hay videos todavía. Usa el formulario de arriba para agregar el primero.' : 'No hay videos. Solo el administrador puede agregarlos.'}
        </p>
      )}
    </div>
  )
}
