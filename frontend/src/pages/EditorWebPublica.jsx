import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Save, RefreshCw, Upload, Trash2, FileText } from 'lucide-react'

const pretty = (obj) => JSON.stringify(obj, null, 2)

export default function EditorWebPublica() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const [landingText, setLandingText] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const [rLanding, rFiles] = await Promise.all([api('/pagina-publica/landing'), api('/web-assets/list')])
      if (!rLanding.ok) throw new Error('No se pudo cargar landing')
      const landing = await rLanding.json().catch(() => ({}))
      setLandingText(pretty(landing))
      const list = rFiles.ok ? await rFiles.json().catch(() => []) : []
      setFiles(Array.isArray(list) ? list : [])
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  const saveLanding = async () => {
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const parsed = JSON.parse(landingText || '{}')
      const res = await api('/pagina-publica/landing', { method: 'PUT', body: JSON.stringify(parsed) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al guardar')
      setMsg('Landing guardada.')
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (file) => {
    setErr('')
    setMsg('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api('/web-assets/upload', { method: 'POST', body: form })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al subir')
      setMsg('Archivo subido.')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    } finally {
      setUploading(false)
    }
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este archivo?')) return
    setErr('')
    setMsg('')
    try {
      const res = await api(`/web-assets/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.detail || 'Error al eliminar')
      setMsg('Eliminado.')
      await load()
    } catch (e) {
      setErr(e.message || 'Error')
    }
  }

  const publicBase = useMemo(() => {
    // En VPS nginx debe proxy /web-assets/ al backend
    return `${window.location.origin}/web-assets/`
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Editor web pública (admin)"
        subtitle="Edita toda la landing (JSON) y sube archivos estáticos para servirlos en la web pública."
      />

      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}

      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 theme-text-muted text-sm">
            <FileText className="w-4 h-4 text-cyan-400" />
            Landing completa (JSON)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/5 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              type="button"
              onClick={saveLanding}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar landing'}
            </button>
          </div>
        </div>
        <textarea
          value={landingText}
          onChange={(e) => setLandingText(e.target.value)}
          rows={18}
          className="theme-input w-full px-4 py-3 rounded-xl border font-mono text-xs"
          spellCheck={false}
        />
        <p className="text-[11px] theme-text-dim mt-2">
          Tip: aquí también puedes editar `calculatorMaterials` (costos de la calculadora pública).
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 theme-text-muted text-sm">
            <Upload className="w-4 h-4 text-cyan-400" />
            Subir archivos estáticos
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium cursor-pointer">
            <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
            {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUpload(f)
                e.target.value = ''
              }}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="overflow-x-auto theme-table rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 font-semibold">Nombre</th>
                <th className="p-3 font-semibold">URL pública</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-white/5">
                  <td className="p-3 theme-text">{f.original_name}</td>
                  <td className="p-3 theme-text-muted text-xs">
                    <a className="text-cyan-400 hover:text-cyan-300" href={`${publicBase}${f.path}`} target="_blank" rel="noreferrer">
                      {publicBase}{f.path}
                    </a>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => del(f.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 theme-text-muted text-sm">Sin archivos aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] theme-text-dim mt-2">
          Estos archivos se sirven en `/web-assets/…` (requiere proxy en nginx del frontend).
        </p>
      </Card>
    </div>
  )
}

