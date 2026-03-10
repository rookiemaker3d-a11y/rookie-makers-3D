import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui'
import { Type, Palette, Tags, Eye, ExternalLink, Save } from 'lucide-react'
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
  const [openSection, setOpenSection] = useState({ hero: true, colores: true, categorias: true })

  function load() {
    fetch(`${API_BASE}/api/pagina-publica/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setConfig({
          fontSizeTitle: data.fontSizeTitle ?? 32,
          fontSizeSubtitle: data.fontSizeSubtitle ?? 18,
          backgroundColor: data.backgroundColor || '#050508',
          categories: Array.isArray(data.categories) ? data.categories : [...DEFAULT_CATEGORIES],
        })
        setCategoriesText(
          Array.isArray(data.categories) ? data.categories.join(', ') : 'oficina, escuela, industrial, hogar, otros'
        )
      })
      .catch(() => {
        setCategoriesText('oficina, escuela, industrial, hogar, otros')
      })
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
        backgroundColor: config.backgroundColor || '#050508',
        categories: categories.length ? categories : c.categories,
      }))
      setMsg('Plantilla guardada. La página pública ya usa estos estilos.')
    } catch (err) {
      setError('Error al guardar. Comprueba que el backend tenga el endpoint /api/pagina-publica/config.')
    } finally {
      setSaving(false)
    }
  }

  const titleNum = Number(config.fontSizeTitle) || 32
  const subtitleNum = Number(config.fontSizeSubtitle) || 18
  const bg = (config.backgroundColor && config.backgroundColor.trim()) ? config.backgroundColor : '#050508'
  const previewCategories = categoriesText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5)

  const toggle = (key) => setOpenSection((s) => ({ ...s, [key]: !s[key] }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra tipo editor: título + estado */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold theme-text tracking-tight">Editor de plantilla</h1>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
            style={{ color: 'var(--theme-accent)', borderColor: 'var(--theme-border)', background: 'var(--theme-bg-page)' }}
          >
            Página pública
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs theme-text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
          Vista previa en vivo
        </div>
      </div>

      {msg && <p className="text-emerald-500 text-sm">{msg}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel lateral: acordeones estilo pro */}
        <div className="space-y-2">
          <form onSubmit={submit} className="space-y-2">
            {/* Acordeón Hero */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
              <button
                type="button"
                onClick={() => toggle('hero')}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-90 transition"
                style={{ color: 'var(--theme-text)' }}
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text-muted">
                  <Type className="w-4 h-4 opacity-80" />
                  Hero — Títulos
                </span>
                <span className="text-xs theme-text-muted">{openSection.hero ? '▼' : '▶'}</span>
              </button>
              {openSection.hero && (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">Tamaño título</label>
                      <span className="text-[10px] font-mono theme-text-muted tabular-nums">{config.fontSizeTitle}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="80"
                      value={titleNum}
                      onChange={(e) => setConfig((c) => ({ ...c, fontSizeTitle: e.target.value }))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-500"
                      style={{ background: 'var(--theme-border)' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">Tamaño subtítulo</label>
                      <span className="text-[10px] font-mono theme-text-muted tabular-nums">{config.fontSizeSubtitle}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="36"
                      value={subtitleNum}
                      onChange={(e) => setConfig((c) => ({ ...c, fontSizeSubtitle: e.target.value }))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-500"
                      style={{ background: 'var(--theme-border)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Acordeón Colores */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
              <button
                type="button"
                onClick={() => toggle('colores')}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-90 transition"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text-muted">
                  <Palette className="w-4 h-4 opacity-80" />
                  Colores — Fondo
                </span>
                <span className="text-xs theme-text-muted">{openSection.colores ? '▼' : '▶'}</span>
              </button>
              {openSection.colores && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">Presets</div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {FONDOS_PRESET.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, backgroundColor: color }))}
                        className="aspect-square rounded-lg border-2 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-card)]"
                        style={{
                          backgroundColor: color,
                          borderColor: bg === color ? 'var(--theme-text)' : 'var(--theme-border)',
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
                      className="theme-input flex-1 px-3 py-2 rounded-lg border text-sm"
                    />
                    <input
                      type="color"
                      value={bg.startsWith('#') && bg.length >= 7 ? bg : '#050508'}
                      onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                      className="w-9 h-9 rounded border cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Acordeón Categorías */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
              <button
                type="button"
                onClick={() => toggle('categorias')}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-90 transition"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-text-muted">
                  <Tags className="w-4 h-4 opacity-80" />
                  Categorías (Galería)
                </span>
                <span className="text-xs theme-text-muted">{openSection.categorias ? '▼' : '▶'}</span>
              </button>
              {openSection.categorias && (
                <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider theme-text-muted mb-2">Etiquetas separadas por coma</label>
                  <input
                    type="text"
                    placeholder="oficina, escuela, industrial, hogar, otros"
                    value={categoriesText}
                    onChange={(e) => setCategoriesText(e.target.value)}
                    className="theme-input w-full px-3 py-2 rounded-lg border text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary font-medium disabled:opacity-60 text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando…' : 'Guardar plantilla'}
              </button>
              <Link
                to="/proyectos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium theme-border theme-text hover:opacity-90"
              >
                <ExternalLink className="w-4 h-4" />
                Ver página pública
              </Link>
            </div>
          </form>
        </div>

        {/* Vista previa con marco tipo ventana */}
        <Card className="overflow-hidden p-0">
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono theme-text-muted">/proyectos</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 theme-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">Vista previa</span>
            </div>
          </div>
          <div
            className="p-6 min-h-[340px] flex flex-col justify-center transition-colors duration-200"
            style={{ backgroundColor: bg }}
          >
            <div className="font-mono text-[10px] text-[#00e5ff] tracking-widest uppercase mb-2">
              Manufactura Aditiva
            </div>
            <h1
              className="font-display leading-tight text-white mb-2"
              style={{ fontSize: `${Math.min(titleNum, 56)}px` }}
            >
              Del Bit <span className="text-[#00e5ff]">al Átomo</span>
            </h1>
            <p
              className="text-[#c9a96e] font-serif italic max-w-xs"
              style={{ fontSize: `${Math.min(subtitleNum, 22)}px` }}
            >
              Tu visión, materializada
            </p>
            {previewCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {previewCategories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[0.6rem] font-mono px-2 py-1 rounded border border-white/20 text-white/80"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
