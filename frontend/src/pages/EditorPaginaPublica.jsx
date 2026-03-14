import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ChevronDown, Save, ExternalLink, RotateCcw, Layout, Type, Palette } from 'lucide-react'
import LandingPreview from '../components/LandingPreview'

const API_BASE = import.meta.env.VITE_API_URL || ''

const DEFAULT_LANDING = {
  theme: 'cyan',
  hero: {
    tag: 'Impresión 3D profesional',
    titleLine1: 'Del Bit',
    titleLine2: 'al Átomo',
    titleAccent: 'al Átomo',
    tagline: 'Precisión que transforma ideas en realidad',
    description: 'Diseño, prototipado y fabricación aditiva para empresas y creadores.',
    ctaPrimary: 'Solicitar cotización',
    ctaSecondary: 'Ver galería',
  },
  stats: [
    { value: '500+', label: 'Piezas entregadas' },
    { value: '0.05', label: 'mm precisión' },
    { value: '24/7', label: 'Producción' },
  ],
  process: [
    { number: '01', title: 'Diseño', text: 'Recibimos tu archivo o idea y lo preparamos para impresión.' },
    { number: '02', title: 'Fabricación', text: 'Impresión con materiales de calidad y control de parámetros.' },
    { number: '03', title: 'Entrega', text: 'Acabado y entrega en tiempo y forma.' },
  ],
  gallery: [
    { label: 'Prototipos', name: 'Prototipos industriales' },
    { label: 'Piezas', name: 'Piezas funcionales' },
    { label: 'Arte', name: 'Arte y decoración' },
  ],
  cta: {
    tag: '¿Listo para empezar?',
    title: 'Cuéntanos tu proyecto',
    subtitle: 'Cotización sin compromiso.',
    buttonText: 'Contactar',
    buttonMailto: 'mailto:contacto@ejemplo.com',
    whatsappText: 'https://wa.me/521234567890',
  },
  footer: {
    logoText: 'Rookie Makers',
    copyright: '© 2025 Rookie Makers. Todos los derechos reservados.',
    links: [{ label: 'Inicio', href: '#' }, { label: 'Servicios', href: '#servicios' }, { label: 'Contacto', href: '#contacto' }],
  },
  nav: {
    links: [
      { label: 'Inicio', href: '#' },
      { label: 'Proceso', href: '#proceso' },
      { label: 'Galería', href: '#galeria' },
      { label: 'Contacto', href: '#contacto' },
    ],
    ctaText: 'Cotizar',
  },
}

function Accordion({ id, open, onToggle, title, icon: Icon, children }) {
  return (
    <div className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
      <button
        type="button"
        onClick={() => onToggle(open ? null : id)}
        className="w-full flex items-center justify-between gap-2 py-3 px-2 text-left font-medium text-sm theme-text hover:opacity-90"
      >
        {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-accent)' }} />}
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-2 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

export default function EditorPaginaPublica() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [landing, setLanding] = useState(DEFAULT_LANDING)
  const [config, setConfig] = useState({ fontSizeTitle: 36, fontSizeSubtitle: 18 })
  const [openSection, setOpenSection] = useState('variant')
  const [viewport, setViewport] = useState('desktop') // desktop | tablet | mobile
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/pagina-publica/landing`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/api/pagina-publica/config`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([landingData, configData]) => {
        if (landingData && typeof landingData === 'object') setLanding((prev) => ({ ...DEFAULT_LANDING, ...prev, ...landingData }))
        if (configData && (configData.fontSizeTitle != null || configData.fontSizeSubtitle != null)) {
          setConfig((c) => ({
            fontSizeTitle: configData.fontSizeTitle ?? c.fontSizeTitle,
            fontSizeSubtitle: configData.fontSizeSubtitle ?? c.fontSizeSubtitle,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateLanding = (key, value) => setLanding((prev) => ({ ...prev, [key]: value }))
  const updateHero = (key, value) => setLanding((prev) => ({ ...prev, hero: { ...(prev.hero || {}), [key]: value } }))
  const updateCta = (key, value) => setLanding((prev) => ({ ...prev, cta: { ...(prev.cta || {}), [key]: value } }))
  const updateFooter = (key, value) => setLanding((prev) => ({ ...prev, footer: { ...(prev.footer || {}), [key]: value } }))
  const updateNav = (key, value) => setLanding((prev) => ({ ...prev, nav: { ...(prev.nav || {}), [key]: value } }))

  const save = async () => {
    setError('')
    setMsg('')
    setSaving(true)
    try {
      const res = await api('/pagina-publica/landing', { method: 'PUT', body: JSON.stringify(landing) })
      if (!res.ok) throw new Error('Error al guardar')
      await api('/pagina-publica/config', {
        method: 'PUT',
        body: JSON.stringify({ fontSizeTitle: config.fontSizeTitle, fontSizeSubtitle: config.fontSizeSubtitle }),
      })
      setMsg('Landing guardada correctamente.')
    } catch (err) {
      setError(err?.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!window.confirm('¿Restaurar la landing a los valores por defecto?')) return
    setLanding(JSON.parse(JSON.stringify(DEFAULT_LANDING)))
    setError('')
    setMsg('')
    setSaving(true)
    try {
      await api('/pagina-publica/landing', { method: 'PUT', body: JSON.stringify(DEFAULT_LANDING) })
      setMsg('Landing restaurada a valores por defecto.')
    } catch (err) {
      setError(err?.message || 'Error al resetear.')
    } finally {
      setSaving(false)
    }
  }

  const viewWeb = () => window.open('/proyectos', '_blank')

  const hero = landing.hero || DEFAULT_LANDING.hero
  const stats = landing.stats || DEFAULT_LANDING.stats
  const process = landing.process || DEFAULT_LANDING.process
  const gallery = landing.gallery || DEFAULT_LANDING.gallery
  const cta = landing.cta || DEFAULT_LANDING.cta
  const footer = landing.footer || DEFAULT_LANDING.footer
  const nav = landing.nav || DEFAULT_LANDING.nav

  const previewWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-4 py-2 px-1">
        <h1 className="text-xl font-bold theme-text">Editor de página pública</h1>
        {msg && <p className="text-emerald-500 text-sm">{msg}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="flex-1 flex min-h-0 gap-4">
        {/* Sidebar */}
        <div
          className="w-80 shrink-0 flex flex-col overflow-hidden rounded-xl border-2"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}
        >
          <div className="p-2 overflow-y-auto flex-1">
            <Accordion id="variant" open={openSection === 'variant'} onToggle={setOpenSection} title="Variante de página" icon={Layout}>
              <label className="block text-xs theme-text-muted mb-1">Tema</label>
              <select
                value={landing.theme || 'cyan'}
                onChange={(e) => updateLanding('theme', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                <option value="cyan">Cyan (Del Bit al Átomo)</option>
                <option value="green">Verde minimalista</option>
              </select>
            </Accordion>

            <Accordion id="hero" open={openSection === 'hero'} onToggle={setOpenSection} title="Hero" icon={Type}>
              {['tag', 'titleLine1', 'titleLine2', 'titleAccent', 'tagline', 'description', 'ctaPrimary', 'ctaSecondary'].map((key) => (
                <div key={key}>
                  <label className="block text-xs theme-text-muted mb-0.5">{key}</label>
                  <input
                    type="text"
                    value={hero[key] || ''}
                    onChange={(e) => updateHero(key, e.target.value)}
                    className="w-full px-2 py-1.5 rounded border text-sm"
                    style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                </div>
              ))}
            </Accordion>

            <Accordion id="stats" open={openSection === 'stats'} onToggle={setOpenSection} title="Stats">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Valor"
                    value={s.value}
                    onChange={(e) => {
                      const next = [...stats]
                      next[i] = { ...next[i], value: e.target.value }
                      updateLanding('stats', next)
                    }}
                    className="flex-1 px-2 py-1 rounded border text-sm"
                    style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                  <input
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => {
                      const next = [...stats]
                      next[i] = { ...next[i], label: e.target.value }
                      updateLanding('stats', next)
                    }}
                    className="flex-1 px-2 py-1 rounded border text-sm"
                    style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  />
                  <button type="button" onClick={() => updateLanding('stats', stats.filter((_, j) => j !== i))} className="text-red-500 text-xs px-1">Quitar</button>
                </div>
              ))}
              <button type="button" onClick={() => updateLanding('stats', [...stats, { value: '', label: '' }])} className="text-xs theme-text-muted hover:underline">+ Añadir</button>
            </Accordion>

            <Accordion id="process" open={openSection === 'process'} onToggle={setOpenSection} title="Proceso (3 pasos)">
              {process.map((step, i) => (
                <div key={i} className="space-y-1 border-b pb-2" style={{ borderColor: 'var(--theme-border)' }}>
                  <input placeholder="Número" value={step.number} onChange={(e) => { const n = [...process]; n[i] = { ...n[i], number: e.target.value }; updateLanding('process', n) }} className="w-full px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                  <input placeholder="Título" value={step.title} onChange={(e) => { const n = [...process]; n[i] = { ...n[i], title: e.target.value }; updateLanding('process', n) }} className="w-full px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                  <textarea placeholder="Texto" value={step.text} onChange={(e) => { const n = [...process]; n[i] = { ...n[i], text: e.target.value }; updateLanding('process', n) }} rows={2} className="w-full px-2 py-1 rounded border text-sm resize-none" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                </div>
              ))}
            </Accordion>

            <Accordion id="gallery" open={openSection === 'gallery'} onToggle={setOpenSection} title="Galería">
              {gallery.map((g, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input placeholder="Label" value={g.label} onChange={(e) => { const n = [...gallery]; n[i] = { ...n[i], label: e.target.value }; updateLanding('gallery', n) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                  <input placeholder="Nombre" value={g.name} onChange={(e) => { const n = [...gallery]; n[i] = { ...n[i], name: e.target.value }; updateLanding('gallery', n) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                  <button type="button" onClick={() => updateLanding('gallery', gallery.filter((_, j) => j !== i))} className="text-red-500 text-xs">Quitar</button>
                </div>
              ))}
              <button type="button" onClick={() => updateLanding('gallery', [...gallery, { label: '', name: '' }])} className="text-xs theme-text-muted hover:underline">+ Añadir</button>
            </Accordion>

            <Accordion id="cta" open={openSection === 'cta'} onToggle={setOpenSection} title="CTA">
              {['tag', 'title', 'subtitle', 'buttonText', 'buttonMailto', 'whatsappText'].map((key) => (
                <div key={key}>
                  <label className="block text-xs theme-text-muted mb-0.5">{key}</label>
                  <input type="text" value={cta[key] || ''} onChange={(e) => updateCta(key, e.target.value)} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                </div>
              ))}
            </Accordion>

            <Accordion id="footer" open={openSection === 'footer'} onToggle={setOpenSection} title="Footer">
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">logoText</label>
                <input type="text" value={footer.logoText || ''} onChange={(e) => updateFooter('logoText', e.target.value)} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">copyright</label>
                <input type="text" value={footer.copyright || ''} onChange={(e) => updateFooter('copyright', e.target.value)} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">Enlaces (label, href)</label>
                {(footer.links || []).map((link, i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input placeholder="label" value={link.label} onChange={(e) => { const l = [...(footer.links || [])]; l[i] = { ...l[i], label: e.target.value }; updateFooter('links', l) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                    <input placeholder="href" value={link.href} onChange={(e) => { const l = [...(footer.links || [])]; l[i] = { ...l[i], href: e.target.value }; updateFooter('links', l) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                    <button type="button" onClick={() => updateFooter('links', (footer.links || []).filter((_, j) => j !== i))} className="text-red-500 text-xs">Quitar</button>
                  </div>
                ))}
                <button type="button" onClick={() => updateFooter('links', [...(footer.links || []), { label: '', href: '#' }])} className="text-xs theme-text-muted hover:underline">+ Enlace</button>
              </div>
            </Accordion>

            <Accordion id="nav" open={openSection === 'nav'} onToggle={setOpenSection} title="Navegación">
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">CTA header</label>
                <input type="text" value={nav.ctaText || ''} onChange={(e) => updateNav('ctaText', e.target.value)} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">Enlaces</label>
                {(nav.links || []).map((link, i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input placeholder="label" value={link.label} onChange={(e) => { const l = [...(nav.links || [])]; l[i] = { ...l[i], label: e.target.value }; updateNav('links', l) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                    <input placeholder="href" value={link.href} onChange={(e) => { const l = [...(nav.links || [])]; l[i] = { ...l[i], href: e.target.value }; updateNav('links', l) }} className="flex-1 px-2 py-1 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
                  </div>
                ))}
                <button type="button" onClick={() => updateNav('links', [...(nav.links || []), { label: '', href: '#' }])} className="text-xs theme-text-muted hover:underline">+ Enlace</button>
              </div>
            </Accordion>

            <Accordion id="typography" open={openSection === 'typography'} onToggle={setOpenSection} title="Tipografía" icon={Type}>
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">Tamaño título (px)</label>
                <input type="number" min={20} max={72} value={config.fontSizeTitle} onChange={(e) => setConfig((c) => ({ ...c, fontSizeTitle: Number(e.target.value) || 36 }))} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              </div>
              <div>
                <label className="block text-xs theme-text-muted mb-0.5">Tamaño subtítulo (px)</label>
                <input type="number" min={12} max={28} value={config.fontSizeSubtitle} onChange={(e) => setConfig((c) => ({ ...c, fontSizeSubtitle: Number(e.target.value) || 18 }))} className="w-full px-2 py-1.5 rounded border text-sm" style={{ background: 'var(--theme-input-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }} />
              </div>
            </Accordion>

            <Accordion id="actions" open={openSection === 'actions'} onToggle={setOpenSection} title="Acciones" icon={Palette}>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium btn-primary disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button type="button" onClick={viewWeb} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>
                  <ExternalLink className="w-4 h-4" />
                  Ver web
                </button>
                <button type="button" onClick={reset} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm text-amber-600 dark:text-amber-400" style={{ borderColor: 'var(--theme-border)' }}>
                  <RotateCcw className="w-4 h-4" />
                  Resetear a por defecto
                </button>
              </div>
            </Accordion>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 min-w-0 flex flex-col rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-card)' }}>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
            <span className="text-xs theme-text-muted">Vista previa en vivo</span>
            <div className="flex gap-1">
              {['desktop', 'tablet', 'mobile'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewport(v)}
                  className={`px-2 py-1 text-xs rounded font-medium ${viewport === v ? 'btn-primary' : ''}`}
                  style={viewport !== v ? { background: 'var(--theme-bg)', color: 'var(--theme-text-muted)' } : {}}
                >
                  {v === 'desktop' ? 'Desktop' : v === 'tablet' ? 'Tablet' : 'Móvil'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center" style={{ background: 'var(--theme-bg)' }}>
            <div className="shadow-2xl overflow-hidden rounded-lg transition-all duration-200" style={{ width: previewWidth, maxWidth: '100%', minHeight: '500px' }}>
              <LandingPreview theme={landing.theme || 'cyan'} content={landing} fontSizeTitle={config.fontSizeTitle} fontSizeSubtitle={config.fontSizeSubtitle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
