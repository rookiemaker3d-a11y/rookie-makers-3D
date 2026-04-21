import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { User, Lock, Percent } from 'lucide-react'

const PORCENTAJE_INVERSION_KEY = 'porcentajeInversion'
const defaultPorcentajeInversion = () => {
  try {
    const v = Number(localStorage.getItem(PORCENTAJE_INVERSION_KEY))
    if (!Number.isNaN(v) && v >= 0 && v <= 100) return v
  } catch (_) {}
  return 10
}

export default function Configuracion() {
  const { api, user, refreshUser } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [banco, setBanco] = useState('')
  const [cuenta, setCuenta] = useState('')
  const [clabe, setClabe] = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState('')
  const [errPerfil, setErrPerfil] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [msgPassword, setMsgPassword] = useState('')
  const [errPassword, setErrPassword] = useState('')
  const [porcentajeInversion, setPorcentajeInversion] = useState(defaultPorcentajeInversion)

  useEffect(() => {
    setPorcentajeInversion(defaultPorcentajeInversion())
  }, [])

  useEffect(() => {
    api('/auth/me')
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        if (data && data.email) {
          setPerfil(data)
          setNombre(data?.nombre ?? data?.email ?? '')
          setTelefono(data?.vendedor_telefono ?? '')
          setBanco(data?.vendedor_banco ?? '')
          setCuenta(data?.vendedor_cuenta ?? '')
          setClabe(data?.vendedor_clabe ?? '')
          refreshUser()
        }
      })
      .catch(() => setPerfil(null))
      .finally(() => setLoading(false))
  }, [api, refreshUser])

  const savePorcentajeInversion = (pct) => {
    const n = Math.min(100, Math.max(0, Number(pct) || 0))
    setPorcentajeInversion(n)
    try { localStorage.setItem(PORCENTAJE_INVERSION_KEY, String(n)) } catch (_) {}
  }

  const handleSavePerfil = async (e) => {
    e.preventDefault()
    setErrPerfil('')
    setMsgPerfil('')
    setSavingPerfil(true)
    try {
      const payload = { nombre: nombre.trim() || null }
      if (user?.role === 'vendedor_ventas') {
        payload.telefono = telefono.trim() || null
        payload.banco = banco.trim() || null
        payload.cuenta = cuenta.trim() || null
        payload.clabe = clabe.trim() || null
      }
      const res = await api('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || res.statusText)
      }
      const data = await res.json()
      setPerfil(data)
      setMsgPerfil('Datos actualizados. Se reflejarán en todo el sistema.')
      await refreshUser()
    } catch (err) {
      setErrPerfil(err?.message || 'Error al guardar')
    } finally {
      setSavingPerfil(false)
    }
  }

  const handleCambiarContrasena = async (e) => {
    e.preventDefault()
    setErrPassword('')
    setMsgPassword('')
    if (newPassword !== confirmPassword) {
      setErrPassword('La nueva contraseña y la confirmación no coinciden.')
      return
    }
    if (!currentPassword || !newPassword) {
      setErrPassword('Completa contraseña actual y nueva.')
      return
    }
    setSavingPassword(true)
    try {
      const res = await api('/auth/cambiar-contrasena', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || res.statusText)
      }
      setMsgPassword('Contraseña actualizada. Se envió un correo de confirmación a tu email.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrPassword(err?.message || 'Error al cambiar contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 theme-text-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configuración"
        subtitle="Edita tu nombre y cambia tu contraseña. Los cambios se actualizan en todos los perfiles."
      />

      <Card className="max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 theme-text-muted" />
          <h2 className="text-lg font-semibold theme-text">Mis datos</h2>
        </div>
        <form onSubmit={handleSavePerfil} className="space-y-3">
          <div>
            <label className="block text-sm font-medium theme-text-muted mb-1">Nombre para mostrar</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre o como quieres que aparezca"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              style={{ borderColor: 'var(--theme-border)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text-muted mb-1">Correo</label>
            <p className="px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text-muted text-sm" style={{ borderColor: 'var(--theme-border)' }}>
              {perfil?.email ?? user?.email}
            </p>
            <p className="text-xs theme-text-dim mt-1">El correo no se puede cambiar desde aquí. Contacta al administrador si lo necesitas.</p>
          </div>
          {user?.role === 'vendedor_ventas' && (
            <>
              <div>
                <label className="block text-sm font-medium theme-text-muted mb-1">Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono de contacto"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-muted mb-1">Banco</label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Nombre del banco"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-muted mb-1">Cuenta</label>
                <input
                  type="text"
                  value={cuenta}
                  onChange={(e) => setCuenta(e.target.value)}
                  placeholder="Número de cuenta"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-muted mb-1">CLABE (18 dígitos)</label>
                <input
                  type="text"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  placeholder="CLABE interbancaria"
                  maxLength={22}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
            </>
          )}
          {errPerfil && <p className="text-sm text-red-400">{errPerfil}</p>}
          {msgPerfil && <p className="text-sm text-emerald-400">{msgPerfil}</p>}
          <button
            type="submit"
            disabled={savingPerfil}
            className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white font-medium disabled:opacity-70"
          >
            {savingPerfil ? 'Guardando…' : 'Guardar datos'}
          </button>
        </form>
      </Card>

      <Card className="max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 theme-text-muted" />
          <h2 className="text-lg font-semibold theme-text">Porcentaje para inversión</h2>
        </div>
        <p className="text-sm theme-text-muted mb-4">Al término de la venta, este porcentaje de la ganancia neta se considera para inversión; el resto es ganancia que te queda. Por defecto 10%. Puedes subirlo desde aquí.</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={porcentajeInversion}
            onChange={(e) => savePorcentajeInversion(e.target.value)}
            className="w-24 px-3 py-2 rounded-xl border theme-input"
            style={{ borderColor: 'var(--theme-border)' }}
          />
          <span className="theme-text-muted">% a inversión</span>
        </div>
        <p className="text-xs theme-text-dim mt-2">Se aplica en Dashboard y Productos. El mismo valor se usa en toda la app.</p>
      </Card>

      <Card className="max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 theme-text-muted" />
          <h2 className="text-lg font-semibold theme-text">Cambiar contraseña</h2>
        </div>
        <p className="text-sm theme-text-muted mb-4">Tras cambiar la contraseña se enviará un correo de confirmación a tu Gmail.</p>
        <form onSubmit={handleCambiarContrasena} className="space-y-3">
          <div>
            <label className="block text-sm font-medium theme-text-muted mb-1">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              style={{ borderColor: 'var(--theme-border)' }}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text-muted mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mín. 12 caracteres, mayúscula, minúscula, número y carácter especial"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              style={{ borderColor: 'var(--theme-border)' }}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text-muted mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              style={{ borderColor: 'var(--theme-border)' }}
              autoComplete="new-password"
            />
          </div>
          {errPassword && <p className="text-sm text-red-400">{errPassword}</p>}
          {msgPassword && <p className="text-sm text-emerald-400">{msgPassword}</p>}
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white font-medium disabled:opacity-70"
          >
            {savingPassword ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </Card>
    </div>
  )
}
