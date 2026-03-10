import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Seguridad() {
  const { api, user } = useAuth()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [step, setStep] = useState('idle')
  const [qrUri, setQrUri] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    api('/auth/mfa/status')
      .then((r) => r.json())
      .then((d) => setMfaEnabled(!!d.mfa_enabled))
      .catch(() => setMfaEnabled(false))
      .finally(() => setLoading(false))
  }, [api])

  const handleSetup = async () => {
    setMsg('')
    setStep('setup')
    setQrUri('')
    setCode('')
    try {
      const res = await api('/auth/mfa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setQrUri(data.provisioning_uri || '')
      setStep('confirm')
      setMsg('Escanea el QR con Google Authenticator o Authy e introduce el código de 6 dígitos.')
    } catch (e) {
      setMsg(e.message || 'Error al configurar MFA')
    }
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await api('/auth/mfa/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: code.replace(/\s/g, '') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Código incorrecto')
      setMfaEnabled(true)
      setStep('idle')
      setCode('')
      setMsg('MFA activado correctamente.')
    } catch (e) {
      setMsg(e.message || 'Error')
    }
  }

  const handleDisable = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await api('/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: code.replace(/\s/g, '') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setMfaEnabled(false)
      setStep('idle')
      setCode('')
      setMsg('MFA desactivado.')
    } catch (e) {
      setMsg(e.message || 'Error')
    }
  }

  if (loading) return <div className="p-6 theme-text-muted">Cargando...</div>

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold theme-text mb-2 flex items-center gap-2">
        <Shield className="w-7 h-7" />
        Seguridad
      </h1>
      <p className="theme-text-muted text-sm mb-6">Autenticación en dos pasos (MFA) para tu cuenta.</p>

      {msg && (
        <div className="rounded-lg border p-3 text-sm mb-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text)' }}>
          {msg}
        </div>
      )}

      <div className="rounded-xl border p-6 mb-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="theme-text font-medium">Autenticación en dos pasos (TOTP)</span>
          {mfaEnabled ? (
            <span className="flex items-center gap-1 text-emerald-600 text-sm"><ShieldCheck className="w-4 h-4" /> Activo</span>
          ) : (
            <span className="text-sm theme-text-muted">Inactivo</span>
          )}
        </div>

        {step === 'idle' && (
          <div className="flex gap-2">
            {!mfaEnabled ? (
              <button type="button" onClick={handleSetup} className="px-4 py-2 rounded-xl font-medium border transition" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>
                Activar MFA
              </button>
            ) : (
              <button type="button" onClick={() => { setStep('disable'); setCode(''); setMsg(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium border transition" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>
                <ShieldOff className="w-4 h-4" />
                Desactivar MFA
              </button>
            )}
          </div>
        )}

        {step === 'confirm' && qrUri && (
          <div className="space-y-4">
            <p className="text-sm theme-text-muted">Escanea el QR con tu app e introduce el código:</p>
            <div className="flex justify-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`} alt="QR MFA" className="rounded-lg border" style={{ borderColor: 'var(--theme-border)' }} />
            </div>
            <form onSubmit={handleConfirm} className="flex gap-2 items-end">
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="flex-1 px-4 py-2 rounded-xl border text-center text-lg tracking-widest" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              <button type="submit" disabled={code.length < 6} className="px-4 py-2 rounded-xl font-medium border transition disabled:opacity-50" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>Confirmar</button>
            </form>
            <button type="button" onClick={() => { setStep('idle'); setCode(''); setMsg(''); }} className="text-sm theme-text-muted hover:underline">Cancelar</button>
          </div>
        )}

        {step === 'disable' && (
          <form onSubmit={handleDisable} className="space-y-4">
            <p className="text-sm theme-text-muted">Introduce tu código actual de 6 dígitos para desactivar MFA:</p>
            <div className="flex gap-2">
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="flex-1 px-4 py-2 rounded-xl border text-center text-lg tracking-widest" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              <button type="submit" disabled={code.length < 6} className="px-4 py-2 rounded-xl font-medium border transition disabled:opacity-50" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>Desactivar</button>
            </div>
            <button type="button" onClick={() => { setStep('idle'); setCode(''); setMsg(''); }} className="text-sm theme-text-muted hover:underline">Cancelar</button>
          </form>
        )}
      </div>
    </div>
  )
}
