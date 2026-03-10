import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--theme-bg-page)',
            color: 'var(--theme-text)',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ marginBottom: 16, color: 'var(--theme-text-muted)' }}>
            Recarga la página o intenta ir al login.
          </p>
          <a
            href="/login"
            style={{
              padding: '10px 20px',
              background: 'var(--theme-bg-card)',
              border: '1px solid var(--theme-border)',
              borderRadius: 8,
              color: 'var(--theme-text)',
              textDecoration: 'none',
            }}
          >
            Ir al login
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
