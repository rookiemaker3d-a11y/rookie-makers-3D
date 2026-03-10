import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CALIDADES, TAMANOS } from '../utils/cotizador'

const WHATSAPP_NUM = '524721488913'

function buildWhatsAppUrl(text) {
  const encoded = encodeURIComponent(text || 'Hola, me interesa cotización de impresión 3D.')
  return `https://wa.me/${WHATSAPP_NUM}?text=${encoded}`
}

const PASOS = [
  { num: 1, titulo: 'Describe tu proyecto', desc: 'Figura, pieza o prototipo que necesitas' },
  { num: 2, titulo: 'Tamaño y calidad', desc: 'Proporción y tipo de relleno' },
  { num: 3, titulo: 'Envía y recibe cotización', desc: 'Por WhatsApp sin compromiso' },
]

export default function Cotizador() {
  const [descripcion, setDescripcion] = useState('')
  const [tamano, setTamano] = useState('mediano')
  const [calidad, setCalidad] = useState('media')

  const t = TAMANOS[tamano]?.label || 'Mediano'
  const c = CALIDADES[calidad]?.label || 'Media'
  const mensaje = [
    'Hola, me interesa cotización de impresión 3D.',
    descripcion && `Descripción: ${descripcion}`,
    `Tamaño: ${t}. Calidad: ${c}.`,
  ].filter(Boolean).join('\n')
  const whatsappUrl = buildWhatsAppUrl(mensaje)

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/proyectos" className="text-xl font-bold text-neutral-900 hover:text-neutral-600 transition">
            Rookie Makers 3D
          </Link>
          <Link to="/login" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium">
            Entrar al sistema
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Solicita tu cotización</h1>
          <p className="text-neutral-500 text-lg">
            Cuéntanos qué necesitas. Te respondemos por WhatsApp con tu cotización sin compromiso.
          </p>
        </div>

        {/* Pasos indicador */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
          {PASOS.map((paso, i) => (
            <div key={paso.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <span className="w-9 h-9 rounded-full bg-neutral-800 text-white text-sm font-semibold flex items-center justify-center">
                  {paso.num}
                </span>
                <span className="hidden sm:block text-xs text-neutral-500 mt-1 max-w-[80px] text-center">{paso.titulo}</span>
              </div>
              {i < PASOS.length - 1 && <div className="w-8 sm:w-12 h-0.5 bg-neutral-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Bloque descripción */}
          <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
              <h2 className="font-semibold text-neutral-900">Descripción del proyecto</h2>
              <p className="text-sm text-neutral-500">Organizador, pieza de repuesto, figura decorativa, prototipo…</p>
            </div>
            <div className="p-5">
              <textarea
                placeholder="Ej: Organizador de escritorio, pieza de repuesto, figura decorativa..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 resize-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition"
              />
            </div>
          </section>

          {/* Bloque tamaño */}
          <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
              <h2 className="font-semibold text-neutral-900">Tamaño (proporción)</h2>
              <p className="text-sm text-neutral-500">Referencia para estimar dimensiones</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TAMANOS).map(([key, item]) => (
                  <label
                    key={key}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                      tamano === key ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input type="radio" name="tamano" checked={tamano === key} onChange={() => setTamano(key)} className="sr-only" />
                    <span className="text-2xl mb-1">{key === 'pequeno' ? '●' : key === 'mediano' ? '●●' : '●●●'}</span>
                    <span className="font-medium text-neutral-900 text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Bloque calidad */}
          <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
              <h2 className="font-semibold text-neutral-900">Calidad (relleno)</h2>
              <p className="text-sm text-neutral-500">Afecta resistencia y detalle</p>
            </div>
            <div className="p-5 space-y-2">
              {Object.entries(CALIDADES).map(([key, item]) => (
                <label
                  key={key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    calidad === key ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input type="radio" name="calidad" checked={calidad === key} onChange={() => setCalidad(key)} className="w-4 h-4 text-neutral-800" />
                  <div className="flex-1">
                    <span className="font-medium text-neutral-900">{item.label}</span>
                    <span className="text-neutral-500 text-sm ml-2">({item.relleno} relleno)</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* CTA principal */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-7 h-7 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Enviar por WhatsApp y recibir cotización
          </a>
          <p className="text-neutral-500 text-center text-sm">
            Se abrirá el chat. Te respondemos a la brevedad.
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-neutral-200 flex justify-center">
          <a
            href={buildWhatsAppUrl('Hola, me interesa información sobre impresión 3D.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 px-5 py-3 transition shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-sm shrink-0">R</div>
            <div className="text-left">
              <p className="font-medium text-neutral-900">¿Dudas?</p>
              <p className="text-neutral-600 font-mono text-sm">472 148 8913</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
