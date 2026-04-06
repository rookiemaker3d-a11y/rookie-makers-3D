import { useState, useRef, useEffect, useCallback } from 'react'
import { publicPath } from '../utils/publicPath'
import { useAuth } from '../context/AuthContext'

const WHATSAPP_NUM = '472 148 8913'
const WHATSAPP_BASE = 'https://wa.me/524721488913'
const WHATSAPP_CHAT = WHATSAPP_BASE + '?text=' + encodeURIComponent('Hola, me interesa información sobre impresión 3D.')

const FAQ = [
  { keys: ['cotización', 'cotizar', 'precio', 'cuánto cuesta', 'cuanto cuesta'], msg: 'Para una estimación usa Nueva cotización o el Cotizador rápido. Los precios finales dependen de material, horas y acabados.' },
  { keys: ['redes', 'instagram', 'facebook', 'tiktok', 'síguenos', 'seguir'], msg: 'Estamos en Facebook, TikTok e Instagram como Rookie Makers 3D. En la web pública (inicio del dominio) tienes enlaces.' },
  { keys: ['contacto', 'whatsapp', 'correo', 'email'], msg: `Escríbenos por WhatsApp: ${WHATSAPP_NUM}.` },
  { keys: ['impresión', 'imprimir', '3d', 'pieza'], msg: 'Hacemos impresión 3D a medida. Flujo: Nueva cotización → productos y PDF → guardar en espera.' },
  { keys: ['cambiar costo', 'costo del pla', 'costo pla', 'precio kg', 'costo material'], msg: 'Para cambiar el costo por kg del PLA u otros: menú Inventario → tabla «Costos de filamentos» (o en Nueva cotización el botón «Ver costos de filamentos»). Ahí solo ves números según tu acceso.' },
  { keys: ['inventario', 'filamento', 'comprar', 'reponer', 'stock bajo'], msg: 'En Inventario → Stock de filamentos ves gramos. Si eres admin, usa «Correo: filamento bajo» para avisarte por Gmail lo que está por debajo del umbral (requiere SMTP en el servidor).' },
  { keys: ['buscar', 'folio', 'orden', 'cotización', 'cotizacion', 'dónde está', 'donde esta'], msg: 'Escribe por ejemplo: buscar COT-2026 o el texto del proyecto. Si iniciaste sesión, intentaré buscar en cotizaciones recientes.' },
  { keys: ['analisis', 'análisis', 'ganancia', 'reporte'], msg: 'El módulo Análisis resume ventas, extras (envío, empaque, regalías) y costos. Abre el menú «Análisis».' },
  { keys: ['hola', 'buenas', 'ayuda'], msg: 'Soy el asistente del ERP. Puedes preguntar por: materiales y colores (sin costos ajenos), buscar cotización por folio, dónde cambiar precios de filamento, o ir a Análisis/Inventario.' },
]

function matchFaq(texto) {
  const t = (texto || '').toLowerCase().trim()
  for (const { keys, msg } of FAQ) {
    if (keys.some((k) => t.includes(k))) return msg
  }
  return null
}

export default function Chatbot() {
  const { api, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Asistente Rookie Makers 3D. Con sesión iniciada puedo resumir tipos de material y colores en inventario (sin costos de otros) y buscar cotizaciones por folio o texto. También te digo en qué menú cambiar cada cosa.',
    },
  ])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const replyWithAssistant = useCallback(
    async (text) => {
      const t = text.toLowerCase()
      const local = matchFaq(text)
      if (local && !t.includes('buscar') && !t.includes('color') && !t.includes('material') && !t.includes('pla')) {
        return local
      }

      if (!user) {
        return matchFaq(text) || `Para ayuda dentro del sistema inicia sesión. WhatsApp: ${WHATSAPP_NUM}.`
      }

      try {
        // Crear alerta programada (solo admin). Formato: alerta: titulo | mensaje | para a@x.com,b@y.com | 2026-04-06 18:30
        if ((t.includes('alerta:') || t.includes('alarma:') || t.startsWith('alerta ') || t.startsWith('alarma ')) && user?.role === 'administrador') {
          const r = await api('/asistente/crear-alerta', {
            method: 'POST',
            body: JSON.stringify({ text }),
          })
          const data = await r.json().catch(() => ({}))
          if (r.ok && data?.ok) {
            return `Listo. Alerta #${data.id} programada para ${data.send_at} a: ${(data.to || []).join(', ')}.\n\nTip: también puedes administrar todo en el menú «Alarmas / Alertas».`
          }
          return data?.mensaje || 'No pude crear la alerta. Usa: alerta: titulo | mensaje | para correo1,correo2 | 2026-04-06 18:30'
        }

        if (
          t.includes('color') ||
          t.includes('material') ||
          t.includes('pla') ||
          t.includes('filamento') ||
          t.includes('petg') ||
          t.includes('tipo de material')
        ) {
          const r = await api('/asistente/materiales-resumen')
          if (r.ok) {
            const data = await r.json()
            const tipos = (data.tipos_material || []).join(', ')
            const colores = data.colores_por_tipo || {}
            const lines = Object.entries(colores)
              .map(([tipo, arr]) => `${tipo}: ${arr.slice(0, 12).join(', ')}${arr.length > 12 ? '…' : ''}`)
              .join('\n')
            return `Tipos en catálogo: ${tipos || '—'}.\n\nColores en inventario compartido (sin gramos ni costos):\n${lines || 'Sin colores registrados.'}\n\n${data.nota_privacidad || ''}`
          }
        }

        if (t.includes('buscar') || t.includes('folio') || (t.includes('cotiz') && text.length > 4)) {
          const cleaned = text
            .replace(/buscar/gi, '')
            .replace(/cotización|cotizacion/gi, '')
            .replace(/folio/gi, '')
            .trim()
          const q = cleaned.length >= 2 ? cleaned : text.trim()
          if (q.length >= 2) {
            const r = await api(`/asistente/buscar?q=${encodeURIComponent(q)}`)
            if (r.ok) {
              const data = await r.json()
              const rows = data.resultados || []
              if (!rows.length) return `No encontré cotizaciones recientes que coincidan con «${q}». Prueba en menú «Cotizaciones espera».`
              return (
                data.ayuda +
                '\n\n' +
                rows.map((x) => `#${x.id} ${x.folio || ''} — ${x.descripcion || ''} (Total $${(x.total || 0).toFixed(0)})`).join('\n')
              )
            }
          }
        }
      } catch {
        return 'No pude consultar el servidor. Comprueba conexión y que el backend esté activo.'
      }

      return matchFaq(text) || 'Prueba: «¿qué colores hay en PLA?», «buscar COT-2026», «dónde cambio el costo del PLA» o abre Análisis / Inventario desde el menú.'
    },
    [api, user],
  )

  const send = async () => {
    const text = input.trim()
    if (!text || pending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setPending(true)
    const reply = await replyWithAssistant(text)
    setPending(false)
    setMessages((m) => [...m, { role: 'bot', text: reply }])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center text-2xl transition"
        aria-label="Abrir asistente"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50 shrink-0">
            <div className="relative w-8 h-8 shrink-0">
              <img src={publicPath('logo.png')} alt="" className="absolute inset-0 w-full h-full rounded-full object-cover bg-cyan-600" onError={(e) => { e.target.style.display = 'none' }} />
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">R</div>
            </div>
            <span className="font-semibold text-slate-900">Asistente</span>
            <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-cyan-700 text-xs ml-auto font-medium whitespace-nowrap">{WHATSAPP_NUM}</a>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900 p-1 rounded">✕</button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {pending && <p className="text-xs text-slate-500 px-1">Consultando…</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Pregunta o «buscar folio»…"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-300 focus:border-transparent"
            />
            <button type="button" onClick={send} disabled={pending} className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium disabled:opacity-50">
              Enviar
            </button>
          </div>
          <div className="px-3 pb-3 flex gap-2 shrink-0">
            <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
              WhatsApp
            </a>
            <a href={publicPath('cotizador')} className="flex-1 text-center px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
              Cotizar
            </a>
          </div>
        </div>
      )}
    </>
  )
}
