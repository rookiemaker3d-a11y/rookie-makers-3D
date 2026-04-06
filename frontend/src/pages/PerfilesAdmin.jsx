import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react'

export default function PerfilesAdmin() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = () => {
    setErr('')
    setMsg('')
    setLoading(true)
    api('/auth/usuarios')
      .then(async (r) => {
        if (!r.ok) throw new Error('No autorizado o error al cargar')
        return r.json()
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message || 'Error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setActive = async (u, next) => {
    setErr('')
    setMsg('')
    try {
      const res = await api(`/auth/usuarios/${u.id}/activo`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !!next }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al actualizar')
      setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !!next } : x)))
      setMsg(`Perfil ${u.email} ${next ? 'activado' : 'desactivado'}.`)
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Perfiles (abrir / cerrar)"
        subtitle="Desactiva un perfil para bloquear el login (útil para mensualidades). Solo admin."
      />

      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm theme-text-muted">
            Admin actual: <span className="theme-text">{user?.email}</span>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 theme-text-muted">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto theme-table rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 font-semibold">ID</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">Activo</th>
                  <th className="p-3 w-48" />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const active = u.is_active !== false
                  return (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="p-3 theme-text tabular-nums">{u.id}</td>
                      <td className="p-3 theme-text">{u.email}</td>
                      <td className="p-3 theme-text-muted">{u.role}</td>
                      <td className="p-3">
                        <span className={active ? 'text-emerald-500' : 'text-red-400'}>
                          {active ? 'Activo' : 'Cerrado'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActive(u, true)}
                            disabled={active}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Abrir
                          </button>
                          <button
                            type="button"
                            onClick={() => setActive(u, false)}
                            disabled={!active || u.id === user?.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium disabled:opacity-50"
                            title={u.id === user?.id ? 'No puedes cerrarte a ti mismo' : 'Cerrar perfil'}
                          >
                            <ShieldOff className="w-4 h-4" />
                            Cerrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

