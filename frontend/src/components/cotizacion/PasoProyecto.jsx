import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Box,
  LayoutTemplate,
  Wrench,
  Palette,
  Gamepad2,
  MoreHorizontal,
  Upload,
} from 'lucide-react'
import { Card, SectionHeader } from '../ui'

const CATEGORIAS = [
  { id: 'prototipo', label: 'Prototipo funcional', icon: Box },
  { id: 'maqueta', label: 'Maqueta', icon: LayoutTemplate },
  { id: 'refaccion', label: 'Refacción', icon: Wrench },
  { id: 'decorativo', label: 'Decorativo', icon: Palette },
  { id: 'gaming', label: 'Gaming / Setup', icon: Gamepad2 },
  { id: 'otro', label: 'Otro', icon: MoreHorizontal },
]

const ARCHIVO_LISTO_OPCIONES = [
  { id: 'si', label: 'Sí' },
  { id: 'no', label: 'No' },
  { id: 'correccion', label: 'Necesita corrección' },
]

const MAX_DESC = 2000

export default function PasoProyecto({ data, onChange }) {
  const [dragOver, setDragOver] = useState(false)
  const proyecto = data?.proyecto || {}
  const nombre = proyecto.nombre ?? ''
  const categoria = proyecto.categoria ?? 'otro'
  const descripcion = proyecto.descripcion ?? ''
  const archivoListo = proyecto.archivoListo ?? 'no'
  const filePreview = proyecto.filePreview ?? null

  const set = (key, value) => {
    onChange({
      ...data,
      proyecto: { ...proyecto, [key]: value },
    })
  }

  const handleFile = useCallback(
    (file) => {
      if (!file) {
        set('file', null)
        set('filePreview', null)
        return
      }
      if (!file.type.startsWith('image/')) {
        set('file', file)
        set('filePreview', null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => set('filePreview', reader.result)
      reader.readAsDataURL(file)
      set('file', file)
    },
    [proyecto]
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader
        title="Descripción del proyecto"
        subtitle="Nombre, categoría y detalles"
      />

      <Card>
        <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del proyecto *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => set('nombre', e.target.value)}
          placeholder="Ej: Soporte para monitor"
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-slate-400 mb-3">Categoría</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon
            const active = categoria === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => set('categoria', cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                  active
                    ? 'border-[rgba(79,142,247,0.5)] bg-[rgba(79,142,247,0.1)]'
                    : 'border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-8 h-8 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="text-xs font-medium text-white text-center">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-400">Descripción</label>
          <span className="text-slate-500 text-xs tabular-nums">
            {descripcion.length} / {MAX_DESC}
          </span>
        </div>
        <textarea
          value={descripcion}
          onChange={(e) => set('descripcion', e.target.value.slice(0, MAX_DESC))}
          rows={4}
          placeholder="Describe el proyecto, dimensiones, cantidad de piezas..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 resize-none focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-slate-400 mb-2">Archivo de referencia (STL, imagen o boceto)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
            dragOver ? 'border-[rgba(79,142,247,0.5)] bg-[rgba(79,142,247,0.05)]' : 'border-white/[0.12]'
          }`}
        >
          <input
            type="file"
            accept=".stl,image/*,.pdf"
            className="hidden"
            id="file-ref"
            onChange={(e) => handleFile(e.target.files[0] || null)}
          />
          {filePreview ? (
            <div className="space-y-2">
              <img
                src={filePreview}
                alt="Vista previa"
                className="max-h-40 mx-auto rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Quitar
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Arrastra un archivo aquí o haz clic para elegir</p>
              <label htmlFor="file-ref" className="inline-block mt-2 px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm cursor-pointer">
                Seleccionar archivo
              </label>
            </>
          )}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-slate-400 mb-2">¿Tiene archivo listo para imprimir?</label>
        <div className="flex flex-wrap gap-2">
          {ARCHIVO_LISTO_OPCIONES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => set('archivoListo', opt.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                archivoListo === opt.id
                  ? 'bg-[rgba(79,142,247,0.2)] text-white border border-[rgba(79,142,247,0.4)]'
                  : 'bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
