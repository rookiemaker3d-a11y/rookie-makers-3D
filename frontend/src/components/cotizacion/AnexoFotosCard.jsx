import { useState, useRef } from 'react'
import { Camera, X } from 'lucide-react'

export default function AnexoFotosCard({ cotizacion, onSave, api, setUpdating }) {
  const [open, setOpen] = useState(false)
  const [fotos, setFotos] = useState(cotizacion.detalles?.fotos_terminado || [])
  const [notas, setNotas] = useState(cotizacion.detalles?.notas_terminado || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setFotos((prev) => [...prev.slice(-4), reader.result].slice(-5))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeFoto = (i) => setFotos((prev) => prev.filter((_, j) => j !== i))

  const save = async () => {
    if (fotos.length === 0) return
    setUpdating(cotizacion.id)
    setSaving(true)
    try {
      await api(`/cotizaciones-en-espera/${cotizacion.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          detalles: {
            ...cotizacion.detalles,
            fotos_terminado: fotos,
            notas_terminado: notas,
          },
        }),
      })
      setOpen(false)
      onSave()
    } finally {
      setSaving(false)
      setUpdating(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
      >
        <Camera className="w-3 h-3" />
        {fotos.length ? `${fotos.length} foto(s)` : 'Subir foto'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-white/[0.08] bg-slate-900 p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-medium text-sm">Anexo de foto terminado</span>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full py-2 rounded-lg border border-dashed border-white/20 text-slate-400 text-sm mb-2"
            >
              + Añadir imagen
            </button>
            <div className="flex gap-2 flex-wrap mb-2">
              {fotos.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded overflow-hidden bg-white/5">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFoto(i)}
                    className="absolute top-0 right-0 bg-black/60 text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas internas (opcional)"
              rows={2}
              className="w-full px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder-slate-500 mb-3"
            />
            <button
              type="button"
              onClick={save}
              disabled={fotos.length === 0 || saving}
              className="w-full py-2 rounded-lg bg-white/[0.1] hover:bg-white/[0.14] text-white text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
