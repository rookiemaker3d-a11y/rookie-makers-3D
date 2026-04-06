import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { ShieldCheck, ShieldOff, RefreshCw, CreditCard, ExternalLink, CalendarClock } from 'lucide-react'

export default function PerfilesAdmin() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [payUser, setPayUser] = useState(null)
  const [payPlanRole, setPayPlanRole] = useState('')
  const [payMonths, setPayMonths] = useState(1)
  const [payUrl, setPayUrl] = useState('')
  const [paying, setPaying] = useState(false)

  const load = () => {
    setErr('')
    setMsg('')
    setLoading(true)
    Promise.all([api('/auth/usuarios'), api('/suscripciones/planes')])
      .then(async ([rU, rP]) => {
        if (!rU.ok) throw new Error('No autorizado o error al cargar usuarios')
        const users = await rU.json().catch(() => [])
        const pls = rP.ok ? await rP.json().catch(() => []) : []
        setItems(Array.isArray(users) ? users : [])
        setPlanes(Array.isArray(pls) ? pls : [])
      })
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

  const planesByRole = useMemo(() => {
    const m = new Map()
    ;(planes || []).forEach((p) => {
      if (p?.role) m.set(p.role, p)
    })
    return m
  }, [planes])

  const openPay = (u) => {
    setPayUser(u)
    setPayPlanRole(u?.role || '')
    setPayMonths(1)
    setPayUrl('')
    setPayOpen(true)
  }

  const solicitarPago = async () => {
    if (!payUser) return
    setErr('')
    setMsg('')
    setPayUrl('')
    setPaying(true)
    try {
      const res = await api('/suscripciones/solicitar-pago', {
        method: 'POST',
        body: JSON.stringify({ user_id: payUser.id, plan_role: payPlanRole, months: payMonths }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'No se pudo generar link de pago')
      setPayUrl(d.payment_url || '')
      setMsg('Link de pago generado.')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setPaying(false)
    }
  }

  const daysLeft = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    const diff = d.getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Perfiles (abrir / cerrar)"
        subtitle="Además del bloqueo manual, aquí se ve la suscripción (plan por rol + vencimiento) y puedes generar links de pago."
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
                  <th className="p-3 font-semibold">Plan</th>
                  <th className="p-3 font-semibold">Vence</th>
                  <th className="p-3 font-semibold">Activo</th>
                  <th className="p-3 w-[340px]" />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const active = u.is_active !== false
                  const plan = planesByRole.get(u.role)
                  const vence = u.subscription_expires_at || null
                  const left = daysLeft(vence)
                  return (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="p-3 theme-text tabular-nums">{u.id}</td>
                      <td className="p-3 theme-text">{u.email}</td>
                      <td className="p-3 theme-text-muted">{u.role}</td>
                      <td className="p-3 theme-text-muted text-xs">
                        {plan ? `${plan.role} · $${Number(plan.precio_mxn || 0).toFixed(0)}/mes` : '—'}
                      </td>
                      <td className="p-3 theme-text-muted text-xs">
                        {vence ? (
                          <span className={left != null && left <= 0 ? 'text-red-400' : 'theme-text'}>
                            {new Date(vence).toLocaleString()} {left != null ? `(${left} días)` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">
                        <span className={active ? 'text-emerald-500' : 'text-red-400'}>
                          {active ? 'Activo' : 'Cerrado'}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openPay(u)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs theme-text"
                            title="Generar link de pago Mercado Pago"
                          >
                            <CreditCard className="w-4 h-4 text-cyan-400" />
                            Cobrar
                          </button>
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

      {payOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border-2 theme-border theme-bg-card backdrop-blur-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-lg font-bold theme-text flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-cyan-400" /> Solicitar pago
              </h2>
              <button type="button" onClick={() => setPayOpen(false)} className="p-2 rounded-lg hover:bg-white/10 theme-text-muted" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <p className="text-sm theme-text-muted mb-4">
              Usuario: <span className="theme-text">{payUser?.email}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs theme-text-muted mb-1">Plan (rol)</label>
                <select value={payPlanRole} onChange={(e) => setPayPlanRole(e.target.value)} className="theme-input w-full px-3 py-2 rounded-xl border">
                  {[...planesByRole.keys()].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-1">Meses</label>
                <input type="number" min={1} max={24} value={payMonths} onChange={(e) => setPayMonths(Number(e.target.value) || 1)} className="theme-input w-full px-3 py-2 rounded-xl border" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={solicitarPago} disabled={paying} className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-50">
                {paying ? 'Generando…' : 'Generar link de pago'}
              </button>
              <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 rounded-xl btn-secondary">
                Cerrar
              </button>
            </div>
            {payUrl && (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <p className="text-xs theme-text-muted mb-2">Link de pago</p>
                <a href={payUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm break-all">
                  <ExternalLink className="w-4 h-4" /> {payUrl}
                </a>
              </div>
            )}
            <p className="text-[11px] theme-text-dim mt-3">
              Nota: el perfil se activará/extenderá cuando Mercado Pago notifique el pago por webhook.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

