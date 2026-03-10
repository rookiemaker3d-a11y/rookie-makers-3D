import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Type, Palette, Tags, Save, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''
const DEFAULT_CATEGORIES = ['oficina', 'escuela', 'industrial', 'hogar', 'otros']
const FONDOS_PRESET = [
  '#050508',
  '#0f0f1c',
  '#13131a',
  '#071428',
  '#0d0d12',
  '#ffffff',
  '#1a1a2e',
  '#111827',
]

export default function EditorPaginaPublica() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    fontSizeTitle: 32,
    fontSizeSubtitle: 18,
    backgroundColor: '#050508',
    categories: [...DEFAULT_CATEGORIES],
  })
  const [categoriesText, setCategoriesText] = useState('oficina, escuela, industrial, hogar, otros')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    fetch(`${API_BASE}/api/pagina-publica/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const title = data.fontSizeTitle ?? 32
        const subtitle = data.fontSizeSubtitle ?? 18
        const bg = data.backgroundColor || '#050508'
        const cats = Array.isArray(data.categories) ? data.categories : [...DEFAULT_CATEGORIES]
        setConfig({
          fontSizeTitle: title,
          fontSizeSubtitle: subtitle,
          backgroundColor: bg,
          categories: cats,
        })
        setCategoriesText(cats.join(', '))
      })
      .catch(() => {
        setConfig({ fontSizeTitle: 32, fontSizeSubtitle: 18, backgroundColor: '#050508', categories: [...DEFAULT_CATEGORIES] })
        setCategoriesText(DEFAULT_CATEGORIES.join(', '))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    setSaving(true)
    const categories = categoriesText.split(',').map((s) => s.trim()).filter(Boolean)
    try {
      const res = await api('/pagina-publica/config', {
        method: 'PUT',
        body: JSON.stringify({
          fontSizeTitle: Number(config.fontSizeTitle) || 32,
          fontSizeSubtitle: Number(config.fontSizeSubtitle) || 18,
          backgroundColor: config.backgroundColor || undefined,
          categories: categories.length ? categories : undefined,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setConfig((c) => ({
        ...c,
        fontSizeTitle: Number(config.fontSizeTitle) || 32,
        fontSizeSubtitle: Number(config.fontSizeSubtitle) || 18,
        backgroundColor: (config.backgroundColor && config.backgroundColor.trim()) || '#050508',
        categories: categories.length ? categories : c.categories,
      }))
      setCategoriesText(categories.length ? categories.join(', ') : categoriesText)
      setMsg('Guardado. La página pública ya usa estos estilos.')
    } catch (err) {
      setError(err?.message || 'Error al guardar. Comprueba la conexión con el backend.')
    } finally {
      setSaving(false)
    }
  }

  const titlePx = Math.max(16, Math.min(80, Number(config.fontSizeTitle) || 32))
  const subtitlePx = Math.max(10, Math.min(28, Number(config.fontSizeSubtitle) || 18))
  const bg = (config.backgroundColor && config.backgroundColor.trim()) ? config.backgroundColor : '#050508'
  const previewCats = categoriesText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold theme-text">Editor de página pública</h1>
        <Link
          to="/proyectos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-medium text-sm transition hover:opacity-90"
          style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}
        >
          <ExternalLink className="w-4 h-4" />
          Ver página pública
        </Link>
      </div>

      {msg && <p className="text-emerald-500 text-sm font-medium">{msg}</p>}
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-2xl border-2 p-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider theme-text-muted mb-4">
              <Type className="w-4 h-4" />
              Hero — Tamaños de texto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1">Tamaño del título (px)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={titlePx}
                    onChange={(e) => setConfig((c) => ({ ...c, fontSizeTitle: e.target.value }))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: 'var(--theme-border)' }}
                  />
                  <span className="text-sm font-mono tabular-nums theme-text w-10">{titlePx}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1">Tamaño del subtítulo (px)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="12"
                    max="28"
                    value={subtitlePx}
                    onChange={(e) => setConfig((c) => ({ ...c, fontSizeSubtitle: e.target.value }))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: 'var(--theme-border)' }}
                  />
                  <span className="text-sm font-mono tabular-nums theme-text w-10">{subtitlePx}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-2 p-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider theme-text-muted mb-4">
              <Palette className="w-4 h-4" />
              Color de fondo
            </h2>
            <div className="space-y-4">
              <p className="text-xs theme-text-muted">Presets</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {FONDOS_PRESET.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, backgroundColor: color }))}
                    className="aspect-square rounded-xl border-2 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-accent)]"
                    style={{
                      backgroundColor: color,
                      borderColor: bg === color ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="#050508"
                  value={config.backgroundColor}
                  onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border text-sm font-mono"
                  style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                />
                <input
                  type="color"
                  value={bg.startsWith('#') && bg.length >= 7 ? bg : '#050508'}
                  onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                  className="w-10 h-10 rounded-xl border cursor-pointer"
                  style={{ borderColor: 'var(--theme-border)' }}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-2 p-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider theme-text-muted mb-4">
              <Tags className="w-4 h-4" />
              Categorías (Galería)
            </h2>
            <p className="text-xs theme-text-muted mb-2">Etiquetas separadas por coma. Se muestran en la sección Galería de la página pública.</p>
            <input
              type="text"
              placeholder="oficina, escuela, industrial, hogar, otros"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium btn-primary disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <Link
              to="/proyectos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition hover:opacity-90"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir página en nueva pestaña
            </Link>
          </div>
        </form>

        <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
          <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
            <span className="text-xs font-mono theme-text-muted">Vista previa — Hero</span>
            <span className="text-[10px] uppercase tracking-wider theme-text-muted">Actualización en vivo</span>
          </div>
          <div
            className="p-6 min-h-[380px] flex flex-col justify-center transition-colors duration-200"
            style={{ backgroundColor: bg }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#00e5ff' }}>Manufactura Aditiva de Precisión</p>
            <h1
              className="leading-tight font-bold text-white mb-2"
              style={{ fontSize: `${Math.min(titlePx, 48)}px` }}
            >
              Del Bit <span style={{ color: '#00e5ff' }}>al Átomo</span>
            </h1>
            <p className="font-serif italic mb-4" style={{ fontSize: `${Math.min(subtitlePx, 20)}px`, color: '#c9a96e' }}>
              Tu visión, materializada
            </p>
            <p className="text-sm max-w-xs mb-5" style={{ color: 'rgba(232,232,240,0.6)' }}>
              Modelado 3D de precisión y acabado artesanal para piezas únicas.
            </p>
            {previewCats.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewCats.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-mono px-2 py-1 rounded border border-white/20"
                    style={{ color: 'rgba(232,232,240,0.8)' }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
