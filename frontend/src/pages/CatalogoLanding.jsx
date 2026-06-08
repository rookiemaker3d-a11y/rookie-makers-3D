import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SectionHeader, Card } from '../components/ui'
import { Plus, Trash2, Save, RefreshCw, Power, PowerOff, Edit2, X, ImageIcon, Package } from 'lucide-react'

/** Página admin: CRUD de productos del catálogo público de la landing.
 *  - Lista los productos actuales
 *  - Permite crear / editar / activar / eliminar
 *  - Permite sembrar los productos iniciales del portfolio (seed)
 */
export default function CatalogoLanding() {
  const { api } = useAuth()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // {type: 'ok'|'err', text}
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null) // null = crear, número = editar

  // Estado del formulario (compartido crear/editar)
  const blank = { slug: '', nombre: '', descripcion: '', precio: 0, imagen_url: '', categoria: '', activo: true, orden: 0 }
  const [form, setForm] = useState(blank)

  const fetchProductos = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const r = await api('/catalogo/admin/productos')
      const data = r.ok ? await r.json() : []
      setProductos(Array.isArray(data) ? data : [])
    } catch (e) {
      setMessage({ type: 'err', text: e?.message || 'Error de red' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProductos() }, [])

  const handleSeed = async () => {
    if (!window.confirm('Cargar productos iniciales del portfolio. No duplica los que ya existen.')) return
    setMessage(null)
    try {
      const r = await api('/catalogo/admin/seed', { method: 'POST' })
      const data = r.ok ? await r.json() : null
      if (!r.ok) { setMessage({ type: 'err', text: data?.detail || 'Error al sembrar' }); return }
      setMessage({ type: 'ok', text: `Seed listo: ${data.creados} creados, ${data.saltados} ya existían.` })
      await fetchProductos()
    } catch (e) {
      setMessage({ type: 'err', text: e?.message || 'Error' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    // Normalizar payload
    const payload = {
      ...form,
      precio: Number(form.precio) || 0,
      orden: Number(form.orden) || 0,
      descripcion: form.descripcion?.trim() || null,
      imagen_url: form.imagen_url?.trim() || null,
      categoria: form.categoria?.trim() || null,
    }
    try {
      const r = editId
        ? await api(`/catalogo/admin/productos/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/catalogo/admin/productos', { method: 'POST', body: JSON.stringify(payload) })
      const data = r.ok ? null : await r.json().catch(() => ({}))
      if (!r.ok) { setMessage({ type: 'err', text: data?.detail || 'Error al guardar' }); return }
      setMessage({ type: 'ok', text: editId ? 'Producto actualizado ✅' : 'Producto creado ✅' })
      setShowForm(false)
      setEditId(null)
      setForm(blank)
      await fetchProductos()
    } catch (e) {
      setMessage({ type: 'err', text: e?.message || 'Error de red' })
    }
  }

  const handleEdit = (p) => {
    setEditId(p.id)
    setForm({
      slug: p.slug,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio || 0,
      imagen_url: p.imagen_url || '',
      categoria: p.categoria || '',
      activo: p.activo,
      orden: p.orden || 0,
    })
    setShowForm(true)
  }

  const handleToggleActivo = async (p) => {
    setMessage(null)
    try {
      const r = await api(`/catalogo/admin/productos/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !p.activo }),
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage({ type: 'err', text: d.detail || 'Error' }); return }
      setMessage({ type: 'ok', text: p.activo ? 'Producto desactivado' : 'Producto activado' })
      await fetchProductos()
    } catch (e) {
      setMessage({ type: 'err', text: e?.message || 'Error' })
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}" del catálogo? Esta acción no se puede deshacer.`)) return
    setMessage(null)
    try {
      const r = await api(`/catalogo/admin/productos/${p.id}`, { method: 'DELETE' })
      if (!r.ok) { const d = await r.json().catch(() => ({})); setMessage({ type: 'err', text: d.detail || 'Error' }); return }
      setMessage({ type: 'ok', text: 'Producto eliminado ✅' })
      await fetchProductos()
    } catch (e) {
      setMessage({ type: 'err', text: e?.message || 'Error' })
    }
  }

  const openCreate = () => {
    setEditId(null)
    setForm(blank)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(blank)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Catálogo público (landing)"
        subtitle="Edita los productos que se muestran en www.rookiemakers3d.com"
      />

      {message && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
        <button
          type="button"
          onClick={fetchProductos}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Recargar
        </button>
        <button
          type="button"
          onClick={handleSeed}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium"
          title="Carga los productos del portfolio (no duplica existentes)"
        >
          <Package className="w-4 h-4" /> Sembrar desde portfolio
        </button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold theme-text">
              {editId ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <button type="button" onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-white/[0.08]">
              <X className="w-4 h-4 theme-text-dim" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs theme-text-muted mb-1">Slug (URL amigable, único)</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="funko-futbolista"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Nombre visible</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Funko Futbolista"
                required
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Precio (MXN, 0 = a convenir)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Categoría</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Coleccionables"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs theme-text-muted mb-1">URL de imagen (públicamente accesible)</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.imagen_url}
                onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))}
                placeholder="/portfolio/funko-futbolista/00.png"
              />
              {form.imagen_url && (
                <div className="mt-2">
                  <img src={form.imagen_url} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-white/10" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs theme-text-muted mb-1">Descripción</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text min-h-[80px]"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Figura coleccionable impresa en PLA de alta calidad, acabado mate, varios colores disponibles..."
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Orden (menor = primero)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                value={form.orden}
                onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">Estado</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className="theme-text text-sm">Activo (visible en la landing)</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                <Save className="w-4 h-4" /> {editId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button type="button" onClick={cancelForm} className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] theme-text font-medium">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold theme-text">Productos ({productos.length})</h3>
        </div>
        {loading && <p className="theme-text-dim text-sm">Cargando...</p>}

        {!loading && productos.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <p className="theme-text-dim text-sm">No hay productos aún.</p>
            <button type="button" onClick={handleSeed} className="text-cyan-400 hover:text-cyan-300 text-sm underline">
              Cargar productos desde el portfolio
            </button>
          </div>
        )}

        <div className="space-y-2">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 p-3 rounded-xl border ${
                p.activo ? 'border-white/10 bg-white/[0.02]' : 'border-white/[0.04] bg-white/[0.01] opacity-60'
              }`}
            >
              {/* miniatura */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center theme-text-dim">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <p className="theme-text font-medium truncate">{p.nombre}</p>
                <p className="text-xs theme-text-dim truncate">
                  {p.slug} · {p.categoria || 'Sin categoría'} · orden {p.orden}
                </p>
              </div>

              {/* precio */}
              <div className="text-right">
                {Number(p.precio) > 0 ? (
                  <p className="theme-text font-semibold">${Number(p.precio).toFixed(2)}</p>
                ) : (
                  <p className="text-amber-400 text-xs">A convenir</p>
                )}
              </div>

              {/* acciones */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(p)}
                  className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActivo(p)}
                  className={`p-2 rounded-lg ${p.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'theme-text-dim hover:bg-white/[0.06]'}`}
                  title={p.activo ? 'Desactivar' : 'Activar'}
                >
                  {p.activo ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
