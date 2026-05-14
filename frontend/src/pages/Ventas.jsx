import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import { Plus, Trash2, Pencil, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts'

const todayISO = () => new Date().toISOString().split('T')[0]
const firstDayOfMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Ventas() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [resumenMes, setResumenMes] = useState([])
  const [resumenVendedor, setResumenVendedor] = useState([])
  const [desde, setDesde] = useState(firstDayOfMonth())
  const [hasta, setHasta] = useState(todayISO())

  const isAdmin = user?.role === 'administrador'

  const [form, setForm] = useState({
    cliente_nombre: '',
    fecha: todayISO(),
    notas: '',
    productos: [{ descripcion: '', cantidad: 1, costo_unitario: 0, precio_unitario: 0, subtotal: 0 }],
  })

  function load() {
    setLoading(true)
    const qs = new URLSearchParams()
    if (desde) qs.append('desde', desde)
    if (hasta) qs.append('hasta', hasta)
    api(`/ventas?${qs.toString()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setItems(data || [])
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  function loadResumen() {
    const qs = new URLSearchParams()
    if (desde) qs.append('desde', desde)
    if (hasta) qs.append('hasta', hasta)
    api(`/ventas/resumen/mes?${qs.toString()}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setResumenMes)
      .catch(() => setResumenMes([]))
    if (isAdmin) {
      api(`/ventas/resumen/vendedor?${qs.toString()}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setResumenVendedor)
        .catch(() => setResumenVendedor([]))
    }
  }

  useEffect(() => {
    load()
    loadResumen()
  }, [api, desde, hasta])

  const totales = useMemo(() => {
    const total = items.reduce((s, v) => s + (Number(v.total) || 0), 0)
    const ganancia = items.reduce((s, v) => s + (Number(v.ganancia_neta) || 0), 0)
    return { total, ganancia, count: items.length }
  }, [items])

  const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }))

  const updateProducto = (idx, patch) => {
    setForm((f) => {
      const productos = [...f.productos]
      productos[idx] = { ...productos[idx], ...patch }
      // recalc subtotal
      const cant = Number(productos[idx].cantidad) || 0
      const precio = Number(productos[idx].precio_unitario) || 0
      productos[idx].subtotal = Math.round(cant * precio * 100) / 100
      return { ...f, productos }
    })
  }

  const addProducto = () => {
    setForm((f) => ({
      ...f,
      productos: [...f.productos, { descripcion: '', cantidad: 1, costo_unitario: 0, precio_unitario: 0, subtotal: 0 }],
    }))
  }

  const removeProducto = (idx) => {
    setForm((f) => ({
      ...f,
      productos: f.productos.filter((_, i) => i !== idx),
    }))
  }

  const totalForm = useMemo(() => {
    return form.productos.reduce((s, p) => s + (Number(p.subtotal) || 0), 0)
  }, [form.productos])

  const costoTotalForm = useMemo(() => {
    return form.productos.reduce((s, p) => s + ((Number(p.costo_unitario) || 0) * (Number(p.cantidad) || 0)), 0)
  }, [form.productos])

  const save = async (e) => {
    e.preventDefault()
    setMsg('')
    const productos = form.productos
      .filter((p) => (p.descripcion || '').trim())
      .map((p) => ({
        descripcion: p.descripcion.trim(),
        cantidad: Number(p.cantidad) || 1,
        costo_unitario: Number(p.costo_unitario) || 0,
        precio_unitario: Number(p.precio_unitario) || 0,
        subtotal: Number(p.subtotal) || 0,
      }))
    if (!productos.length) {
      setMsg('Agrega al menos un producto.')
      return
    }
    const payload = {
      cliente_nombre: form.cliente_nombre?.trim() || undefined,
      fecha: form.fecha || todayISO(),
      notas: form.notas?.trim() || undefined,
      productos,
      total: totalForm,
      ganancia_neta: Math.round((totalForm - costoTotalForm) * 100) / 100,
    }
    try {
      if (editItem) {
        const res = await api(`/ventas/${editItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Error al actualizar')
      } else {
        const res = await api('/ventas', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Error al guardar')
      }
      setOpenForm(false)
      setEditItem(null)
      setForm({
        cliente_nombre: '',
        fecha: todayISO(),
        notas: '',
        productos: [{ descripcion: '', cantidad: 1, costo_unitario: 0, precio_unitario: 0, subtotal: 0 }],
      })
      load()
      loadResumen()
    } catch (err) {
      setMsg(err.message || 'Error al guardar venta')
    }
  }

  const openEdit = (v) => {
    setEditItem(v)
    setForm({
      cliente_nombre: v.cliente_nombre || '',
      fecha: v.fecha || todayISO(),
      notas: v.notas || '',
      productos: Array.isArray(v.productos) && v.productos.length
        ? v.productos
        : [{ descripcion: '', cantidad: 1, costo_unitario: 0, precio_unitario: 0, subtotal: 0 }],
    })
    setOpenForm(true)
  }

  const deleteOne = async (id) => {
    if (!confirm('¿Eliminar esta venta?')) return
    try {
      await api(`/ventas/${id}`, { method: 'DELETE' })
      load()
      loadResumen()
    } catch (_) {}
  }

  const chartData = useMemo(() => {
    // Fill missing months in range
    if (!resumenMes.length) return []
    const sorted = [...resumenMes].sort((a, b) => a.mes.localeCompare(b.mes))
    return sorted.map((r) => ({
      mes: r.mes,
      ventas: Number(r.total_ventas || 0),
      ganancia: Number(r.total_ganancia || 0),
    }))
  }, [resumenMes])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionHeader title="Ventas" subtitle="Registro de órdenes de venta y dashboard de ingresos.">
        <button
          onClick={() => { setEditItem(null); setForm({ cliente_nombre: '', fecha: todayISO(), notas: '', productos: [{ descripcion: '', cantidad: 1, costo_unitario: 0, precio_unitario: 0, subtotal: 0 }] }); setOpenForm(true); setMsg('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f8ef7] text-white text-sm font-medium hover:bg-[#3a7ae0] transition-colors"
        >
          <Plus size={16} /> Nueva venta
        </button>
      </SectionHeader>

      {/* Filtros y KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#4f8ef7]/10 text-[#4f8ef7]"><DollarSign size={20} /></div>
          <div>
            <p className="text-xs theme-text-muted">Total ventas</p>
            <p className="text-lg font-semibold theme-text">${totales.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e]"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs theme-text-muted">Ganancia neta</p>
            <p className="text-lg font-semibold theme-text">${totales.ganancia.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]"><Package size={20} /></div>
          <div>
            <p className="text-xs theme-text-muted">Ventas registradas</p>
            <p className="text-lg font-semibold theme-text">{totales.count}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.08] theme-text-secondary"><Calendar size={20} /></div>
          <div className="flex-1">
            <p className="text-xs theme-text-muted mb-1.5">Periodo</p>
            <div className="flex gap-2">
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="theme-input text-sm px-2 py-1 rounded-lg w-full" />
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="theme-input text-sm px-2 py-1 rounded-lg w-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      {(chartData.length > 0 || resumenVendedor.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {chartData.length > 0 && (
            <Card title="Ventas por mes">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                    <XAxis dataKey="mes" stroke="var(--theme-text-dim)" fontSize={11} />
                    <YAxis stroke="var(--theme-text-dim)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} formatter={(v) => [`$${Number(v).toFixed(0)}`]} />
                    <Legend />
                    <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#4f8ef7" strokeWidth={2} dot={{ fill: '#4f8ef7' }} />
                    <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          {isAdmin && resumenVendedor.length > 0 && (
            <Card title="Ventas por vendedor">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...resumenVendedor].sort((a, b) => b.total_ventas - a.total_ventas)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                    <XAxis type="number" stroke="var(--theme-text-dim)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis dataKey="vendedor" type="category" stroke="var(--theme-text-dim)" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} formatter={(v) => [`$${Number(v).toFixed(0)}`]} />
                    <Legend />
                    <Bar dataKey="total_ventas" name="Ventas" fill="#4f8ef7" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total_ganancia" name="Ganancia" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tabla */}
      <Card title="Historial de ventas">
        {loading ? (
          <p className="theme-text-muted text-sm">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="theme-text-muted text-sm">No hay ventas registradas en este periodo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-3 font-medium theme-text-muted">Fecha</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-muted">Cliente</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-muted">Productos</th>
                  <th className="text-right py-2 px-3 font-medium theme-text-muted">Total</th>
                  <th className="text-right py-2 px-3 font-medium theme-text-muted">Ganancia</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-muted">Vendedor</th>
                  <th className="text-right py-2 px-3 font-medium theme-text-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2 px-3 theme-text">{v.fecha}</td>
                    <td className="py-2 px-3 theme-text">{v.cliente_nombre || '—'}</td>
                    <td className="py-2 px-3 theme-text">
                      <span className="text-xs theme-text-muted">
                        {Array.isArray(v.productos) ? v.productos.length : 0} producto(s)
                      </span>
                    </td>
                    <td className="py-2 px-3 theme-text text-right tabular-nums">${Number(v.total || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>
                      ${Number(v.ganancia_neta || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 theme-text text-xs">{v.vendedor}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-white/[0.08] theme-text-muted hover:theme-text"><Pencil size={14} /></button>
                      <button onClick={() => deleteOne(v.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpenForm(false) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#111827] border border-white/[0.08] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold theme-text mb-4">{editItem ? 'Editar venta' : 'Nueva venta'}</h3>
            {msg && <p className="text-sm text-red-400 mb-3">{msg}</p>}
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Cliente</label>
                  <input value={form.cliente_nombre} onChange={(e) => updateForm({ cliente_nombre: e.target.value })} placeholder="Nombre del cliente" className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs theme-text-muted mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => updateForm({ fecha: e.target.value })} className="theme-input w-full px-3 py-2 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs theme-text-muted mb-1">Productos</label>
                <div className="space-y-2">
                  {form.productos.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <input value={p.descripcion} onChange={(e) => updateProducto(idx, { descripcion: e.target.value })} placeholder="Descripción" className="theme-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={0} step={1} value={p.cantidad || ''} onChange={(e) => updateProducto(idx, { cantidad: Number(e.target.value) })} placeholder="Cant" className="theme-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={0} step={0.01} value={p.costo_unitario || ''} onChange={(e) => updateProducto(idx, { costo_unitario: Number(e.target.value) })} placeholder="Costo" className="theme-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={0} step={0.01} value={p.precio_unitario || ''} onChange={(e) => updateProducto(idx, { precio_unitario: Number(e.target.value) })} placeholder="Precio" className="theme-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div className="col-span-1">
                        <p className="text-sm theme-text text-right tabular-nums">${Number(p.subtotal || 0).toFixed(0)}</p>
                      </div>
                      <div className="col-span-1">
                        <button type="button" onClick={() => removeProducto(idx)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addProducto} className="mt-2 flex items-center gap-1.5 text-sm text-[#4f8ef7] hover:underline">
                  <Plus size={14} /> Agregar producto
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <div className="space-y-0.5">
                  <p className="text-xs theme-text-muted">Total venta: <span className="theme-text font-medium">${totalForm.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span></p>
                  <p className="text-xs theme-text-muted">Ganancia estimada: <span className="font-medium" style={{ color: 'var(--accent-2)' }}>${(totalForm - costoTotalForm).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs theme-text-muted mb-1">Notas</label>
                <textarea value={form.notas} onChange={(e) => updateForm({ notas: e.target.value })} placeholder="Opcional" rows={2} className="theme-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#4f8ef7] text-white text-sm font-medium hover:bg-[#3a7ae0]">
                  {editItem ? 'Guardar cambios' : 'Registrar venta'}
                </button>
                <button type="button" onClick={() => setOpenForm(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
