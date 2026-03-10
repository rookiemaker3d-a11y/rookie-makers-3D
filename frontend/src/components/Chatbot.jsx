import { useState, useRef, useEffect } from 'react'

const WHATSAPP_NUM = '472 148 8913'
const WHATSAPP_BASE = 'https://wa.me/524721488913'
const WHATSAPP_CHAT = WHATSAPP_BASE + '?text=' + encodeURIComponent('Hola, me interesa información sobre impresión 3D.')

const RESPUESTAS = [
  { keys: ['cotización', 'cotizar', 'precio', 'costo', 'cuánto cuesta', 'cuanto cuesta'], msg: 'Puedes usar el Cotizador rápido (es aproximado). Para cotización exacta escríbenos por WhatsApp al ' + WHATSAPP_NUM + '.' },
  { keys: ['redes', 'instagram', 'facebook', 'tiktok', 'síguenos', 'seguir'], msg: 'Estamos en Facebook, TikTok e Instagram como Rookie Makers 3D. En la página de Proyectos tienes todos los enlaces.' },
  { keys: ['contacto', 'contactar', 'whatsapp', 'correo', 'email', 'mensaje', 'info'], msg: 'Escríbenos por WhatsApp al ' + WHATSAPP_NUM + '. Abre el chat directo: ' + WHATSAPP_CHAT },
  { keys: ['impresión', 'imprimir', '3d', 'pieza'], msg: 'Hacemos impresión 3D a medida. Usa el Cotizador para una estimación aproximada y escríbenos por WhatsApp (' + WHATSAPP_NUM + ') para cotización exacta.' },
  { keys: ['hola', 'buenas', 'ayuda'], msg: 'Hola. Somos Rookie Makers 3D. ¿En qué te ayudo? Puedo informarte sobre cotizaciones, redes o contacto por WhatsApp (' + WHATSAPP_NUM + ').' },
]

function getRespuesta(texto) {
  const t = (texto || '').toLowerCase().trim()
  for (const { keys, msg } of RESPUESTAS) {
    if (keys.some((k) => t.includes(k))) return msg
  }
  return 'Para más información escríbenos por WhatsApp al ' + WHATSAPP_NUM + '. Puedo ayudarte con: cotizaciones (aproximadas), redes o contacto.'
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hola, soy el asistente de Rookie Makers 3D. Escribe "cotización", "redes" o "contacto". Para más información: WhatsApp 472 148 8913.' }])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    const reply = getRespuesta(text)
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: reply }])
    }, 400)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 flex items-center justify-center text-2xl transition"
        aria-label="Abrir chat"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-600 flex items-center gap-2 bg-slate-800">
            <div className="relative w-8 h-8 shrink-0">
              <img src="/logo.png" alt="Logo" className="absolute inset-0 w-full h-full rounded-full object-cover bg-cyan-600" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">R</div>
            </div>
            <span className="font-semibold text-white">Rookie Makers 3D</span>
            <a href={WHATSAPP_CHAT} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 text-xs ml-auto font-medium">472 148 8913</a>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">✕</button>
          </div>
          <div className="h-80 overflow-y-auto p-3 space-y-2 bg-slate-900/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-slate-600 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Escribe aquí..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button type="button" onClick={send} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium">
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
