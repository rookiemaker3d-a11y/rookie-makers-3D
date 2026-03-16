import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Pencil, Trash2, Package, Droplets } from 'lucide-react'

/** Extrae color dominante (hex) de un archivo de imagen usando canvas. */
function getDominantColorFromFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 64
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(size / 4, size / 4, size / 2, size / 2).data
        let r = 0, g = 0, b = 0, n = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          n++
        }
        if (n) {
          r = Math.round(r / n)
          g = Math.round(g / n)
          b = Math.round(b / n)
          resolve('#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''))
        } else resolve(null)
      } catch {
        resolve(null)
      }
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

/** Convierte archivo a data URL. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function Inventario() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [filamentos, setFilamentos] = useState([])
  const [stockFilamentos, setStockFilamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [editingCostoId, setEditingCostoId] = useState(null)
  const [costoTemp, setCostoTemp] = useState('')
  const [formFilamentoOpen, setFormFilamentoOpen] = useState(false)
  const [formFilamento, setFormFilamento] = useState({ nombre: '', tipo: 'PLA', color_hex: '', color_nombre: '', cantidad_gramos: 0, foto_url: '' })
  const [consumirGramos, setConsumirGramos] = useState({ id: null, gramos: '' })
  const [showCostosFilamento, setShowCostosFilamento] = useState(true)
  const fileInputRef = useRef(null)

  const isAdmin = user?.role === 'administrador'

  function loadFilamentos() {
    api('/materiales-filamento')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFilamentos(Array.isArray(data) ? data : []))
      .catch(() => setFilamentos([]))
  }

  function loadStockFilamentos() {
    api('/inventario-filamento')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setStockFilamentos(Array.isArray(data) ? data : []); setError(''); })
      .catch(() => {
        setStockFilamentos([])
        setError('No se pudo conectar al servidor. ¿Está activo? (Render puede tardar ~1 min en despertar).')
      })
  }

  function load() {
    setLoading(true)
    Promise.all([
      api('/inventario').then((r) => (r.ok ? r.json() : [])).then((data) => setItems(Array.isArray(data) ? data : [])),
      api('/materiales-filamento').then((r) => (r.ok ? r.json() : [])).then((data) => setFilamentos(Array.isArray(data) ? data : [])),
      api('/inventario-filamento').then((r) => (r.ok ? r.json() : [])).then((data) => setStockFilamentos(Array.isArray(data) ? data : [])),
    ]).then(() => setError('')).catch(() => setError('No se pudo conectar al servidor. ¿Está activo? (Render puede tardar ~1 min en despertar).')).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const saveCostoFilamento = async (id) => {
    const val = Number(costoTemp)
    if (Number.isNaN(val) || val < 0) return
    try {
      await api(`/materiales-filamento/${id}`, { method: 'PATCH', body: JSON.stringify({ costo_por_kg: val }) })
      setEditingCostoId(null)
      setCostoTemp('')
      loadFilamentos()
      setMsg('Costo actualizado.')
    } catch {
      setError('Error al actualizar costo.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nombre?.trim()) {
      setMsg('El nombre es obligatorio.')
      return
    }
    setError('')
    setMsg('')
    try {
      if (editingId) {
        await api(`/inventario/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion?.trim() || null,
            cantidad: Number(form.cantidad) || 0,
            unidad: form.unidad || 'pza',
          }),
        })
        setMsg('Ítem actualizado.')
      } else {
        await api('/inventario', {
          method: 'POST',
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion?.trim() || null,
            cantidad: Number(form.cantidad) || 0,
            unidad: form.unidad || 'pza',
          }),
        })
        setMsg('Ítem agregado.')
      }
      setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
      setEditingId(null)
      setFormOpen(false)
      load()
    } catch (err) {
      setError(err.status === 403 ? 'No tienes permiso para editar este ítem.' : 'Error al guardar.')
    }
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar este ítem del inventario?')) return
    try {
      await api(`/inventario/${id}`, { method: 'DELETE' })
      setMsg('Ítem eliminado.')
      load()
    } catch (err) {
      setError(err.status === 403 ? 'No tienes permiso para eliminar este ítem.' : 'Error al eliminar.')
    }
  }

  const startEdit = (item) => {
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      cantidad: item.cantidad ?? 0,
      unidad: item.unidad || 'pza',
    })
    setEditingId(item.id)
    setFormOpen(true)
  }

  const cancelForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' })
  }

  const onFilamentoPhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setFormFilamento((f) => ({ ...f, foto_url: dataUrl }))
      const hex = await getDominantColorFromFile(file)
      if (hex) setFormFilamento((f) => ({ ...f, color_hex: hex }))
    } catch {
      setError('Error al procesar la imagen.')
    }
  }

  const submitFilamento = async (e) => {
    e.preventDefault()
    if (!formFilamento.nombre?.trim()) { setError('Nombre obligatorio'); return }
    setError('')
    setMsg('')
    try {
      await api('/inventario-filamento', {
        method: 'POST',
        body: JSON.stringify({
          nombre: formFilamento.nombre.trim(),
          tipo: formFilamento.tipo || 'PLA',
          color_hex: formFilamento.color_hex || null,
          color_nombre: formFilamento.color_nombre || null,
          cantidad_gramos: Number(formFilamento.cantidad_gramos) || 0,
          foto_url: formFilamento.foto_url || null,
        }),
      })
      setMsg('Filamento agregado.')
      setFormFilamento({ nombre: '', tipo: 'PLA', color_hex: '', color_nombre: '', cantidad_gramos: 0, foto_url: '' })
      setFormFilamentoOpen(false)
      loadStockFilamentos()
    } catch (err) {
      const isNetwork = err?.message === 'Failed to fetch' || err?.name === 'TypeError'
      setError(isNetwork
        ? 'No se pudo conectar al servidor. ¿Está activo? (Render puede tardar ~1 min en despertar).'
        : (err?.message || (err?.status === 403 ? 'Solo vendedores pueden agregar filamentos.' : 'Error al guardar.')))
    }
  }

  const deleteFilamento = async (id) => {
    if (!confirm('¿Eliminar este filamento del inventario?')) return
    try {
      await api(`/inventario-filamento/${id}`, { method: 'DELETE' })
      setMsg('Filamento eliminado.')
      loadStockFilamentos()
    } catch {
      setError('Error al eliminar.')
    }
  }

  const consumirFilamento = async () => {
    const id = consumirGramos.id
    const g = Number(consumirGramos.gramos)
    if (!id || g <= 0) return
    try {
      await api(`/inventario-filamento/${id}/consumir`, { method: 'PATCH', body: JSON.stringify({ gramos: g }) })
      setConsumirGramos({ id: null, gramos: '' })
      setMsg('Consumo registrado.')
      loadStockFilamentos()
    } catch (err) {
      setError(err?.message || 'Error al consumir.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 theme-text-muted">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {msg && <p className="text-cyan-500 text-sm">{msg}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Tabla de costos de los materiales (para cotización) — explícita y editable */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold theme-text">Tabla de costos de los materiales (para cotización)</h2>
            <p className="theme-text-muted text-sm mt-0.5">Estos son los precios por kg que se usan en la cotización (dropdown «Material de impresión» y en el PDF). Edítalos aquí.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCostosFilamento((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm shadow-sm"
          >
            <Droplets className="w-5 h-5" />
            {showCostosFilamento ? 'Ocultar tabla de costos de materiales' : 'Ver / editar tabla de costos de materiales'}
          </button>
        </div>
      </Card>

      {showCostosFilamento && (
        <>
      <SectionHeader
        title="Tabla de costos de los materiales (para cotización)"
        subtitle="Material y costo por kg (MXN). Estos precios salen en la cotización. Usa el lápiz para editar y Guardar."
      />
      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Material</th>
              <th className="p-3 theme-text-muted font-medium">Costo por kg (MXN)</th>
              <th className="p-3 theme-text-muted font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {filamentos.map((f) => (
              <tr key={f.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3 theme-text font-medium">{f.nombre}</td>
                <td className="p-3">
                  {editingCostoId === f.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={costoTemp}
                        onChange={(e) => setCostoTemp(e.target.value)}
                        className="theme-input w-28 px-2 py-1.5 rounded-lg border text-sm"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveCostoFilamento(f.id)} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs">Guardar</button>
                      <button type="button" onClick={() => { setEditingCostoId(null); setCostoTemp(''); }} className="px-2 py-1 rounded-lg bg-slate-600 text-white text-xs">Cancelar</button>
                    </div>
                  ) : (
                    <span className="theme-text tabular-nums">${(f.costo_por_kg ?? 0).toFixed(0)}</span>
                  )}
                </td>
                <td className="p-3">
                  {editingCostoId !== f.id && (
                    <button
                      type="button"
                      onClick={() => { setEditingCostoId(f.id); setCostoTemp(String(f.costo_por_kg ?? 0)); }}
                      className="p-1.5 rounded text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      aria-label="Editar costo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filamentos.length === 0 && !loading && (
          <div className="p-6 text-center theme-text-muted text-sm">
            <p className="font-medium theme-text mb-1">No hay materiales cargados.</p>
            <p>Esta es la tabla de costos de los materiales que usa la cotización. Para llenarla: en la carpeta del proyecto ejecuta el seed del backend (por ejemplo <code className="bg-black/10 dark:bg-white/10 px-1 rounded">cd backend &amp;&amp; python -m app.seed</code> o el comando que uses). Así aparecerán PLA, PETG, etc. con su costo por kg y podrás editarlos aquí.</p>
          </div>
        )}
      </Card>
        </>
      )}

      {/* Tabla de colores (stock de filamentos por color) */}
      <SectionHeader
        title="Tabla de colores"
        subtitle="Colores de filamento en stock (hex y nombre). Útil para referencia en cotización."
      />
      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Color</th>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Tipo</th>
              <th className="p-3 theme-text-muted font-medium">Gramos</th>
            </tr>
          </thead>
          <tbody>
            {stockFilamentos.filter((f) => f.color_hex || f.color_nombre).map((f) => (
              <tr key={f.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3">
                  {f.color_hex ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-8 h-8 rounded border shrink-0" style={{ backgroundColor: f.color_hex }} title={f.color_hex} />
                      <span className="theme-text-muted text-xs">{f.color_hex}</span>
                    </span>
                  ) : (
                    <span className="theme-text-muted">—</span>
                  )}
                </td>
                <td className="p-3 theme-text font-medium">{f.nombre || '—'}</td>
                <td className="p-3 theme-text-muted">{f.tipo || 'PLA'}</td>
                <td className="p-3 theme-text tabular-nums">{f.cantidad_gramos ?? 0} g</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stockFilamentos.filter((f) => f.color_hex || f.color_nombre).length === 0 && (
          <div className="p-6 text-center theme-text-muted text-sm">No hay filamentos con color en stock.</div>
        )}
      </Card>

      {/* Stock de filamentos */}
      <SectionHeader
        title="Stock de filamentos"
        subtitle="Filamentos disponibles (nombre, color, gramos). El color se detecta automáticamente de la foto. Norberto y Daniel comparten este listado; Fidel ve solo el suyo."
        action={
          (user?.role === 'vendedor' || user?.role === 'administrador') && (
            <button
              type="button"
              onClick={() => { setFormFilamentoOpen(true); setFormFilamento({ nombre: '', tipo: 'PLA', color_hex: '', color_nombre: '', cantidad_gramos: 0, foto_url: '' }); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary hover:opacity-95 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar filamento
            </button>
          )
        }
      />
      {formFilamentoOpen && (
        <Card>
          <form onSubmit={submitFilamento} className="p-4 space-y-3">
            <h2 className="text-lg font-medium theme-text">Nuevo filamento (uno por uno)</h2>
            <input
              placeholder="Nombre *"
              value={formFilamento.nombre}
              onChange={(e) => setFormFilamento((f) => ({ ...f, nombre: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-lg border"
            />
            <div className="flex gap-4 flex-wrap">
              <select
                value={formFilamento.tipo}
                onChange={(e) => setFormFilamento((f) => ({ ...f, tipo: e.target.value }))}
                className="theme-input px-3 py-2 rounded-lg border"
              >
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
              </select>
              <input
                placeholder="Color (nombre)"
                value={formFilamento.color_nombre}
                onChange={(e) => setFormFilamento((f) => ({ ...f, color_nombre: e.target.value }))}
                className="theme-input flex-1 min-w-32 px-3 py-2 rounded-lg border"
              />
              {formFilamento.color_hex && (
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded border shrink-0" style={{ backgroundColor: formFilamento.color_hex }} title={formFilamento.color_hex} />
                  <span className="text-sm theme-text-muted">{formFilamento.color_hex}</span>
                </span>
              )}
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Gramos"
                value={formFilamento.cantidad_gramos || ''}
                onChange={(e) => setFormFilamento((f) => ({ ...f, cantidad_gramos: e.target.value }))}
                className="theme-input w-28 px-3 py-2 rounded-lg border"
              />
            </div>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilamentoPhotoChange}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-lg border theme-input">
                Subir foto (detecta color)
              </button>
              {formFilamento.foto_url && (
                <img src={formFilamento.foto_url} alt="Vista previa" className="h-12 w-12 object-cover rounded border" />
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg btn-primary font-medium">Agregar</button>
              <button type="button" onClick={() => setFormFilamentoOpen(false)} className="px-4 py-2 rounded-lg bg-slate-600 text-white">Cancelar</button>
            </div>
          </form>
        </Card>
      )}
      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Color</th>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Tipo</th>
              <th className="p-3 theme-text-muted font-medium">Gramos</th>
              <th className="p-3 theme-text-muted font-medium">Foto</th>
              <th className="p-3 theme-text-muted font-medium w-32"></th>
            </tr>
          </thead>
          <tbody>
            {stockFilamentos.map((f) => (
              <tr key={f.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3">
                  {f.color_hex ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded border shrink-0" style={{ backgroundColor: f.color_hex }} title={f.color_hex} />
                      <span className="theme-text-muted text-xs">{f.color_hex}</span>
                    </span>
                  ) : (
                    <span className="theme-text-muted">—</span>
                  )}
                </td>
                <td className="p-3 theme-text font-medium">{f.nombre}</td>
                <td className="p-3 theme-text-muted">{f.tipo || 'PLA'}</td>
                <td className="p-3 theme-text tabular-nums">{f.cantidad_gramos ?? 0} g</td>
                <td className="p-3">
                  {f.foto_url ? (
                    <img src={f.foto_url} alt="" className="h-10 w-10 object-cover rounded border" />
                  ) : (
                    <span className="theme-text-muted">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {consumirGramos.id === f.id ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={consumirGramos.gramos}
                          onChange={(e) => setConsumirGramos((c) => ({ ...c, gramos: e.target.value }))}
                          className="theme-input w-20 px-2 py-1 rounded text-sm"
                          placeholder="g"
                        />
                        <button type="button" onClick={consumirFilamento} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Ok</button>
                        <button type="button" onClick={() => setConsumirGramos({ id: null, gramos: '' })} className="text-xs theme-text-muted">Cancelar</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConsumirGramos({ id: f.id, gramos: '' })} className="px-2 py-1 rounded bg-amber-600/20 text-amber-400 text-xs">Consumir</button>
                    )}
                    <button type="button" onClick={() => deleteFilamento(f.id)} className="p-1.5 rounded text-red-500 hover:bg-red-500/10" aria-label="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stockFilamentos.length === 0 && (
          <div className="p-8 text-center theme-text-muted">
            No hay filamentos en stock. Agrega uno con «Agregar filamento» (solo vendedores).
          </div>
        )}
      </Card>

      <SectionHeader
        title="Inventario (materiales / materias primas)"
        subtitle={
          isAdmin
            ? 'Ves todo el inventario. Puedes agregar ítems sin asignar vendedor o gestionar los de cualquier vendedor.'
            : 'Solo ves y editas los ítems que tú has subido.'
        }
        action={
          <button
            onClick={() => { setFormOpen(true); setEditingId(null); setForm({ nombre: '', descripcion: '', cantidad: 0, unidad: 'pza' }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary hover:opacity-95 text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar ítem
          </button>
        }
      />
      {(formOpen || editingId) && (
        <Card className="theme-table">
          <form onSubmit={submit} className="p-4 space-y-3">
            <h2 className="text-lg font-medium theme-text">{editingId ? 'Editar ítem' : 'Nuevo ítem'}</h2>
            <input
              placeholder="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-lg border"
            />
            <input
              placeholder="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="theme-input w-full px-3 py-2 rounded-lg border"
            />
            <div className="flex gap-4 flex-wrap">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Cantidad"
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="theme-input w-32 px-3 py-2 rounded-lg border"
              />
              <select
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
                className="theme-input px-3 py-2 rounded-lg border"
              >
                <option value="pza">pza</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="L">L</option>
                <option value="rollo">rollo</option>
                <option value="caja">caja</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg btn-primary font-medium">
                {editingId ? 'Guardar cambios' : 'Agregar'}
              </button>
              <button type="button" onClick={cancelForm} className="px-4 py-2 rounded-lg bg-slate-600 text-white">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card padding={false} className="overflow-hidden theme-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <th className="p-3 theme-text-muted font-medium">Nombre</th>
              <th className="p-3 theme-text-muted font-medium">Descripción</th>
              <th className="p-3 theme-text-muted font-medium">Cantidad</th>
              <th className="p-3 theme-text-muted font-medium">Unidad</th>
              {isAdmin && <th className="p-3 theme-text-muted font-medium">Vendedor ID</th>}
              <th className="p-3 theme-text-muted font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-[var(--theme-table-row-hover)]" style={{ borderColor: 'var(--theme-border)' }}>
                <td className="p-3 theme-text font-medium">{item.nombre}</td>
                <td className="p-3 theme-text-muted">{item.descripcion || '—'}</td>
                <td className="p-3 theme-text tabular-nums">{item.cantidad}</td>
                <td className="p-3 theme-text-muted">{item.unidad || 'pza'}</td>
                {isAdmin && <td className="p-3 theme-text-muted">{item.vendedor_id ?? '—'}</td>}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOne(item.id)}
                      className="p-1.5 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-8 text-center theme-text-muted">
            No hay ítems en el inventario. Agrega el primero con el botón «Agregar ítem».
          </div>
        )}
      </Card>
    </div>
  )
}
