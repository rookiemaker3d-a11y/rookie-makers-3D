import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { REDES, PROYECTOS, VIDEOS as VIDEOS_FALLBACK } from '../data/redes'

const API_BASE = import.meta.env.VITE_API_URL || ''
const WHATSAPP_NUM = '524721488913'
const WHATSAPP_CHAT = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('Hola, me interesa información sobre impresión 3D y cotización.')}`

export default function Proyectos() {
  const [videos, setVideos] = useState(VIDEOS_FALLBACK)
  const [config, setConfig] = useState(null)
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/videos-promocionales/public`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setVideos(data); })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/pagina-publica/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cfg = config || {}
  const bg = (cfg.backgroundColor && String(cfg.backgroundColor).trim()) ? cfg.backgroundColor : '#050508'
  const titlePx = typeof cfg.fontSizeTitle === 'number' ? Math.max(20, Math.min(72, cfg.fontSizeTitle)) : 36
  const subtitlePx = typeof cfg.fontSizeSubtitle === 'number' ? Math.max(12, Math.min(28, cfg.fontSizeSubtitle)) : 18
  const categories = Array.isArray(cfg.categories) && cfg.categories.length > 0 ? cfg.categories : ['oficina', 'escuela', 'industrial', 'hogar', 'otros']

  return (
    <div className="lp" style={{ backgroundColor: bg }}>
      <header className={`lp-header ${navScrolled ? 'lp-header--scrolled' : ''}`}>
        <div className="lp-header-inner">
          <Link to="/proyectos" className="lp-logo">
            Rookie<span className="lp-accent">.</span>Makers<span>3D</span>
          </Link>
          <nav className="lp-nav">
            <a href="#proceso" className="lp-nav-link">Proceso</a>
            <a href="#detalle" className="lp-nav-link">Detalle</a>
            <a href="#galeria" className="lp-nav-link">Galería</a>
            <a href="#contacto" className="lp-nav-link">Contacto</a>
          </nav>
          <div className="lp-header-actions">
            <Link to="/cotizador" className="lp-btn lp-btn-primary">Cotizar Pieza</Link>
            <Link to="/login" className="lp-nav-link">Entrar</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="lp-hero" aria-label="Presentación">
          <div className="lp-hero-bg" />
          <div className="lp-hero-content">
            <p className="lp-hero-label">Manufactura Aditiva de Precisión</p>
            <h1 className="lp-hero-title" style={{ fontSize: `${titlePx}px` }}>
              Del Bit
              <br />
              <span className="lp-accent">al Átomo</span>
              <span className="lp-hero-tagline" style={{ fontSize: `${titlePx * 0.45}px` }}>Tu visión, materializada</span>
            </h1>
            <p className="lp-hero-desc" style={{ fontSize: `${subtitlePx}px` }}>
              Modelado 3D de precisión y acabado artesanal para piezas únicas. Desde figuras coleccionables hasta refacciones industriales.
            </p>
            <div className="lp-hero-buttons">
              <Link to="/cotizador" className="lp-btn lp-btn-primary lp-btn-hero">Iniciar Proyecto</Link>
              <a href="#galeria" className="lp-btn lp-btn-ghost">Ver Galería</a>
            </div>
          </div>
        </section>

        <section className="lp-stats" aria-label="Estadísticas">
          <div className="lp-stats-inner">
            <div className="lp-stat"><span className="lp-stat-num">500+</span><span className="lp-stat-label">Piezas entregadas</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><span className="lp-stat-num">0.05</span><span className="lp-stat-label">mm precisión mínima</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><span className="lp-stat-num">12+</span><span className="lp-stat-label">Materiales disponibles</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><span className="lp-stat-num">48H</span><span className="lp-stat-label">Entrega express</span></div>
          </div>
        </section>

        <section id="proceso" className="lp-section lp-section--dark">
          <div className="lp-section-head">
            <div>
              <p className="lp-label">Metodología</p>
              <h2 className="lp-section-title">La Maestría</h2>
            </div>
            <p className="lp-section-desc">Cada pieza nace donde la ingeniería y el arte coexisten. No imprimimos objetos — materializamos conceptos.</p>
          </div>
          <div className="lp-cards">
            {[
              { num: '01', title: 'Diseño Digital', text: 'Modelado poligonal de alta complejidad en Blender y Fusion 360. Optimizamos cada malla para impresión.' },
              { num: '02', title: 'Fabricación Aditiva', text: 'Resina fotopolimérica de alta definición o FDM con materiales industriales: ASA, Nylon, PETG. Capas de 0.05mm.' },
              { num: '03', title: 'Toque Maestro', text: 'Lijado progresivo, primario de alto impacto y pintura aerográfica. Cada acabado respeta la intención del diseño.' },
            ].map((c) => (
              <article key={c.num} className="lp-card">
                <span className="lp-card-num">{c.num}</span>
                <h3 className="lp-card-title">{c.title}</h3>
                <p className="lp-card-text">{c.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="detalle" className="lp-section">
          <div className="lp-section-head lp-section-head--center">
            <p className="lp-label">Efecto WOW</p>
            <h2 className="lp-section-title">El Detalle que otros no logran</h2>
            <p className="lp-section-desc">Pasa el cursor sobre la pieza. Descubre los relieves de la manufactura de precisión.</p>
          </div>
          <div className="lp-magnifier-wrap">
            <div className="lp-magnifier-box">
              <div className="lp-magnifier-placeholder">
                <span className="lp-magnifier-icon">◆</span>
                <span className="lp-magnifier-hint">Pasa el cursor para ampliar · 0.05mm visible</span>
              </div>
            </div>
          </div>
        </section>

        <section id="galeria" className="lp-section lp-section--dark">
          <div className="lp-section-head">
            <div>
              <p className="lp-label">Proyectos</p>
              <h2 className="lp-section-title">Galería de Obras</h2>
              <div className="lp-tags">
                {categories.map((cat) => (
                  <span key={cat} className="lp-tag">{cat}</span>
                ))}
              </div>
            </div>
            <a href="#contacto" className="lp-link">Ver todos los proyectos →</a>
          </div>

          <h3 className="lp-subsection-title">Videos</h3>
          <div className="lp-grid">
            {videos.map((v) => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="lp-card lp-card--link">
                <div className="lp-card-media" />
                <div className="lp-card-body">
                  <span className="lp-card-meta">{v.red}</span>
                  <h4 className="lp-card-title">{v.titulo}</h4>
                  <span className="lp-card-cta">Ver →</span>
                </div>
              </a>
            ))}
          </div>

          <h3 className="lp-subsection-title">Proyectos destacados</h3>
          <div className="lp-grid">
            {PROYECTOS.map((p) => (
              <a key={p.id} href={p.enlace} target="_blank" rel="noopener noreferrer" className="lp-card lp-card--link">
                <div className="lp-card-media">
                  <img src={p.imagen} alt={p.titulo} />
                </div>
                <div className="lp-card-body">
                  <span className="lp-card-meta">{p.red}</span>
                  <h4 className="lp-card-title">{p.titulo}</h4>
                  <p className="lp-card-desc">{p.descripcion}</p>
                  <span className="lp-card-cta">Ver →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="contacto" className="lp-cta">
          <div className="lp-cta-inner">
            <p className="lp-label">Inicia Tu Proyecto</p>
            <h2 className="lp-cta-title">¿Tienes un reto imposible?</h2>
            <p className="lp-cta-desc">No importa si es una figura de 2cm con relieves microscópicos o una refacción industrial. Iniciemos.</p>
            <div className="lp-cta-buttons">
              <a href="mailto:contacto@rookiemakers3d.mx" className="lp-btn lp-btn-outline">Cotizar Ahora</a>
              <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-whatsapp">WhatsApp</a>
            </div>
            <div className="lp-cta-features">
              <span>Respuesta &lt; 24 hrs</span>
              <span>Entrega express 48H</span>
              <span>Reimpresión sin costo</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-logo">Rookie<span className="lp-accent">.</span>Makers<span>3D</span></span>
          <span className="lp-footer-copy">© 2025 · Del Bit al Átomo · México</span>
          <div className="lp-footer-links">
            <a href={REDES.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href={REDES.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </footer>

      <div className="lp-float-cta">
        <Link to="/cotizador" className="lp-btn lp-btn-primary">Cotizar Pieza</Link>
      </div>

      <style>{`
        .lp { --lp-bg: #050508; --lp-surface: #0d0d12; --lp-muted: rgba(232,232,240,0.6); --lp-accent: #00e5ff; --lp-gold: #c9a96e; color: #e8e8f0; min-height: 100vh; }
        .lp-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1rem 1.5rem; transition: background 0.3s, box-shadow 0.3s; }
        .lp-header--scrolled { background: rgba(5,5,8,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .lp-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .lp-logo { font-size: 1.25rem; letter-spacing: 0.15em; color: #fff; text-decoration: none; font-weight: 700; }
        .lp-accent { color: var(--lp-accent); }
        .lp-nav { display: flex; gap: 2rem; }
        .lp-nav-link { font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--lp-muted); text-decoration: none; transition: color 0.2s; }
        .lp-nav-link:hover { color: var(--lp-accent); }
        .lp-header-actions { display: flex; align-items: center; gap: 0.75rem; }
        .lp-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; border: none; cursor: pointer; transition: all 0.2s; }
        .lp-btn-primary { background: var(--lp-accent); color: #050508; }
        .lp-btn-primary:hover { background: #fff; box-shadow: 0 0 24px rgba(0,229,255,0.35); }
        .lp-btn-ghost { color: var(--lp-muted); }
        .lp-btn-ghost:hover { color: #e8e8f0; }
        .lp-btn-outline { color: var(--lp-accent); border: 2px solid var(--lp-accent); }
        .lp-btn-outline:hover { background: var(--lp-accent); color: #050508; }
        .lp-btn-whatsapp { background: #25D366; color: #fff; }
        .lp-btn-whatsapp:hover { background: #20BD5A; }
        .lp-btn-hero { padding: 0.75rem 1.5rem; }
        .lp-hero { min-height: 100vh; display: flex; align-items: center; padding: 6rem 1.5rem 4rem; position: relative; overflow: hidden; }
        .lp-hero-bg { position: absolute; inset: 0; opacity: 0.4; background-image: linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px); background-size: 48px 48px; }
        .lp-hero-content { position: relative; z-index: 1; max-width: 640px; }
        .lp-hero-label { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--lp-accent); margin-bottom: 1rem; }
        .lp-hero-title { line-height: 1; letter-spacing: 0.02em; margin-bottom: 1rem; font-weight: 700; }
        .lp-hero-tagline { display: block; margin-top: 0.25rem; font-style: italic; color: var(--lp-gold); font-weight: 400; }
        .lp-hero-desc { max-width: 420px; line-height: 1.6; color: var(--lp-muted); margin-bottom: 2rem; font-weight: 300; }
        .lp-hero-buttons { display: flex; flex-wrap: wrap; gap: 1rem; }
        .lp-stats { border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 1.25rem 1.5rem; background: var(--lp-surface); }
        .lp-stats-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1rem 1.5rem; text-align: center; }
        .lp-stat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .lp-stat-num { font-size: 1.5rem; font-weight: 700; color: var(--lp-accent); }
        .lp-stat-label { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--lp-muted); max-width: 100px; }
        .lp-stat-divider { width: 1px; height: 2rem; background: rgba(255,255,255,0.1); display: none; }
        @media (min-width: 640px) { .lp-stat-divider { display: block; } }
        .lp-section { padding: 4rem 1.5rem; max-width: 1200px; margin: 0 auto; }
        .lp-section--dark { background: var(--lp-surface); }
        .lp-section-head { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        @media (min-width: 768px) { .lp-section-head { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
        .lp-section-head--center { text-align: center; align-items: center; }
        .lp-label { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--lp-accent); }
        .lp-section-title { font-size: 2rem; line-height: 1.1; margin-top: 0.25rem; }
        @media (min-width: 768px) { .lp-section-title { font-size: 2.5rem; } }
        .lp-section-desc { max-width: 320px; font-size: 0.875rem; color: var(--lp-muted); line-height: 1.5; }
        .lp-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .lp-tag { font-size: 0.65rem; letter-spacing: 0.05em; padding: 0.25rem 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: var(--lp-muted); }
        .lp-link { font-size: 0.875rem; color: var(--lp-muted); text-decoration: none; }
        .lp-link:hover { color: var(--lp-accent); }
        .lp-cards { display: grid; grid-template-columns: 1fr; gap: 1px; background: rgba(255,255,255,0.08); }
        @media (min-width: 768px) { .lp-cards { grid-template-columns: repeat(3, 1fr); } }
        .lp-card { background: #13131a; padding: 2rem; position: relative; transition: background 0.2s; }
        .lp-card:hover { background: #16161f; }
        .lp-card-num { position: absolute; top: 1rem; right: 1rem; font-size: 2.5rem; color: rgba(0,229,255,0.12); }
        .lp-card-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
        .lp-card-text { font-size: 0.875rem; color: var(--lp-muted); line-height: 1.5; }
        .lp-magnifier-wrap { max-width: 800px; margin: 0 auto; }
        .lp-magnifier-box { width: 100%; aspect-ratio: 16/10; background: #0d0d12; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
        .lp-magnifier-placeholder { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--lp-muted); font-size: 0.65rem; letter-spacing: 0.1em; }
        .lp-magnifier-icon { font-size: 3rem; opacity: 0.5; }
        .lp-subsection-title { font-size: 1.25rem; color: var(--lp-accent); margin-bottom: 1rem; }
        .lp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .lp-card--link { text-decoration: none; color: inherit; display: block; padding: 0; overflow: hidden; border-radius: 8px; }
        .lp-card--link:hover { border-color: rgba(0,229,255,0.3); }
        .lp-card-media { aspect-ratio: 16/10; background: #0d0d12; display: flex; align-items: center; justify-content: center; }
        .lp-card-media img { width: 100%; height: 100%; object-fit: cover; }
        .lp-card-body { padding: 1rem; }
        .lp-card-meta { font-size: 0.65rem; letter-spacing: 0.05em; color: var(--lp-accent); }
        .lp-card-desc { font-size: 0.875rem; color: var(--lp-muted); margin-top: 0.25rem; line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .lp-card-cta { font-size: 0.875rem; color: var(--lp-muted); margin-top: 0.5rem; display: inline-block; }
        .lp-cta { padding: 4rem 1.5rem; text-align: center; position: relative; }
        .lp-cta-inner { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; }
        .lp-cta-title { font-size: 2rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
        @media (min-width: 768px) { .lp-cta-title { font-size: 3rem; } }
        .lp-cta-desc { font-size: 1rem; color: var(--lp-muted); line-height: 1.5; margin-bottom: 1.5rem; }
        .lp-cta-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
        .lp-cta-features { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; font-size: 0.875rem; color: var(--lp-muted); }
        .lp-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 2rem 1.5rem; background: var(--lp-surface); }
        .lp-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
        .lp-footer-copy { font-size: 0.75rem; letter-spacing: 0.1em; color: var(--lp-muted); }
        .lp-footer-links { display: flex; gap: 1.5rem; }
        .lp-footer-links a { font-size: 0.75rem; letter-spacing: 0.1em; color: var(--lp-muted); text-decoration: none; }
        .lp-footer-links a:hover { color: var(--lp-accent); }
        .lp-float-cta { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50; }
        .lp-float-cta .lp-btn { box-shadow: 0 8px 24px rgba(0,229,255,0.25); }
      `}</style>
    </div>
  )
}
