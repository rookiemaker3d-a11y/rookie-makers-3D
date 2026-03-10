import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaTempToken, setMfaTempToken] = useState('')
  const [mfaEmail, setMfaEmail] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const { login, completeMfaLogin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.mfaRequired && result.tempToken) {
        setMfaTempToken(result.tempToken)
        setMfaEmail(result.email || email)
        setMfaStep(true)
        setMfaCode('')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleMfaSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await completeMfaLogin(mfaTempToken, mfaCode)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Código incorrecto o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ background: 'linear-gradient(to bottom, var(--theme-bg-page), var(--theme-bg-page-via), var(--theme-bg-page))' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border backdrop-blur-xl p-8 transition-colors duration-300"
        style={{
          borderColor: 'var(--theme-border)',
          background: 'var(--theme-bg-card)',
          boxShadow: 'var(--theme-shadow-accent)',
        }}
      >
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ color: 'var(--theme-text-muted)', background: 'var(--theme-bg-header)' }}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--theme-text)' }}>Rookie Makers 3D</h1>
        <p className="text-center mb-6" style={{ color: 'var(--theme-text-muted)' }}>{mfaStep ? 'Código de autenticación' : 'Iniciar sesión'}</p>
        {mfaStep ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3">{error}</div>
            )}
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Introduce el código de 6 dígitos de tu app (Google Authenticator, Authy) para {mfaEmail}.</p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text-muted)' }}>Código</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-xl border transition focus:ring-2 focus:border-transparent text-center text-lg tracking-widest"
                style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                placeholder="000000"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMfaStep(false); setError(''); setMfaCode(''); }}
                className="py-2.5 rounded-xl font-medium border transition flex-1"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="flex-1 py-2.5 rounded-xl font-medium border transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--theme-bg-card-hover)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text-muted)' }}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border transition focus:ring-2 focus:border-transparent"
              style={{
                background: 'var(--theme-input-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text-muted)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border transition focus:ring-2 focus:border-transparent"
              style={{
                background: 'var(--theme-input-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium border transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'var(--theme-bg-card-hover)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        )}
      </motion.div>
    </div>
  )
}
