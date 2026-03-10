import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Type, Palette, Tags, Eye, ExternalLink, Save } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''

const DEFAULT_CATEGORIES = ['oficina', 'escuela', 'industrial', 'hogar', 'otros']

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
        setConfig((c) => ({ ...c }))
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
        title="Editor de plantilla — Página pública"
        subtitle="Configura la landing de Proyectos como en un editor tipo Wix. Cambios en vivo en la vista previa."
      />
      {msg && <p className="text-emerald-500 text-sm">{msg}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de edición por secciones (estilo Wix) */}
        <Card className="theme-table">
          <form onSubmit={submit} className="p-6 space-y-8">
            {/* Sección Hero */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 theme-text font-medium">
                <Type className="w-5 h-5 text-cyan-500" />
                Hero — Títulos
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm theme-text-muted mb-1">Tamaño título (px)</label>
                  <input
                    type="number"
                    min="12"
                    max="120"
                    value={config.fontSizeTitle}
                    onChange={(e) => setConfig((c) => ({ ...c, fontSizeTitle: e.target.value }))}
                    className="theme-input w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="block text-sm theme-text-muted mb-1">Tamaño subtítulo (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="48"
                    value={config.fontSizeSubtitle}
                    onChange={(e) => setConfig((c) => ({ ...c, fontSizeSubtitle: e.target.value }))}
                    className="theme-input w-full px-3 py-2 rounded-lg border"
                  />
                </div>
              </div>
            </section>

            {/* Sección Colores */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 theme-text font-medium">
                <Palette className="w-5 h-5 text-cyan-500" />
                Colores — Fondo
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">Color de fondo (hex o CSS)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="#050508"
                    value={config.backgroundColor}
                    onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                    className="theme-input flex-1 px-3 py-2 rounded-lg border"
                  />
                  <input
                    type="color"
                    value={bg.startsWith('#') && bg.length >= 7 ? bg : '#050508'}
                    onChange={(e) => setConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                </div>
              </div>
            </section>

            {/* Sección Categorías */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 theme-text font-medium">
                <Tags className="w-5 h-5 text-cyan-500" />
                Categorías (Galería)
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">Etiquetas separadas por coma</label>
                <input
                  type="text"
                  placeholder="oficina, escuela, industrial, hogar, otros"
                  value={categoriesText}
                  onChange={(e) => setCategoriesText(e.target.value)}
                  className="theme-input w-full px-3 py-2 rounded-lg border"
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary font-medium disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando…' : 'Guardar plantilla'}
              </button>
              <Link
                to="/proyectos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border theme-border theme-text hover:opacity-90"
              >
                <ExternalLink className="w-4 h-4" />
                Ver página pública
              </Link>
            </div>
          </form>
        </Card>

        {/* Vista previa en vivo (plantilla ejecutable tipo Wix) */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b theme-border" style={{ background: 'var(--theme-bg-card)' }}>
            <Eye className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium theme-text">Vista previa de tu plantilla</span>
          </div>
          <div
            className="p-6 min-h-[320px] flex flex-col justify-center"
            style={{ backgroundColor: bg }}
          >
            <div className="font-mono text-xs text-[#00e5ff] tracking-wider uppercase mb-2">
              Manufactura Aditiva
            </div>
            <h1
              className="font-display leading-tight text-white mb-2"
              style={{ fontSize: `${Math.min(titleNum, 48)}px` }}
            >
              Del Bit <span className="text-[#00e5ff]">al Átomo</span>
            </h1>
            <p
              className="text-[#c9a96e] font-serif italic max-w-xs"
              style={{ fontSize: `${Math.min(subtitleNum, 24)}px` }}
            >
              Tu visión, materializada
            </p>
            {previewCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {previewCategories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[0.65rem] font-mono px-2 py-1 rounded border border-white/20 text-white/80"
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
