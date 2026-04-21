import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('user')
      if (t && u) {
        const parsed = JSON.parse(u)
        if (parsed && typeof parsed.email === 'string') return { token: t, ...parsed }
      }
    } catch (_) {}
    return null
  })

const API_BASE = import.meta.env.VITE_API_URL || ''

  const login = useCallback(async (email, password) => {
    let res
    try {
      res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim().toLowerCase(), password: password || '' }),
      })
    } catch (err) {
      const base = import.meta.env.VITE_API_URL || ''
      const urlIntentada = base ? `${base}/api/auth/login` : '(vacío; revisa VITE_API_URL donde despliegas el frontend)'
      throw new Error(
        'No se pudo conectar al backend. ' +
        (!base
          ? 'Donde despliegas el frontend (Render Static Site, Vercel, etc.) añade la variable VITE_API_URL = https://rookie-makers-3d.onrender.com y vuelve a desplegar.'
          : `URL llamada: ${urlIntentada}. En el backend (Render): 1) Logs para ver si arranca. 2) Environment → CORS_ORIGINS = * o la URL de este frontend.`)
      )
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data.detail
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : 'Correo o contraseña incorrectos'
      throw new Error(message)
    }
    // Login con MFA: el backend pide código en segundo paso
    if (data.mfa_required && data.temp_token) {
      return { mfaRequired: true, tempToken: data.temp_token, email: data.email || '' }
    }
    if (!data.access_token || !data.user) {
      throw new Error('Respuesta del servidor incorrecta')
    }
    const u = { ...data.user, token: data.access_token }
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(u)
    return u
  }, [])

  const completeMfaLogin = useCallback(async (tempToken, code) => {
    const res = await fetch(`${API_BASE}/api/auth/mfa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken, code: (code || '').trim().replace(/\s/g, '') }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = typeof data.detail === 'string' ? data.detail : 'Código incorrecto o expirado'
      throw new Error(msg)
    }
    if (!data.access_token || !data.user) throw new Error('Respuesta del servidor incorrecta')
    const u = { ...data.user, token: data.access_token }
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const api = useCallback((path, options = {}) => {
    const token = user?.token
    const url = path.startsWith('http') ? path : `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`
    const isFormData = options.body instanceof FormData
    return fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }).then((res) => {
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setTimeout(() => { window.location.href = `${import.meta.env.BASE_URL}login` }, 100)
      }
      return res
    })
  }, [user?.token])

  const apiUpload = useCallback((path, formData) => {
    return api(path, { method: 'POST', body: formData })
  }, [api])

  const refreshUser = useCallback(async () => {
    if (!user?.token) return
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const next = { ...data, token: user.token }
        setUser(next)
        localStorage.setItem('user', JSON.stringify(data))
      }
    } catch (_) {}
  }, [user?.token])

  return (
    <AuthContext.Provider value={{ user, login, completeMfaLogin, logout, api, apiUpload, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
