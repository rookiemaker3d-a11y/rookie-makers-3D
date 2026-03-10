import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

const DEFAULT_CATEGORIES = ['oficina', 'escuela', 'industrial', 'hogar', 'otros']

export default function EditorPaginaPublica() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    fontSizeTitle: 32,
    fontSizeSubtitle: 18,
    backgroundColor: '',
    categories: [...DEFAULT_CATEGORIES],
  })
  const [categoriesText, setCategoriesText] = useState('oficina, escuela, industrial, hogar, otros')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    fetch(`${API_BASE}/api/pagina-publica/config`)
      .then((r) => r.json())
      .then((data) => {
        setConfig({
          fontSizeTitle: data.fontSizeTitle ?? 32,
          fontSizeSubtitle: data.fontSizeSubtitle ?? 18,
          backgroundColor: data.backgroundColor ?? '',
          categories: Array.isArray(data.categories) ? data.categories : [...DEFAULT_CATEGORIES],
        })
        setCategoriesText(
          Array.isArray(data.categories) ? data.categories.join(', ') : 'oficina, escuela, industrial, hogar, otros'
        )
      })
      .catch(() => setError('Error al cargar configuración'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    setSaving(true)
    const categories = categoriesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      await api('/pagina-publica/config', {
        method: 'PUT',
        body: JSON.stringify({
          fontSizeTitle: Number(config.fontSizeTitle) || 32,
          fontSizeSubtitle: Number(config.fontSizeSubtitle) || 18,
          backgroundColor: config.backgroundColor || undefined,
          categories: categories.length ? categories : undefined,
        }),
      })
      setConfig((c) => ({
        ...c,
        fontSizeTitle: Number(config.fontSizeTitle) || 32,
        fontSizeSubtitle: Number(config.fontSizeSubtitle) || 18,
        backgroundColor: config.backgroundColor || '',
        categories: categories.length ? categories : c.categories,
      }))
      setMsg('Configuración guardada. La página pública (Proyectos) usará estos estilos y categorías.')
    } catch (err) {
      setError('Error al guardar. Solo el administrador puede editar la página pública.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Editor de página pública"
        subtitle="Tamaños de texto, color de fondo y categorías para la landing de Proyectos. Solo administrador."
      />
      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card className="theme-table">
        <form onSubmit={submit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium theme-text mb-1">Tamaño título (px)</label>
            <input
              type="number"
              min="12"
              max="120"
              value={config.fontSizeTitle}
              onChange={(e) => setConfig((c) => ({ ...c, fontSizeTitle: e.target.value }))}
              className="theme-input w-24 px-3 py-2 rounded-lg border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text mb-1">Tamaño subtítulo (px)</label>
            <input
              type="number"
              min="10"
              max="48"
              value={config.fontSizeSubtitle}
              onChange={(e) => setConfig((c) => ({ ...c, fontSizeSubtitle: e.target.value }))}
              className="theme-input w-24 px-3 py-2 rounded-lg border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text mb-1">Color de fondo (CSS, ej. #050508 o transparent)</label>
            <input
              type="text"
              placeholder="#050508"
              value={config.backgroundColor}
              onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
              className="theme-input w-full max-w-xs px-3 py-2 rounded-lg border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium theme-text mb-1">Categorías (separadas por coma)</label>
            <input
              type="text"
              placeholder="oficina, escuela, industrial, hogar, otros"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              className="theme-input w-full max-w-md px-3 py-2 rounded-lg border"
            />
            <p className="text-xs theme-text-muted mt-1">Ej.: oficina, escuela, industrial, hogar, otros</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg btn-primary font-medium disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
