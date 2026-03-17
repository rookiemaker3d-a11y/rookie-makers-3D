import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { User, Lock } from 'lucide-react'

export default function Configuracion() {
  const { api, user, refreshUser } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState('')
  const [errPerfil, setErrPerfil] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [msgPassword, setMsgPassword] = useState('')
  const [errPassword, setErrPassword] = useState('')

  useEffect(() => {
    api('/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setPerfil(data)
        setNombre(data?.nombre ?? data?.email ?? '')
        refreshUser()
      })
      .catch(() => setPerfil(null))
      .finally(() => setLoading(false))
  }, [api, refreshUser])

  const handleSavePerfil = async (e) => {
    e.preventDefault()
    setErrPerfil('')
    setMsgPerfil('')
    setSavingPerfil(true)
    try {
      const res = await api('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ nombre: nombre.trim() || null }),
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
