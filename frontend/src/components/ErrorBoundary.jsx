import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
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
          {this.state.error?.message && (
            <p style={{ fontSize: '0.8rem', color: 'var(--theme-text-dim)', marginBottom: 12 }}>
              {this.state.error.message}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`${import.meta.env.BASE_URL}login`}
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
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                background: 'var(--theme-bg-card)',
                border: '1px solid var(--theme-border)',
                borderRadius: 8,
                color: 'var(--theme-text)',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}