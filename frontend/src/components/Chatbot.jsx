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
  { keys: ['producto', 'guardar producto', 'agregar producto', 'crear producto', 'no guarda', 'no se guarda'], msg: 'Para guardar un producto ve a Productos → «Agregar producto». Completa descripción, costo de producción y costo final. Si marca error, verifica que los campos numéricos tengan valores válidos y que tu rol permita crear (admin o vendedor_ventas).' },
  { keys: ['suscripción', 'suscripcion', 'plan', 'pago', 'mercado pago', 'membresía', 'membresia'], msg: 'Las suscripciones se gestionan desde el menú Perfiles (solo admin). Ahí puedes asignar plan, generar link de pago de Mercado Pago y ver fecha de vencimiento.' },
  { keys: ['pdf', 'descargar', 'imprimir cotización', 'recibo'], msg: 'En Cotizaciones espera, al marcar como «cotizado» se genera un PDF que puedes descargar. También desde el paso final de Nueva cotización.' },
  { keys: ['cliente', 'agregar cliente', 'nuevo cliente'], msg: 'Ve al menú Clientes para agregar, editar o consultar clientes. Los datos se usan al crear cotizaciones.' },
  { keys: ['seguridad', 'contraseña', 'mfa', 'autenticación', '2fa', 'doble factor'], msg: 'En el menú Seguridad puedes activar MFA (autenticación de dos factores con Google Authenticator), cambiar tu contraseña y ver el registro de accesos.' },
  { keys: ['stl', 'archivo stl', 'modelo 3d', 'convertir imagen'], msg: 'En la calculadora puedes subir una imagen (PNG/JPG) y convertirla a STL automáticamente. También puedes subir archivos STL directamente a las cotizaciones.' },
  { keys: ['cotización en espera', 'estado', 'pipeline', 'flujo', 'proceso'], msg: 'Las cotizaciones pasan por estados: espera → aprobado → en producción → post proceso → anexo foto → entregado. Usa «Siguiente» para avanzar el estado en cada cotización.' },
  { keys: ['hora', 'horas diseñador', 'saldo horas', 'paquete horas', 'cyber'], msg: 'Los diseñadores tienen saldo de horas (modelo cyber-café). El admin puede asignar paquetes de horas con fecha de vencimiento desde Perfiles. Las horas se consumen al trabajar.' },
  { keys: ['video', 'videos promocionales', 'promo', 'tiktok video'], msg: 'En el menú Videos promocionales puedes gestionar enlaces de videos. Los videos pasan por aprobación antes de publicarse.' },
  { keys: ['error', 'falla', 'bug', 'problema', 'no funciona'], msg: 'Si algo no funciona: 1) Recarga la página (F5). 2) Cierra sesión y vuelve a entrar. 3) Limpia caché del navegador. Si persiste, reporta el error por WhatsApp.' },
  { keys: ['perfil', 'mi perfil', 'editar perfil', 'datos personales'], msg: 'En el menú Configuración puedes editar tu perfil: nombre, teléfono, datos bancarios. El admin puede gestionar todos los perfiles desde Perfiles.' },
  { keys: ['dashboard', 'panel', 'inicio', 'resumen general'], msg: 'El Dashboard muestra el resumen general: costo total, venta total, ganancia neta y cantidad de productos. Usa el % de inversión para calcular cuánto reservar.' },
  { keys: ['exportar', 'excel', 'csv', 'descargar datos'], msg: 'Actualmente los datos se consultan dentro del ERP. Para análisis detallado usa el módulo Análisis que desglosa costos, ganancias y extras.' },
  { keys: ['tiempo', 'tiempo de entrega', 'cuánto tarda', 'cuanto tarda', 'días', 'dias'], msg: 'El tiempo de entrega depende de la complejidad. Impresiones sencillas: 1-3 días. Proyectos complejos o con post-proceso: 5-10 días hábiles. Pregunta por tu cotización específica por WhatsApp.' },
  { keys: ['envío', 'envio', 'paquetería', 'paqueteria', 'domicilio', 'entrega a domicilio'], msg: 'Hacemos envíos a todo México. El costo de envío se calcula en la cotización según destino y peso. También puedes recoger en nuestro taller en Irapuato, Gto.' },
  { keys: ['garantía', 'garantia', 'defecto', 'mal impreso', 'reimpresión', 'reimpresion'], msg: 'Si la pieza tiene defectos de impresión, la reponemos sin costo. Reporta cualquier problema dentro de los 3 días posteriores a la entrega con fotos por WhatsApp.' },
  { keys: ['pago', 'forma de pago', 'método de pago', 'metodo de pago', 'transferencia', 'efectivo'], msg: 'Aceptamos transferencia bancaria, Mercado Pago y efectivo (solo en tienda). El anticipo es del 50% para empezar la impresión; el resto al entregar.' },
  { keys: ['personalizar', 'personalización', 'medida', 'a medida', 'custom', 'propio'], msg: '¡Claro! Puedes personalizar tamaño, color, texto grabado y más. Sube tu imagen o STL en Nueva cotización y describe qué necesitas. También convertimos imágenes a STL.' },
  { keys: ['pedido especial', 'pedido grande', 'mayoreo', 'volumen', 'descuento volumen'], msg: 'Para pedidos de 10+ piezas ofrecemos descuento por volumen. Crea una cotización con la cantidad deseada y aplica el % de descuento en la vista previa, o contáctanos por WhatsApp para cotización especial.' },
  { keys: ['acabado', 'pintura', 'lijar', 'pulir', 'postproceso', 'post proceso'], msg: 'Ofrecemos acabados: lijado, pintura acrílica, pulido, ensamblaje de piezas. Los acabados se agregan como extras en la cotización. Cada acabado tiene costo según la pieza.' },
  { keys: ['material', 'pla', 'petg', 'abs', 'tpu', 'tipo'], msg: '' },
  { keys: ['color', 'colores disponibles'], msg: '' },
]

function matchFaq(texto) {
  const t = (texto || '').toLowerCase().trim()
  for (const { keys, msg } of FAQ) {
    if (keys.some((k) => t.includes(k))) return msg || null
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

  // --- Drag state ---
  const panelRef = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 })
  const [panelPos, setPanelPos] = useState({ left: null, top: null })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Drag handlers for header
  const startDrag = (clientX, clientY) => {
    const panel = panelRef.current
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    dragRef.current = { dragging: true, startX: clientX, startY: clientY, origLeft: rect.left, origTop: rect.top }
  }

  const onHeaderMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
    const onMouseMove = (ev) => {
      if (!dragRef.current.dragging) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const newLeft = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.origLeft + dx))
      const newTop = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origTop + dy))
      setPanelPos({ left: newLeft, top: newTop })
    }
    const onMouseUp = () => {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const onHeaderTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return
    const touch = e.touches[0]
    if (!touch) return
    startDrag(touch.clientX, touch.clientY)
    const onTouchMove = (ev) => {
      if (!dragRef.current.dragging) return
      const t = ev.touches[0]
      if (!t) return
      const dx = t.clientX - dragRef.current.startX
      const dy = t.clientY - dragRef.current.startY
      const newLeft = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.origLeft + dx))
      const newTop = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origTop + dy))
      setPanelPos({ left: newLeft, top: newTop })
    }
    const onTouchEnd = () => {
      dragRef.current.dragging = false
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
  }

  const panelStyle = panelPos.left !== null
    ? { position: 'fixed', left: panelPos.left, top: panelPos.top, bottom: 'auto', right: 'auto' }
    : {}

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
        // Crear alerta programada (solo admin)
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

      return matchFaq(text) || 'Prueba: «¿qué colores hay en PLA?», «buscar COT-2026», «dónde cambio el costo del PLA», «cómo guardo un producto» o abre Análisis / Inventario desde el menú.'
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
        onClick={() => { setOpen(!open); setPanelPos({ left: null, top: null }) }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center text-2xl transition"
        aria-label="Abrir asistente"
      >
        💬
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className={`fixed z-40 w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[85vh] ${panelPos.left === null ? 'bottom-24 right-6' : ''}`}
        >
          <div
            onMouseDown={onHeaderMouseDown}
            onTouchStart={onHeaderTouchStart}
            className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50 shrink-0 cursor-move select-none"
          >
            <div className="relative w-8 h-8 shrink-0">
              <img src={publicPath('logo.png')} alt="" className="absolute inset-0 w-full h-full rounded-full object-cover bg-cyan-600" onError={(e) => { e.target.style.display = 'none' }} />
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">R</div>
            </div>
            <span className="font-semibold text-slate-900">Asistente</span>
            <span className="text-slate-400 text-xs ml-1">↕ arrastrar</span>
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