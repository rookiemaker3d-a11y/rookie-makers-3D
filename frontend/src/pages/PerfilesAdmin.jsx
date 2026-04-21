import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import {
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  CreditCard,
  ExternalLink,
  CalendarClock,
  Mail,
  Clock,
  Save,
  Plus,
} from 'lucide-react'

export default function PerfilesAdmin() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [planes, setPlanes] = useState([])
  const [planesEdit, setPlanesEdit] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingPlanes, setSavingPlanes] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [payUser, setPayUser] = useState(null)
  const [payPlanRole, setPayPlanRole] = useState('')
  const [payMonths, setPayMonths] = useState(1)
  const [payUrl, setPayUrl] = useState('')
  const [paying, setPaying] = useState(false)
  const [hoursOpen, setHoursOpen] = useState(null)
  const [hoursDelta, setHoursDelta] = useState(5)
  const [packValidDays, setPackValidDays] = useState(0)
  const [hoursSaving, setHoursSaving] = useState(false)
  const [mpHorasUser, setMpHorasUser] = useState(null)
  const [mpHorasQty, setMpHorasQty] = useState(5)
  const [mpPrecioHora, setMpPrecioHora] = useState(100)
  const [mpValidDays, setMpValidDays] = useState(30)
  const [mpPayingHoras, setMpPayingHoras] = useState(false)
  const [mpHorasUrl, setMpHorasUrl] = useState('')
  const [planeDraft, setPlaneDraft] = useState({ role: '', precio_mxn: 500, periodo_dias: 30 })

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
        const arr = Array.isArray(pls) ? pls : []
        setPlanes(arr)
        setPlanesEdit(
          arr.map((p) => ({
            role: p.role,
            precio_mxn: Number(p.precio_mxn ?? 0),
            periodo_dias: Number(p.periodo_dias ?? 30),
            activo: p.activo !== false,
          }))
        )
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

  const savePlanes = async () => {
    setErr('')
    setMsg('')
    const normalized = planesEdit
      .map((p) => ({
        role: String(p.role || '')
          .trim()
          .replace(/\s+/g, '_'),
        precio_mxn: Number(p.precio_mxn) || 0,
        periodo_dias: Number(p.periodo_dias) || 30,
        activo: !!p.activo,
      }))
      .filter((p) => p.role.length > 0)
    const seen = new Set()
    for (const p of normalized) {
      if (seen.has(p.role)) {
        setErr(`Plan duplicado: ${p.role}`)
        return
      }
      seen.add(p.role)
    }
    if (normalized.length === 0) {
      setErr('Agrega al menos un plan con nombre (rol) válido.')
      return
    }
    setSavingPlanes(true)
    try {
      const res = await api('/suscripciones/planes', {
        method: 'PUT',
        body: JSON.stringify({ planes: normalized }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'No se guardaron los planes')
      setMsg('Planes y precios guardados.')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSavingPlanes(false)
    }
  }

  const patchPerfil = async (userId, body) => {
    const res = await api(`/auth/usuarios/${userId}/perfil-suscripcion`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(d?.detail || 'Error al actualizar perfil')
    setItems((prev) => prev.map((x) => (x.id === userId ? { ...x, ...d } : x)))
  }

  const onDisenadorChange = async (u, value) => {
    setErr('')
    try {
      await patchPerfil(u.id, { disenador_tipo: value === '' ? '' : value })
      setMsg('Tipo diseñador actualizado.')
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const enviarAvisoPago = async (u) => {
    setErr('')
    setMsg('')
    try {
      const res = await api(`/auth/usuarios/${u.id}/aviso-pago-correo`, { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'No se envió el correo')
      setMsg(`Aviso enviado a ${u.email} y al correo de admin.`)
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const aplicarHorasDelta = async () => {
    if (!hoursOpen) return
    setErr('')
    setHoursSaving(true)
    try {
      const body = { horas_saldo_delta: Number(hoursDelta) || 0 }
      const vd = Number(packValidDays) || 0
      if (vd > 0) body.pack_valid_days_from_now = vd
      await patchPerfil(hoursOpen.id, body)
      setMsg(`Horas actualizadas para ${hoursOpen.email}${vd > 0 ? ` (paquete válido ${vd} días)` : ''}.`)
      setHoursOpen(null)
      setPackValidDays(0)
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setHoursSaving(false)
    }
  }

  const solicitarPagoHoras = async () => {
    if (!mpHorasUser) return
    setErr('')
    setMsg('')
    setMpHorasUrl('')
    setMpPayingHoras(true)
    try {
      const res = await api('/suscripciones/solicitar-pago-horas', {
        method: 'POST',
        body: JSON.stringify({
          user_id: mpHorasUser.id,
          horas: Number(mpHorasQty) || 1,
          precio_por_hora_mxn: Number(mpPrecioHora) || 1,
          valid_days: Number(mpValidDays) || 0,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'No se generó el link')
      setMpHorasUrl(d.payment_url || '')
      setMsg('Link de pago (horas) generado.')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setMpPayingHoras(false)
    }
  }

  const toggleAlertasUsuario = async (u, on) => {
    setErr('')
    try {
      await patchPerfil(u.id, { recibir_alertas_suscripcion: on })
      setMsg(on ? 'Alertas activadas para el usuario.' : 'Alertas desactivadas para el usuario.')
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

  const planesSorted = useMemo(() => {
    return [...(planes || [])].filter((p) => p?.role).sort((a, b) => String(a.role).localeCompare(String(b.role)))
  }, [planes])

  const subscriptionPlanRoleForUser = (u) => {
    const dt = (u?.disenador_tipo || '').toLowerCase()
    if (dt === 'rookie' && planesByRole.has('disenador_rookie')) return 'disenador_rookie'
    if (dt === 'emanuel' && planesByRole.has('disenador_emanuel')) return 'disenador_emanuel'
    if ((dt === 'disenador_3d' || dt === '3d') && planesByRole.has('disenador_3d')) return 'disenador_3d'
    const ur = (u?.role || '').trim()
    if (ur && planesByRole.has(ur)) return ur
    return ''
  }

  const defaultPlanRoleForUser = (u) => {
    const s = subscriptionPlanRoleForUser(u)
    if (s) return s
    return planesSorted[0]?.role || ''
  }

  const cobroPlanForUser = (u) => {
    const sub = subscriptionPlanRoleForUser(u)
    if (sub && planesByRole.has(sub)) return planesByRole.get(sub)
    const ur = (u?.role || '').trim()
    if (ur && planesByRole.has(ur)) return planesByRole.get(ur)
    return null
  }

  const addPlaneFromDraft = () => {
    setErr('')
    const role = String(planeDraft.role || '')
      .trim()
      .replace(/\s+/g, '_')
    if (!role) {
      setErr('Escribe el id del plan (ej. disenador_3d, vendedor).')
      return
    }
    if (planesEdit.some((p) => p.role === role)) {
      setErr(`Ya existe un plan con id «${role}».`)
      return
    }
    setPlanesEdit((prev) => [
      ...prev,
      {
        role,
        precio_mxn: Number(planeDraft.precio_mxn) || 0,
        periodo_dias: Number(planeDraft.periodo_dias) || 30,
        activo: true,
      },
    ])
    setPlaneDraft({ role: '', precio_mxn: 500, periodo_dias: 30 })
    setMsg(`Plan «${role}» añadido a la tabla (pulsa Guardar planes para persistir en la base).`)
  }

  const openPay = (u) => {
    setPayUser(u)
    setPayPlanRole(defaultPlanRoleForUser(u))
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

  const updatePlaneRow = (idx, field, value) => {
    setPlanesEdit((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Perfiles, suscripción y costos"
        subtitle="Ciber: vende horas (manual o Mercado Pago), validez del paquete, suscripción mensual, Rookie/Emanuel, alertas por usuario y correos."
      />

      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold theme-text">Costos de suscripción (Mercado Pago)</h3>
            <p className="text-[11px] theme-text-dim mt-0.5 max-w-xl">
              Esto alimenta el desplegable de <strong className="theme-text font-normal">Solicitar pago</strong>: cada fila es un{' '}
              <code className="text-[10px] bg-white/10 px-1 rounded">plan_role</code> con precio mensual. Los diseñadores siguen con rol de app{' '}
              <code className="text-[10px] bg-white/10 px-1 rounded">vendedor</code>; el cobro distinto va en columna Diseñador + estos planes.
            </p>
          </div>
          <button
            type="button"
            onClick={savePlanes}
            disabled={savingPlanes || planesEdit.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingPlanes ? 'Guardando…' : 'Guardar planes'}
          </button>
        </div>
        <p className="text-xs theme-text-muted mb-3">
          Planes por defecto: <code className="text-[11px] bg-white/10 px-1 rounded">vendedor</code>,{' '}
          <code className="text-[11px] bg-white/10 px-1 rounded">disenador_3d</code>,{' '}
          <code className="text-[11px] bg-white/10 px-1 rounded">disenador_rookie</code>,{' '}
          <code className="text-[11px] bg-white/10 px-1 rounded">disenador_emanuel</code>. Si en el modal solo ves 3 opciones, reinicia el backend
          (el arranque inserta filas que falten) o añade un plan abajo y guarda.
        </p>
        <div className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="min-w-[140px] flex-1">
            <label className="block text-[11px] theme-text-muted mb-1">Nuevo id de plan (sin espacios)</label>
            <input
              type="text"
              placeholder="ej. disenador_3d"
              value={planeDraft.role}
              onChange={(e) => setPlaneDraft((d) => ({ ...d, role: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-xl border text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] theme-text-muted mb-1">Precio MXN</label>
            <input
              type="number"
              min={0}
              value={planeDraft.precio_mxn}
              onChange={(e) => setPlaneDraft((d) => ({ ...d, precio_mxn: Number(e.target.value) || 0 }))}
              className="theme-input w-24 px-2 py-2 rounded-xl border text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] theme-text-muted mb-1">Días</label>
            <input
              type="number"
              min={1}
              value={planeDraft.periodo_dias}
              onChange={(e) => setPlaneDraft((d) => ({ ...d, periodo_dias: Number(e.target.value) || 30 }))}
              className="theme-input w-20 px-2 py-2 rounded-xl border text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addPlaneFromDraft}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir a la tabla
          </button>
        </div>
        {planesEdit.length === 0 ? (
          <p className="text-sm theme-text-muted">Sin planes. Recarga tras reiniciar el backend.</p>
        ) : (
          <div className="overflow-x-auto theme-table rounded-xl border border-white/10 text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-2 font-semibold">Rol / plan</th>
                  <th className="p-2 font-semibold">Precio MXN</th>
                  <th className="p-2 font-semibold">Días periodo</th>
                  <th className="p-2 font-semibold">Activo</th>
                </tr>
              </thead>
              <tbody>
                {planesEdit.map((p, idx) => (
                  <tr key={p.role} className="border-b border-white/5">
                    <td className="p-2 theme-text-muted font-mono text-xs">{p.role}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={p.precio_mxn}
                        onChange={(e) => updatePlaneRow(idx, 'precio_mxn', Number(e.target.value) || 0)}
                        className="theme-input w-24 px-2 py-1 rounded-lg border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        value={p.periodo_dias}
                        onChange={(e) => updatePlaneRow(idx, 'periodo_dias', Number(e.target.value) || 30)}
                        className="theme-input w-20 px-2 py-1 rounded-lg border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={!!p.activo}
                        onChange={(e) => updatePlaneRow(idx, 'activo', e.target.checked)}
                        className="rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm theme-text-muted">
            Admin: <span className="theme-text">{user?.email}</span>
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
            <table className="w-full text-left text-sm min-w-[1040px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-2 font-semibold">ID</th>
                  <th className="p-2 font-semibold">Email</th>
                  <th className="p-2 font-semibold" title="Permiso de login en la app (vendedor / administrador / …)">
                    Rol app
                  </th>
                  <th className="p-2 font-semibold" title="Plan de cobro sugerido en Mercado Pago">
                    Diseñador
                  </th>
                  <th className="p-2 font-semibold">Horas</th>
                  <th className="p-2 font-semibold">Vence horas</th>
                  <th className="p-2 font-semibold" title="Precio del plan que se usará al cobrar suscripción">
                    Cobro MP
                  </th>
                  <th className="p-2 font-semibold">Vence sub.</th>
                  <th className="p-2 font-semibold">Avisos</th>
                  <th className="p-2 font-semibold">Activo</th>
                  <th className="p-2 font-semibold w-[340px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const active = u.is_active !== false
                  const plan = cobroPlanForUser(u)
                  const vence = u.subscription_expires_at || null
                  const left = daysLeft(vence)
                  const horas = Number(u.horas_saldo ?? 0)
                  return (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="p-2 theme-text tabular-nums">{u.id}</td>
                      <td className="p-2 theme-text">{u.email}</td>
                      <td className="p-2 theme-text-muted text-xs">{u.role}</td>
                      <td className="p-2">
                        <select
                          value={u.disenador_tipo || ''}
                          onChange={(e) => onDisenadorChange(u, e.target.value)}
                          className="theme-input text-xs px-2 py-1 rounded-lg border max-w-[200px]"
                        >
                          <option value="">— (solo rol app)</option>
                          <option value="disenador_3d">Diseñador 3D</option>
                          <option value="rookie">Rookie</option>
                          <option value="emanuel">Emanuel</option>
                        </select>
                      </td>
                      <td className="p-2 theme-text tabular-nums text-xs">{horas.toFixed(1)} h</td>
                      <td className="p-2 theme-text-muted text-xs">
                        {u.horas_paquete_expira_at ? (
                          <span className={daysLeft(u.horas_paquete_expira_at) != null && daysLeft(u.horas_paquete_expira_at) <= 0 ? 'text-red-400' : ''}>
                            {new Date(u.horas_paquete_expira_at).toLocaleString()}{' '}
                            {daysLeft(u.horas_paquete_expira_at) != null ? `(${daysLeft(u.horas_paquete_expira_at)} d)` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2 theme-text-muted text-xs">
                        {plan ? `${plan.role} · $${Number(plan.precio_mxn || 0).toFixed(0)}/mes` : '—'}
                      </td>
                      <td className="p-2 theme-text-muted text-xs">
                        {vence ? (
                          <span className={left != null && left <= 0 ? 'text-red-400' : 'theme-text'}>
                            {new Date(vence).toLocaleString()} {left != null ? `(${left} d)` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          title="Recibir alertas automáticas de suscripción/pago"
                          checked={u.recibir_alertas_suscripcion !== false}
                          onChange={(e) => toggleAlertasUsuario(u, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2">
                        <span className={active ? 'text-emerald-500' : 'text-red-400'}>{active ? 'Sí' : 'No'}</span>
                      </td>
                      <td className="p-1">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => openPay(u)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] theme-text"
                            title="Mercado Pago suscripción"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                            Sub.
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMpHorasUser(u)
                              setMpHorasUrl('')
                              setMpHorasQty(5)
                              setMpPrecioHora(100)
                              setMpValidDays(30)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-violet-500/20 text-[11px] theme-text"
                            title="Vender horas con Mercado Pago"
                          >
                            <Clock className="w-3.5 h-3.5 text-violet-300" />
                            MP h
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHoursDelta(5)
                              setPackValidDays(0)
                              setHoursOpen(u)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 text-[11px] theme-text"
                            title="Sumar/restar horas y validez del paquete (manual)"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Horas
                          </button>
                          <button
                            type="button"
                            onClick={() => enviarAvisoPago(u)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 text-[11px] theme-text"
                            title="Correo a usuario y admin (SMTP)"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-400" />
                            Aviso
                          </button>
                          <button
                            type="button"
                            onClick={() => setActive(u, true)}
                            disabled={active}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Abrir
                          </button>
                          <button
                            type="button"
                            onClick={() => setActive(u, false)}
                            disabled={!active || u.id === user?.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-600 text-white text-[11px] disabled:opacity-50"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
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

      {mpHorasUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border theme-border theme-bg-card p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold theme-text mb-2">Vender horas (Mercado Pago)</h3>
            <p className="text-sm theme-text-muted mb-4">{mpHorasUser.email}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs theme-text-muted mb-1">Horas</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={mpHorasQty}
                  onChange={(e) => setMpHorasQty(Number(e.target.value) || 1)}
                  className="theme-input w-full px-3 py-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-1">$/hora MXN</label>
                <input
                  type="number"
                  min={1}
                  value={mpPrecioHora}
                  onChange={(e) => setMpPrecioHora(Number(e.target.value) || 1)}
                  className="theme-input w-full px-3 py-2 rounded-xl border"
                />
              </div>
            </div>
            <label className="block text-xs theme-text-muted mb-1">Válidas N días tras pagar (0 = sin caducidad automática en MP)</label>
            <input
              type="number"
              min={0}
              value={mpValidDays}
              onChange={(e) => setMpValidDays(Number(e.target.value) || 0)}
              className="theme-input w-full px-3 py-2 rounded-xl border mb-4"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={solicitarPagoHoras}
                disabled={mpPayingHoras}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm disabled:opacity-50"
              >
                {mpPayingHoras ? '…' : 'Generar link MP'}
              </button>
              <button type="button" onClick={() => setMpHorasUser(null)} className="px-4 py-2 rounded-xl btn-secondary text-sm">
                Cerrar
              </button>
            </div>
            {mpHorasUrl ? (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <a href={mpHorasUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm break-all inline-flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> {mpHorasUrl}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {hoursOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border theme-border theme-bg-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold theme-text mb-2">Horas de uso</h3>
            <p className="text-sm theme-text-muted mb-3">{hoursOpen.email}</p>
            <p className="text-xs theme-text-dim mb-2">Saldo actual: {Number(hoursOpen.horas_saldo ?? 0).toFixed(1)} h</p>
            <label className="block text-xs theme-text-muted mb-1">Sumar (negativo resta)</label>
            <input
              type="number"
              step={0.5}
              value={hoursDelta}
              onChange={(e) => setHoursDelta(Number(e.target.value))}
              className="theme-input w-full px-3 py-2 rounded-xl border mb-3"
            />
            <label className="block text-xs theme-text-muted mb-1">Validez del paquete desde hoy (días, 0 = no cambiar fecha)</label>
            <input
              type="number"
              min={0}
              value={packValidDays}
              onChange={(e) => setPackValidDays(Number(e.target.value) || 0)}
              className="theme-input w-full px-3 py-2 rounded-xl border mb-2"
            />
            <p className="text-[11px] theme-text-dim mb-3">
              Si pones días, se fija “vence horas”. Al vencer, el job pone saldo en 0 (modo ciber).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={aplicarHorasDelta}
                disabled={hoursSaving}
                className="px-4 py-2 rounded-xl btn-primary text-sm disabled:opacity-50"
              >
                {hoursSaving ? '…' : 'Aplicar'}
              </button>
              <button type="button" onClick={() => setHoursOpen(null)} className="px-4 py-2 rounded-xl btn-secondary text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-sm theme-text-muted mb-2">
              Usuario: <span className="theme-text">{payUser?.email}</span>
            </p>
            <p className="text-[11px] theme-text-dim mb-4">
              Los importes y nombres de plan se editan en la tarjeta superior <strong className="theme-text font-normal">Costos de suscripción</strong>; guarda y recarga si no ves un plan nuevo.
            </p>
            {planesSorted.length === 0 ? (
              <p className="text-sm text-amber-400 mb-3">No hay planes. Reinicia el backend o guarda planes arriba.</p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs theme-text-muted mb-1">Plan (rol)</label>
                <select
                  value={payPlanRole}
                  onChange={(e) => setPayPlanRole(e.target.value)}
                  className="theme-input w-full px-3 py-2 rounded-xl border"
                >
                  <option value="">— Elige un plan —</option>
                  {planesSorted.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.role} · ${Number(p.precio_mxn || 0).toFixed(0)}/mes · {p.activo === false ? 'inactivo' : 'activo'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-1">Meses</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={payMonths}
                  onChange={(e) => setPayMonths(Number(e.target.value) || 1)}
                  className="theme-input w-full px-3 py-2 rounded-xl border"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={solicitarPago}
                disabled={paying || !payPlanRole || planesSorted.length === 0}
                className="px-4 py-2 rounded-xl btn-primary font-medium disabled:opacity-50"
              >
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
              El perfil se extiende cuando Mercado Pago confirma el pago (webhook). Para producción usa credenciales productivas en el VPS.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
