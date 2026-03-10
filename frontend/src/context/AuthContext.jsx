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
      throw new Error('No se pudo conectar al servidor. ¿Está el backend en marcha? (npm start)')
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
    if (!data.access_token || !data.user) {
      throw new Error('Respuesta del servidor incorrecta')
    }
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
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }).then((res) => {
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        window.location.href = '/login'
        return Promise.reject(new Error('Sesión expirada o no autorizado'))
      }
      return res
    })
  }, [user?.token])

  return (
    <AuthContext.Provider value={{ user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
