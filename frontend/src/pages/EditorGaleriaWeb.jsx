import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { SectionHeader } from '../components/ui'
import { Card } from '../components/ui'
import { Plus, Trash2, Upload, Image as ImageIcon, FolderOpen, RefreshCw } from 'lucide-react'

export default function EditorGaleriaWeb() {
  const { api, apiUpload } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [catImages, setCatImages] = useState([])
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef(null)

  const [form, setForm] = useState({ slug: '', label: '', tag: '', span: 'col-span-1 row-span-1' })

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const r = await api('/web-gallery/categories')
      const data = r.ok ? await r.json() : []
      setCategories(Array.isArray(data) ? data : [])
    } catch (_) {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    if (!selectedCat) { setCatImages([]); return }
    api(`/web-gallery/categories/${selectedCat.id}/images`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCatImages(Array.isArray(data) ? data : []))
      .catch(() => setCatImages([]))
  }, [selectedCat])

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage('')
    const params = new URLSearchParams({
      slug: form.slug,
      label: form.label,
      tag: form.tag,
      span: form.span,
    })
    try {
      const r = await api(`/web-gallery/categories?${params.toString()}`, { method: 'POST' })
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage(d.detail || 'Error al crear'); return }
      setMessage('Categoría creada ✅')
      setForm({ slug: '', label: '', tag: '', span: 'col-span-1 row-span-1' })
      setShowForm(false)
      await fetchCategories()
    } catch (err) { setMessage(err?.message || 'Error de red') }
  }

  const handleDeleteCat = async (id) => {
    if (!window.confirm('¿Eliminar categoría e imágenes?')) return
    setMessage('')
    try {
      const r = await api(`/web-gallery/categories/${id}`, { method: 'DELETE' })
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage(d.detail || 'Error'); return }
      setMessage('Categoría eliminada ✅')
      if (selectedCat?.id === id) setSelectedCat(null)
      await fetchCategories()
    } catch (err) { setMessage(err?.message || 'Error') }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedCat || !fileRef.current?.files?.[0]) return
    setMessage('')
    const formData = new FormData()
    formData.append('file', fileRef.current.files[0])
    try {
      const r = await apiUpload(`/web-gallery/categories/${selectedCat.id}/images`, formData)
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage(d.detail || 'Error al subir'); return }
      setMessage('Imagen subida ✅')
      fileRef.current.value = ''
      // refrescar imágenes
      const r2 = await api(`/web-gallery/categories/${selectedCat.id}/images`)
      const data = r2.ok ? await r2.json() : []
      setCatImages(Array.isArray(data) ? data : [])
    } catch (err) { setMessage(err?.message || 'Error') }
  }

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('¿Eliminar imagen?')) return
    setMessage('')
    try {
      const r = await api(`/web-gallery/images/${imgId}`, { method: 'DELETE' })
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage(d.detail || 'Error'); return }
      setMessage('Imagen eliminada ✅')
      setCatImages((prev) => prev.filter((i) => i.id !== imgId))
    } catch (err) { setMessage(err?.message || 'Error') }
  }

  const refreshGallery = async () => {
    setMessage('')
    await fetchCategories()
    setMessage('Galería recargada ✅')
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Editor de galería web" subtitle="Administra categorías e imágenes de la landing page" />

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-400 text-sm">{message}</div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
        >
          <Plus className="w-4 h-4" /> {showForm ? 'Cancelar' : 'Nueva categoría'}
        </button>
        <button
          type="button"
          onClick={refreshGallery}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Recargar
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs theme-text-muted mb-1">Slug (URL amigable, ej: funko-mujer)</label>
              <input className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="funko-mujer" required />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Nombre visible</label>
              <input className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Funko mujer" required />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Etiqueta / Tag</label>
              <input className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Coleccionables" required />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Tamaño en grid (span)</label>
              <select className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text" value={form.span} onChange={(e) => setForm((f) => ({ ...f, span: e.target.value }))}>
                <option value="col-span-1 row-span-1">1×1 (normal)</option>
                <option value="col-span-1 md:col-span-2 row-span-1">2×1 (ancho)</option>
                <option value="col-span-1 row-span-2">1×2 (alto)</option>
                <option value="col-span-1 md:col-span-2 row-span-2">2×2 (grande)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium">Crear categoría</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lista de categorías */}
        <Card className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold theme-text">Categorías</h3>
          </div>
          {loading && <p className="theme-text-dim text-sm">Cargando...</p>}
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${selectedCat?.id === cat.id ? 'bg-white/[0.1] border border-white/[0.15]' : 'hover:bg-white/[0.04] border border-transparent'}`}
              >
                <div>
                  <p className="text-sm theme-text font-medium">{cat.label}</p>
                  <p className="text-xs theme-text-dim">{cat.slug} · {cat.tag}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id) }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </button>
            ))}
            {categories.length === 0 && !loading && (
              <p className="theme-text-dim text-sm px-2">No hay categorías aún.</p>
            )}
          </div>
        </Card>

        {/* Imágenes de la categoría seleccionada */}
        <Card className="md:col-span-2">
          {selectedCat ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold theme-text">{selectedCat.label}</h3>
                </div>
                <span className="text-xs theme-text-dim">{catImages.length} imágenes</span>
              </div>

              <form onSubmit={handleUpload} className="flex items-center gap-3 mb-4">
                <input ref={fileRef} type="file" accept="image/*" className="text-sm theme-text file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:bg-white/[0.08] file:border-0 file:text-sm file:theme-text" required />
                <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium">
                  <Upload className="w-4 h-4" /> Subir
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {catImages.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-muted/20">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">{img.alt}</span>
                  </div>
                ))}
                {catImages.length === 0 && <p className="theme-text-dim text-sm col-span-full">Sin imágenes. Sube una arriba.</p>}
              </div>
            </>
          ) : (
            <p className="theme-text-dim text-sm">Selecciona una categoría para ver/subir imágenes.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
