import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { REDES, PROYECTOS, VIDEOS as VIDEOS_FALLBACK } from '../data/redes'

const API_BASE = import.meta.env.VITE_API_URL || ''
const WHATSAPP_NUM = '524721488913'
const WHATSAPP_CHAT = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('Hola, me interesa información sobre impresión 3D y cotización.')}`

export default function Proyectos() {
  const [videos, setVideos] = useState(VIDEOS_FALLBACK)
  const [pageConfig, setPageConfig] = useState(null)
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, show: false })
  const magnifierRef = useRef(null)
  const baseRef = useRef(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/videos-promocionales/public`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setVideos)
      .catch(() => setVideos(VIDEOS_FALLBACK))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/pagina-publica/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPageConfig)
      .catch(() => setPageConfig(null))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.landing-page .reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const nav = document.getElementById('mainNav')
    if (!nav) return
    const onScroll = () => {
      if (window.scrollY > 60) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onMagnifierMove = (e) => {
    if (!baseRef.current) return
    const r = baseRef.current.getBoundingClientRect()
    setMagnifierPos({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      show: true,
    })
  }
  const onMagnifierLeave = () => setMagnifierPos((p) => ({ ...p, show: false }))

  const cfg = pageConfig || {}
  const bgColor = (cfg.backgroundColor && cfg.backgroundColor.trim()) ? cfg.backgroundColor : '#050508'
  const fontSizeTitle = typeof cfg.fontSizeTitle === 'number' ? cfg.fontSizeTitle : 32
  const fontSizeSubtitle = typeof cfg.fontSizeSubtitle === 'number' ? cfg.fontSizeSubtitle : 18
  const categories = Array.isArray(cfg.categories) && cfg.categories.length ? cfg.categories : ['oficina', 'escuela', 'industrial', 'hogar', 'otros']

  return (
    <div className="landing-page min-h-screen text-[#e8e8f0] overflow-x-hidden" style={{ backgroundColor: bgColor }}>
      {/* NAV */}
      <nav
        id="mainNav"
        className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 flex items-center justify-between transition-all duration-300 md:px-12"
      >
        <Link to="/proyectos" className="font-display text-2xl tracking-[0.15em] text-white">
          Rookie<span className="text-[#00e5ff]">.</span>Makers<span>3D</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <a href="#process" className="font-mono text-xs tracking-widest uppercase text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline">
            Proceso
          </a>
          <a href="#magnifier-section" className="font-mono text-xs tracking-widest uppercase text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline">
            Detalle
          </a>
          <a href="#gallery" className="font-mono text-xs tracking-widest uppercase text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline">
            Galería
          </a>
          <a href="#cta" className="font-mono text-xs tracking-widest uppercase text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline">
            Contacto
          </a>
        </div>
        <Link
          to="/cotizador"
          className="font-mono text-xs tracking-widest uppercase font-bold text-[#050508] bg-[#00e5ff] px-5 py-2.5 no-underline transition hover:bg-white hover:shadow-[0_0_24px_rgba(0,229,255,0.35)]"
          style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
        >
          Cotizar Pieza
        </Link>
        <Link
          to="/login"
          className="font-mono text-xs tracking-widest uppercase text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline ml-2"
        >
          Entrar
        </Link>
      </nav>

      {/* HERO */}
      <section id="hero" className="min-h-screen flex items-center relative overflow-hidden px-6 md:px-12">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)',
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] -right-24 top-1/2 -translate-y-1/2 animate-pulse opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-[700px]">
          <div className="font-mono text-xs text-[#00e5ff] tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
            <span className="w-10 h-px bg-[#00e5ff] block" />
            Manufactura Aditiva de Precisión
          </div>
          <h1 className="font-display leading-[0.92] tracking-wide mb-6" style={{ fontSize: `${fontSizeTitle}px` }}>
            Del Bit
            <br />
            <span className="text-[#00e5ff]">al Átomo</span>
            <span className="font-serif italic text-[#c9a96e] block font-normal mt-1" style={{ fontSize: `${Math.round(fontSizeTitle * 0.45)}px` }}>
              Tu visión, materializada
            </span>
          </h1>
          <p className="leading-relaxed max-w-[420px] mb-10 font-light text-[var(--lp-muted)]" style={{ fontSize: `${fontSizeSubtitle}px` }}>
            Modelado 3D de precisión y acabado artesanal para piezas únicas. Desde figuras coleccionables de alta definición hasta refacciones industriales.
          </p>
          <div className="flex flex-wrap gap-5 items-center">
            <Link
              to="/cotizador"
              className="inline-flex items-center gap-2 bg-[#00e5ff] text-[#050508] text-xs font-bold tracking-widest uppercase py-4 px-8 no-underline transition hover:bg-white hover:shadow-[0_0_40px_rgba(0,229,255,0.35)] hover:-translate-y-0.5"
              style={{ clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              Iniciar Proyecto
            </Link>
            <a href="#gallery" className="inline-flex items-center gap-2 text-[var(--lp-muted)] text-xs font-medium tracking-widest uppercase no-underline transition hover:text-[#e8e8f0]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              Ver Galería
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div
        className="reveal border-t border-b border-white/10 py-6 px-6 md:px-12 flex flex-wrap justify-center gap-6 md:gap-8 text-center"
        style={{ background: 'var(--lp-surface)' }}
      >
        <div className="flex items-center gap-6">
          <div className="font-display text-3xl text-[#00e5ff] leading-none tracking-wide">500+</div>
          <div className="text-xs text-[var(--lp-muted)] tracking-widest uppercase leading-snug text-left max-w-[90px]">Piezas entregadas</div>
        </div>
        <div className="hidden sm:flex w-px bg-white/10" />
        <div className="flex items-center gap-6">
          <div className="font-display text-3xl text-[#00e5ff] leading-none">0.05</div>
          <div className="text-xs text-[var(--lp-muted)] tracking-widest uppercase text-left max-w-[90px]">mm precisión mínima</div>
        </div>
        <div className="hidden sm:flex w-px bg-white/10" />
        <div className="flex items-center gap-6">
          <div className="font-display text-3xl text-[#00e5ff] leading-none">12+</div>
          <div className="text-xs text-[var(--lp-muted)] tracking-widest uppercase text-left max-w-[90px]">Materiales disponibles</div>
        </div>
        <div className="hidden sm:flex w-px bg-white/10" />
        <div className="flex items-center gap-6">
          <div className="font-display text-3xl text-[#00e5ff] leading-none">48H</div>
          <div className="text-xs text-[var(--lp-muted)] tracking-widest uppercase text-left max-w-[90px]">Entrega express</div>
        </div>
      </div>

      {/* PROCESS */}
      <section id="process" className="py-20 md:py-32 px-6 md:px-12" style={{ background: 'var(--lp-surface)' }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <div className="font-mono text-[0.65rem] text-[#00e5ff] tracking-[0.35em] uppercase mb-3 flex items-center gap-3">// Metodología</div>
            <div className="font-display text-4xl md:text-5xl leading-[0.95]">La<br />Maestría</div>
          </div>
          <p className="max-w-[320px] text-[var(--lp-muted)] text-sm leading-relaxed font-light">
            Cada pieza nace donde la ingeniería y el arte coexisten. No imprimimos objetos — materializamos conceptos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
          {[
            { num: '01', title: 'Diseño Digital', text: 'Modelado poligonal de alta complejidad en Blender y Fusion 360. Optimizamos cada malla para impresión antes de generar un solo g-code.', icon: 'layers' },
            { num: '02', title: 'Fabricación Aditiva', text: 'Resina fotopolimérica de alta definición o FDM con materiales industriales: ASA, Nylon, PETG. Capas de 0.05mm donde el detalle es absoluto.', icon: 'print' },
            { num: '03', title: 'Toque Maestro', text: 'Lijado progresivo, primario de alto impacto y pintura aerográfica de precisión. Cada acabado respeta la intención del diseño original.', icon: 'brush' },
          ].map((card, i) => (
            <div
              key={card.num}
              className={`reveal bg-[#13131a] p-8 md:p-10 relative overflow-hidden transition hover:bg-[#16161f] group ${i === 1 ? 'reveal-d1' : i === 2 ? 'reveal-d2' : ''}`}
            >
              <div className="font-display text-6xl text-[#00e5ff]/10 absolute top-4 right-6 group-hover:text-[#00e5ff]/20 transition">0{card.num}</div>
              <div className="w-12 h-12 border border-[#00e5ff]/25 flex items-center justify-center text-[#00e5ff] mb-8 group-hover:bg-[#00e5ff]/10 group-hover:border-[#00e5ff] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.12)] transition">
                <span className="text-lg">◉</span>
              </div>
              <div className="font-serif text-xl font-bold mb-4">{card.title}</div>
              <p className="text-[var(--lp-muted)] text-sm leading-relaxed font-light">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MAGNIFIER / DETALLE */}
      <section id="magnifier-section" className="py-20 md:py-32 px-6 md:px-12 overflow-hidden">
        <div className="text-center mb-16 reveal">
          <div className="font-mono text-[0.65rem] text-[#00e5ff] tracking-[0.35em] uppercase flex justify-center">// Efecto WOW</div>
          <div className="font-display text-4xl md:text-5xl mt-2">
            El Detalle
            <br />
            <em className="font-serif italic text-[#c9a96e] text-[0.8em] font-normal">que otros no logran</em>
          </div>
          <p className="text-[var(--lp-muted)] mt-6 max-w-[400px] mx-auto text-sm font-light leading-relaxed">
            Pasa el cursor sobre la pieza. Descubre los relieves que separan la impresión 3D estándar de la manufactura de precisión.
          </p>
        </div>
        <div className="max-w-[900px] mx-auto relative reveal">
          <div
            ref={baseRef}
            onMouseMove={onMagnifierMove}
            onMouseLeave={onMagnifierLeave}
            className="w-full h-[400px] md:h-[500px] bg-[#0d0d12] border border-white/10 flex items-center justify-center cursor-crosshair relative overflow-hidden"
          >
            <svg width="80%" height="80%" viewBox="0 0 400 300" className="opacity-55" style={{ minWidth: 300 }}>
              <g stroke="rgba(0,229,255,0.2)" fill="none" strokeWidth="0.8">
                <path d="M 100 220 Q 90 190 95 170 Q 100 140 120 130 Q 140 120 145 90 Q 150 60 152 50 Q 155 35 165 30 Q 178 25 192 30 Q 206 35 208 50 Q 210 60 208 90 Q 205 120 212 130 Q 220 140 225 170 Q 230 190 220 220 Z" strokeWidth="1.5" />
                <path d="M 112 130 Q 155 138 195 130" strokeDasharray="2 3" strokeWidth="0.8" />
                <path d="M 132 80 Q 140 65 150 75 Q 160 85 170 72 Q 180 58 188 80" stroke="rgba(201,169,110,0.9)" strokeWidth="1.5" />
              </g>
            </svg>
            {magnifierPos.show && (
              <div
                ref={magnifierRef}
                className="absolute w-[180px] h-[180px] border-2 border-[#00e5ff] rounded-full pointer-events-none overflow-hidden shadow-lg z-10 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: magnifierPos.x,
                  top: magnifierPos.y,
                  boxShadow: '0 0 0 1px rgba(0,229,255,0.3), 0 20px 60px rgba(0,0,0,0.6)',
                }}
              >
                <div className="w-full h-full flex items-center justify-center bg-[#0d0d12]/95">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <g stroke="rgba(0,229,255,0.65)" fill="none" strokeWidth="1.2">
                      <path d="M 60 80 Q 55 65 60 55 Q 65 45 72 50 Q 80 55 82 65 Q 85 75 82 85" stroke="rgba(201,169,110,0.9)" />
                      <circle cx="60" cy="60" r="8" />
                    </g>
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[0.65rem] text-[#00e5ff]/60 tracking-widest flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              Pasa el cursor para ampliar · 0.05mm visible
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY: Videos + Proyectos */}
      <section id="gallery" className="py-20 md:py-32 px-6 md:px-12" style={{ background: 'var(--lp-surface)' }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 reveal">
          <div>
            <div className="font-mono text-[0.65rem] text-[#00e5ff] tracking-[0.35em] uppercase">// Proyectos</div>
            <div className="font-display text-4xl md:text-5xl mt-1">
              Galería
              <br />
              <em className="font-serif italic text-[var(--lp-muted)] text-[0.6em] font-normal">de Obras</em>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map((cat) => (
                  <span key={cat} className="text-[0.65rem] font-mono tracking-wider px-2 py-1 rounded border border-white/20 text-[var(--lp-muted)]">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link to="#cta" className="font-mono text-sm text-[var(--lp-muted)] hover:text-[#00e5ff] transition no-underline flex items-center gap-2">
            Ver todos los proyectos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Videos desde API */}
        <div className="mb-12">
          <h3 className="font-display text-2xl text-[#00e5ff] tracking-wide mb-6 reveal">Videos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal block rounded-lg overflow-hidden bg-[#13131a] border border-white/10 hover:border-[#00e5ff]/30 transition group"
              >
                <div className="aspect-video bg-[#0d0d12] flex items-center justify-center">
                  <span className="text-4xl text-[#00e5ff]/50 group-hover:text-[#00e5ff] transition">▶</span>
                </div>
                <div className="p-4">
                  <span className="font-mono text-[0.65rem] text-[#00e5ff] tracking-wider">{v.red}</span>
                  <h4 className="font-serif font-bold text-white mt-1 group-hover:text-[#00e5ff] transition">{v.titulo}</h4>
                  <span className="text-[var(--lp-muted)] text-sm mt-2 inline-block">Ver →</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Proyectos destacados */}
        <h3 className="font-display text-2xl text-[#00e5ff] tracking-wide mb-6 reveal">Proyectos destacados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROYECTOS.map((p, i) => (
            <a
              key={p.id}
              href={p.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className={`reveal block rounded-lg overflow-hidden bg-[#13131a] border border-white/10 hover:border-[#00e5ff]/20 transition group ${i === 1 ? 'reveal-d1' : i === 2 ? 'reveal-d2' : ''}`}
            >
              <div className="aspect-video bg-[#0d0d12] overflow-hidden">
                <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-4">
                <span className="font-mono text-[0.65rem] text-[#00e5ff] tracking-wider">{p.red}</span>
                <h4 className="font-serif font-bold text-white mt-1 group-hover:text-[#00e5ff] transition">{p.titulo}</h4>
                <p className="text-[var(--lp-muted)] text-sm mt-1 line-clamp-2">{p.descripcion}</p>
                <span className="text-[var(--lp-muted)] text-sm mt-2 inline-block">Ver →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 md:py-40 px-6 md:px-12 text-center relative overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)' }}
        />
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#00e5ff] to-transparent mx-auto mb-12 animate-pulse" />
        <div className="relative reveal">
          <div className="font-mono text-[0.65rem] text-[#00e5ff] tracking-[0.35em] uppercase mb-6">// Inicia Tu Proyecto</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[0.92] mb-6">
            ¿Tienes un reto
            <br />
            <em className="font-serif italic text-[#c9a96e] text-[0.88em]">imposible?</em>
          </h2>
          <p className="text-[var(--lp-muted)] text-base max-w-[480px] mx-auto mb-12 font-light leading-relaxed">
            No importa si es una figura coleccionable de 2cm con relieves microscópicos o una refacción industrial que nadie más puede reproducir. Iniciemos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`mailto:contacto@rookiemakers3d.mx`}
              className="inline-flex items-center gap-2 text-[#00e5ff] text-xs font-bold tracking-widest uppercase py-5 px-10 border border-[#00e5ff] no-underline transition relative overflow-hidden hover:text-[#050508] hover:shadow-[0_0_40px_rgba(0,229,255,0.35)] group"
            >
              <span className="absolute inset-0 bg-[#00e5ff] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,12 2,6" /></svg>
              <span className="relative z-10">Cotizar Ahora</span>
            </a>
            <a
              href={WHATSAPP_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold tracking-widest uppercase py-5 px-10 no-underline transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475z" /></svg>
              WhatsApp
            </a>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-8 reveal">
          <div className="text-center">
            <div className="font-mono text-[0.58rem] text-[var(--lp-muted)] tracking-widest mb-1">RESPUESTA</div>
            <div className="text-sm">Menos de 24 hrs</div>
          </div>
          <div className="w-px bg-white/10 hidden sm:block" />
          <div className="text-center">
            <div className="font-mono text-[0.58rem] text-[var(--lp-muted)] tracking-widest mb-1">ENTREGA EXPRESS</div>
            <div className="text-sm">48 horas disponible</div>
          </div>
          <div className="w-px bg-white/10 hidden sm:block" />
          <div className="text-center">
            <div className="font-mono text-[0.58rem] text-[var(--lp-muted)] tracking-widest mb-1">GARANTÍA</div>
            <div className="text-sm">Reimpresión sin costo</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t border-white/10 py-10 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: 'var(--lp-surface)' }}
      >
        <div className="font-display text-xl tracking-[0.15em]">
          Rookie<span className="text-[#00e5ff]">.</span>Makers<span>3D</span>
        </div>
        <div className="font-mono text-xs text-[var(--lp-muted)] tracking-widest">© 2025 · Del Bit al Átomo · México</div>
        <div className="flex gap-6">
          <a href={REDES.tiktok} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--lp-muted)] tracking-widest no-underline hover:text-[#00e5ff] transition">TikTok</a>
          <a href={REDES.instagram} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--lp-muted)] tracking-widest no-underline hover:text-[#00e5ff] transition">Instagram</a>
          <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--lp-muted)] tracking-widest no-underline hover:text-[#00e5ff] transition">WhatsApp</a>
        </div>
      </footer>

      {/* FLOATING CTA */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 mr-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e5ff]" />
          </span>
          <span className="font-mono text-[0.55rem] text-[var(--lp-muted)] tracking-wider">Disponible ahora</span>
        </div>
        <Link
          to="/cotizador"
          className="flex items-center gap-2 bg-[#00e5ff] text-[#050508] font-mono text-[0.65rem] font-bold tracking-widest uppercase py-3.5 px-6 no-underline transition hover:bg-white shadow-[0_8px_30px_rgba(0,229,255,0.3)] hover:shadow-[0_16px_40px_rgba(0,229,255,0.5)]"
          style={{ clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          Cotizar Pieza
        </Link>
      </div>

      {/* Reveal animation classes */}
      <style>{`
        .landing-page .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .landing-page .reveal.visible { opacity: 1; transform: translateY(0); }
        .landing-page .reveal-d1 { transition-delay: 0.1s; }
        .landing-page .reveal-d2 { transition-delay: 0.2s; }
        .landing-page .reveal-d3 { transition-delay: 0.3s; }
        @media (min-width: 768px) {
          .landing-page nav.scrolled { background: rgba(5,5,8,0.96); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        }
      `}</style>
    </div>
  )
}
