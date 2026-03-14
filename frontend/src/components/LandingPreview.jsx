/**
 * Preview embebido de la landing: misma estructura que Proyectos (Hero, Stats, Process, Gallery, CTA, Footer)
 * para el editor. Recibe theme + content y opcionalmente fontSizeTitle / fontSizeSubtitle.
 */
const DEFAULT = {
  hero: { tag: '', titleLine1: 'Del Bit', titleLine2: 'al Átomo', titleAccent: 'al Átomo', tagline: '', description: '', ctaPrimary: 'Solicitar cotización', ctaSecondary: 'Ver galería' },
  stats: [{ value: '500+', label: 'Piezas entregadas' }, { value: '0.05', label: 'mm precisión' }, { value: '24/7', label: 'Producción' }],
  process: [
    { number: '01', title: 'Diseño', text: 'Recibimos tu archivo o idea y lo preparamos para impresión.' },
    { number: '02', title: 'Fabricación', text: 'Impresión con materiales de calidad.' },
    { number: '03', title: 'Entrega', text: 'Acabado y entrega en tiempo y forma.' },
  ],
  gallery: [{ label: 'Prototipos', name: 'Prototipos' }, { label: 'Piezas', name: 'Piezas' }, { label: 'Arte', name: 'Arte' }],
  cta: { tag: '¿Listo?', title: 'Cuéntanos tu proyecto', subtitle: 'Cotización sin compromiso.', buttonText: 'Contactar', buttonMailto: 'mailto:contacto@ejemplo.com', whatsappText: '#' },
  footer: { logoText: 'Rookie Makers', copyright: '© 2025', links: [{ label: 'Inicio', href: '#' }, { label: 'Contacto', href: '#contacto' }] },
}

export default function LandingPreview({ theme = 'cyan', content = {}, fontSizeTitle = 36, fontSizeSubtitle = 18 }) {
  const hero = content.hero || DEFAULT.hero
  const stats = Array.isArray(content.stats) && content.stats.length > 0 ? content.stats : DEFAULT.stats
  const process = Array.isArray(content.process) && content.process.length > 0 ? content.process : DEFAULT.process
  const galleryItems = Array.isArray(content.gallery) && content.gallery.length > 0 ? content.gallery : DEFAULT.gallery
  const cta = content.cta || DEFAULT.cta
  const footer = content.footer || DEFAULT.footer
  const isGreen = theme === 'green'
  const titlePx = Math.max(20, Math.min(72, fontSizeTitle))
  const subtitlePx = Math.max(12, Math.min(28, fontSizeSubtitle))
  const bg = isGreen ? '#f8faf8' : '#050508'

  return (
    <div className={`lp lp-preview ${isGreen ? 'lp--green' : ''}`} style={{ backgroundColor: bg }}>
      <main className="lp-preview-main">
        <section className="lp-hero" aria-label="Hero">
          <div className="lp-hero-bg" />
          <div className="lp-hero-content">
            <p className="lp-hero-label">{hero.tag}</p>
            <h1 className="lp-hero-title" style={{ fontSize: `${titlePx}px` }}>
              {hero.titleLine1}
              <br />
              <span className="lp-accent">{hero.titleAccent || hero.titleLine2}</span>
              <span className="lp-hero-tagline" style={{ fontSize: `${titlePx * 0.45}px` }}>{hero.tagline}</span>
            </h1>
            <p className="lp-hero-desc" style={{ fontSize: `${subtitlePx}px` }}>{hero.description}</p>
            <div className="lp-hero-buttons">
              <span className="lp-btn lp-btn-primary lp-btn-hero">{hero.ctaPrimary}</span>
              <span className="lp-btn lp-btn-ghost">{hero.ctaSecondary}</span>
            </div>
          </div>
        </section>
        <section className="lp-stats">
          <div className="lp-stats-inner">
            {stats.map((s, i) => (
              <span key={i}>
                <div className="lp-stat"><span className="lp-stat-num">{s.value}</span><span className="lp-stat-label">{s.label}</span></div>
                {i < stats.length - 1 && <div className="lp-stat-divider" />}
              </span>
            ))}
          </div>
        </section>
        <section id="proceso" className="lp-section lp-section--dark">
          <div className="lp-section-head">
            <div>
              <p className="lp-label">Proceso</p>
              <h2 className="lp-section-title">Metodología</h2>
            </div>
          </div>
          <div className="lp-cards">
            {process.map((c) => (
              <article key={c.number} className="lp-card">
                <span className="lp-card-num">{c.number}</span>
                <h3 className="lp-card-title">{c.title}</h3>
                <p className="lp-card-text">{c.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="galeria" className="lp-section lp-section--dark">
          <div className="lp-section-head">
            <div>
              <p className="lp-label">Galería</p>
              <h2 className="lp-section-title">Obras</h2>
              <div className="lp-tags">
                {galleryItems.map((g) => (
                  <span key={g.label} className="lp-tag">{g.label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="lp-cta">
          <div className="lp-cta-inner">
            <p className="lp-label">{cta.tag}</p>
            <h2 className="lp-cta-title">{cta.title}</h2>
            <p className="lp-cta-desc">{cta.subtitle}</p>
            <div className="lp-cta-buttons">
              <span className="lp-btn lp-btn-outline">{cta.buttonText}</span>
              <span className="lp-btn lp-btn-whatsapp">WhatsApp</span>
            </div>
          </div>
        </section>
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <span className="lp-logo">{footer.logoText}<span className="lp-accent">.</span></span>
            <span className="lp-footer-copy">{footer.copyright}</span>
            <div className="lp-footer-links">
              {(footer.links || []).map((link) => (
                <a key={link.label} href={link.href}>{link.label}</a>
              ))}
            </div>
          </div>
        </footer>
      </main>
      <style>{`
        .lp-preview { min-height: 100%; }
        .lp-preview-main { padding-top: 0; }
        .lp { --lp-bg: #050508; --lp-surface: #0d0d12; --lp-muted: rgba(232,232,240,0.6); --lp-accent: #00e5ff; --lp-gold: #c9a96e; color: #e8e8f0; min-height: 100vh; }
        .lp-header--scrolled { }
        .lp-hero { min-height: 60vh; display: flex; align-items: center; padding: 3rem 1rem 2rem; position: relative; overflow: hidden; }
        .lp-hero-bg { position: absolute; inset: 0; opacity: 0.4; background-image: linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px); background-size: 48px 48px; }
        .lp-hero-content { position: relative; z-index: 1; max-width: 640px; }
        .lp-hero-label { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--lp-accent); margin-bottom: 1rem; }
        .lp-hero-title { line-height: 1; letter-spacing: 0.02em; margin-bottom: 1rem; font-weight: 700; }
        .lp-hero-tagline { display: block; margin-top: 0.25rem; font-style: italic; color: var(--lp-gold); font-weight: 400; }
        .lp-hero-desc { max-width: 420px; line-height: 1.6; color: var(--lp-muted); margin-bottom: 2rem; font-weight: 300; }
        .lp-hero-buttons { display: flex; flex-wrap: wrap; gap: 1rem; }
        .lp-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; border: none; cursor: default; }
        .lp-btn-primary { background: var(--lp-accent); color: #050508; }
        .lp-btn-ghost { color: var(--lp-muted); }
        .lp-btn-outline { color: var(--lp-accent); border: 2px solid var(--lp-accent); }
        .lp-btn-whatsapp { background: #25D366; color: #fff; }
        .lp-btn-hero { padding: 0.75rem 1.5rem; }
        .lp-stats { border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 1rem; background: var(--lp-surface); }
        .lp-stats-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1rem; text-align: center; }
        .lp-stat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .lp-stat-num { font-size: 1.25rem; font-weight: 700; color: var(--lp-accent); }
        .lp-stat-label { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--lp-muted); }
        .lp-stat-divider { width: 1px; height: 1.5rem; background: rgba(255,255,255,0.1); display: none; }
        @media (min-width: 640px) { .lp-stat-divider { display: block; } }
        .lp-section { padding: 2rem 1rem; max-width: 1200px; margin: 0 auto; }
        .lp-section--dark { background: var(--lp-surface); }
        .lp-section-head { margin-bottom: 1.5rem; }
        .lp-label { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--lp-accent); }
        .lp-section-title { font-size: 1.5rem; margin-top: 0.25rem; }
        .lp-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .lp-tag { font-size: 0.65rem; padding: 0.25rem 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: var(--lp-muted); }
        .lp-cards { display: grid; grid-template-columns: 1fr; gap: 1px; background: rgba(255,255,255,0.08); }
        @media (min-width: 768px) { .lp-cards { grid-template-columns: repeat(3, 1fr); } }
        .lp-card { background: #13131a; padding: 1.5rem; }
        .lp-card-num { font-size: 2rem; color: rgba(0,229,255,0.12); }
        .lp-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .lp-card-text { font-size: 0.8rem; color: var(--lp-muted); line-height: 1.5; }
        .lp-cta { padding: 2rem 1rem; text-align: center; }
        .lp-cta-inner { max-width: 560px; margin: 0 auto; }
        .lp-cta-title { font-size: 1.5rem; margin: 0.5rem 0 1rem; }
        .lp-cta-desc { font-size: 0.9rem; color: var(--lp-muted); margin-bottom: 1rem; }
        .lp-cta-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
        .lp-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 1.5rem 1rem; background: var(--lp-surface); }
        .lp-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
        .lp-footer-copy { font-size: 0.75rem; color: var(--lp-muted); }
        .lp-footer-links { display: flex; gap: 1rem; }
        .lp-footer-links a { font-size: 0.75rem; color: var(--lp-muted); text-decoration: none; }
        .lp--green { --lp-bg: #f8faf8; --lp-surface: #f0f4f0; --lp-muted: #64748b; --lp-accent: #16a34a; --lp-gold: #15803d; color: #0f172a; }
        .lp--green .lp-hero-bg { opacity: 0.15; background-image: none; background-color: rgba(22,163,74,0.06); }
        .lp--green .lp-stat-num { color: var(--lp-accent); }
        .lp--green .lp-stats { border-color: rgba(0,0,0,0.06); background: var(--lp-surface); }
        .lp--green .lp-section--dark { background: var(--lp-surface); }
        .lp--green .lp-card { background: #fff; border: 1px solid rgba(0,0,0,0.06); }
        .lp--green .lp-card-num { color: rgba(22,163,74,0.15); }
        .lp--green .lp-tag { border-color: rgba(0,0,0,0.1); color: var(--lp-muted); }
        .lp--green .lp-footer { border-color: rgba(0,0,0,0.06); background: var(--lp-surface); }
      `}</style>
    </div>
  )
}
