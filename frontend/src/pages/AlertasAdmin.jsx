import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Mail, Plus, Send, X, RefreshCw, Pause, Play, Bell } from 'lucide-react'

function parseEmails(text) {
  const raw = (text || '')
    .split(/[\n,; ]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const out = []
  for (const e of raw) {
    if (!e.includes('@')) continue
    if (!out.includes(e)) out.push(e)
  }
  return out
}

export default function AlertasAdmin() {
  const { api, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])

  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [sendAt, setSendAt] = useState('')
  const [manualEmails, setManualEmails] = useState('')
  const [pickUserEmails, setPickUserEmails] = useState([])

  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSubAlerts, setAutoSubAlerts] = useState(true)
  const [togglingAuto, setTogglingAuto] = useState(false)

  const load = async () => {
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.all([api('/alertas'), api('/auth/usuarios'), api('/alertas/config-sistema')])
      const a = await r1.json().catch(() => [])
      const u = await r2.json().catch(() => [])
      const cfg = r3.ok ? await r3.json().catch(() => ({})) : {}
      setItems(Array.isArray(a) ? a : [])
      setUsers(Array.isArray(u) ? u : [])
      if (typeof cfg.alertas_automaticas_suscripcion === 'boolean') setAutoSubAlerts(cfg.alertas_automaticas_suscripcion)
    } catch (e) {
      setErr(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickedEmails = useMemo(() => {
    const set = new Set()
    for (const e of pickUserEmails) set.add(String(e).toLowerCase())
    return Array.from(set)
  }, [pickUserEmails])

  const toEmails = useMemo(() => {
    const set = new Set()
    parseEmails(manualEmails).forEach((e) => set.add(e))
    pickedEmails.forEach((e) => set.add(e))
    return Array.from(set)
  }, [manualEmails, pickedEmails])

  const create = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (!titulo.trim() || !mensaje.trim()) {
      setErr('Falta título o mensaje.')
      return
    }
    if (toEmails.length === 0) {
      setErr('Agrega al menos un correo destino.')
      return
    }
    if (!sendAt) {
      setErr('Elige fecha y hora.')
      return
    }
    setSaving(true)
    try {
      // datetime-local -> ISO sin tz; backend lo toma como UTC (simple). En VPS puedes manejarlo en UTC.
      const iso = new Date(sendAt).toISOString()
      const res = await api('/alertas', {
        method: 'POST',
        body: JSON.stringify({ titulo: titulo.trim(), mensaje: mensaje.trim(), to_emails: toEmails, send_at: iso }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al guardar alerta')
      setMsg('Alerta programada.')
      setOpen(false)
      setTitulo('')
      setMensaje('')
      setSendAt('')
      setManualEmails('')
      setPickUserEmails([])
      await load()
    } catch (e2) {
      setErr(e2.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const sendNow = async (id) => {
    setErr('')
    setMsg('')
    try {
      const res = await api(`/alertas/${id}/enviar-ahora`, { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al enviar')
      setMsg(d.ok ? 'Enviado.' : 'Intenté enviar pero falló (SMTP).')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const toggleAutoSub = async () => {
    setTogglingAuto(true)
    setErr('')
    try {
      const res = await api('/alertas/config-sistema', {
        method: 'PUT',
        body: JSON.stringify({ alertas_automaticas_suscripcion: !autoSubAlerts }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error')
      setAutoSubAlerts(!!d.alertas_automaticas_suscripcion)
      setMsg(d.alertas_automaticas_suscripcion ? 'Alertas automáticas de suscripción activadas.' : 'Alertas automáticas de suscripción desactivadas.')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setTogglingAuto(false)
    }
  }

  const setAlertaPausada = async (id, pausar) => {
    setErr('')
    try {
      const res = await api(`/alertas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: pausar ? 'pausada' : 'activar' }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error')
      setMsg(pausar ? 'Alerta pausada (no se enviará en la fecha hasta reactivar).' : 'Alerta reactivada.')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const cancel = async (id) => {
    setErr('')
    setMsg('')
    try {
      const res = await api(`/alertas/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelado' }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al cancelar')
      setMsg('Alerta cancelada.')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Alarmas / Alertas (correo)"
        subtitle="Alertas manuales programadas + interruptor global de recordatorios automáticos de suscripción/pago (también por usuario en Perfiles). SMTP en el servidor."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nueva alerta
            </button>
          </div>
        }
      />

      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm theme-text-muted">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>
              Recordatorios automáticos de <strong className="theme-text">suscripción / pago</strong> (correo a usuario y admin, si el usuario no las desactivó en Perfiles)
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAutoSub}
            disabled={togglingAuto}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
              autoSubAlerts ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/20 text-slate-400'
            }`}
          >
            {autoSubAlerts ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {togglingAuto ? '…' : autoSubAlerts ? 'Desactivar automáticas' : 'Activar automáticas'}
          </button>
        </div>
        <div className="text-sm theme-text-muted mb-4">
          Admin: <span className="theme-text">{user?.email}</span>
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
                  <th className="p-3 font-semibold">Título</th>
                  <th className="p-3 font-semibold">Para</th>
                  <th className="p-3 font-semibold">Enviar</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 w-56" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="p-3 theme-text tabular-nums">{a.id}</td>
                    <td className="p-3 theme-text">{a.titulo}</td>
                    <td className="p-3 theme-text-muted text-xs">{(a.to_emails || []).slice(0, 3).join(', ')}{(a.to_emails || []).length > 3 ? '…' : ''}</td>
                    <td className="p-3 theme-text-muted text-xs">{a.send_at ? new Date(a.send_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      <span
                        className={
                          a.status === 'enviado'
                            ? 'text-emerald-500'
                            : a.status === 'error'
                              ? 'text-red-400'
                              : a.status === 'cancelado'
                                ? 'text-slate-400'
                                : a.status === 'pausada'
                                  ? 'text-amber-400'
                                  : 'text-cyan-400'
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        {a.status === 'pendiente' || a.status === 'pausada' ? (
                          <button
                            type="button"
                            onClick={() => setAlertaPausada(a.id, a.status !== 'pausada')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs theme-text"
                          >
                            {a.status === 'pausada' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            {a.status === 'pausada' ? 'Activar' : 'Pausar'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => sendNow(a.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs theme-text"
                        >
                          <Send className="w-4 h-4 text-cyan-400" />
                          Enviar ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => cancel(a.id)}
                          disabled={a.status === 'cancelado' || a.status === 'enviado'}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs text-white disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                      {a.last_error ? <p className="text-xs text-red-400 mt-1">{a.last_error}</p> : null}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 theme-text-muted text-sm">
                      Sin alertas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border-2 theme-border theme-bg-card backdrop-blur-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-lg font-bold theme-text flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" /> Nueva alerta
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/10 theme-text-muted" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={create} className="space-y-3">
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje (texto)" rows={4} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Fecha y hora</label>
                  <input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className="theme-input w-full px-4 py-2.5 rounded-xl border" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Destinatarios (manual)</label>
                  <input value={manualEmails} onChange={(e) => setManualEmails(e.target.value)} placeholder="a@x.com, b@y.com" className="theme-input w-full px-4 py-2.5 rounded-xl border" />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <p className="text-xs theme-text-muted mb-2">O selecciona usuarios existentes (opcional)</p>
                <div className="max-h-40 overflow-auto space-y-2">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm theme-text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pickUserEmails.includes(u.email)}
                        onChange={(e) => {
                          setPickUserEmails((prev) =>
                            e.target.checked ? [...prev, u.email] : prev.filter((x) => x !== u.email),
                          )
                        }}
                        className="rounded border-white/20"
                      />
                      <span className="theme-text">{u.email}</span>
                      <span className="text-xs theme-text-dim">({u.role}{u.is_active === false ? ', cerrado' : ''})</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] theme-text-dim mt-2">Total destinatarios: {toEmails.length}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-50">
                  {saving ? 'Guardando…' : 'Programar'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl btn-secondary">
                  Cancelar
                </button>
              </div>
              <p className="text-[11px] theme-text-dim">
                Nota: si SMTP no está configurado en el servidor, el envío fallará.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

