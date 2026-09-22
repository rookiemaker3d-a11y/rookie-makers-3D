import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { useAuth } from '../context/AuthContext'
import { Card, SectionHeader } from '../components/ui'
import CotizacionServicioPDF from '../components/cotizacion/CotizacionServicioPDF'
import {
  CONCEPTOS_SERVICIO,
  calcTotalesServicio,
} from '../config/conceptosServicio'
import {
  Plus,
  Trash2,
  Wrench,
  FileText,
  Printer,
  ChevronRight,
  ChevronLeft,
  Clock,
  HelpCircle,
  CheckCircle,
  Flag,
  FileDown,
  Camera,
  X,
  Eye,
  ExternalLink,
  User,
  Calculator,
  Check,
} from 'lucide-react'

const todayISO = () => new Date().toISOString().split('T')[0]

const ESTADOS = [
  { id: 'cotizando', label: 'Cotizando', color: 'amber', icon: Clock, nextLabel: 'Enviar a espera confirmación' },
  { id: 'espera_confirmacion', label: 'Espera confirmación', color: 'slate', icon: HelpCircle, nextLabel: 'Marcar como pagado' },
  { id: 'pagado', label: 'Pagado', color: 'emerald', icon: CheckCircle, nextLabel: 'Terminar y generar informe' },
  { id: 'terminado', label: 'Terminado / informe', color: 'blue', icon: Flag, nextLabel: null },
]

const colorClasses = {
  amber: 'border-amber-500/30 bg-amber-500/10',
  slate: 'border-slate-500/30 bg-slate-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/10',
  blue: 'border-blue-500/30 bg-blue-500/10',
}

const NEXT = {
  cotizando: 'espera_confirmacion',
  espera_confirmacion: 'pagado',
  pagado: 'terminado',
}

const WIZARD_STEPS = [
  { id: 1, label: 'Cliente', icon: User },
  { id: 2, label: 'Conceptos', icon: Calculator },
  { id: 3, label: 'PDF', icon: FileDown },
]

const emptyMat = () => ({ nombre: '', descripcion: '', cantidad: 1, costo_unitario: 0 })

function normEstado(e) {
  const x = (e || 'cotizando').toLowerCase()
  if (x === 'borrador') return 'cotizando'
  if (x === 'finalizada' || x === 'finalizado') return 'terminado'
  return x
}

function logoUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${import.meta.env.BASE_URL}logos/logo-cotizacion.png`
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 900
        let w = img.width
        let h = img.height
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h)
          w = Math.round(w * r)
          h = Math.round(h * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function emptyForm() {
  return {
    cliente_id: '',
    cliente_nombre: '',
    marca_impresora: 'Creality',
    marca_otra: '',
    modelo_impresora: '',
    descripcion: '',
    trabajo_realizado: '',
    porcentaje_ganancia: 0,
    conceptosIds: [],
    materiales: [],
    fecha: todayISO(),
  }
}

function StepperServicio({ paso, onPaso }) {
  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = paso === step.id
        const isPast = paso > step.id
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onPaso?.(step.id)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-white/[0.1] border border-white/[0.15]'
                  : isPast
                    ? 'text-emerald-400/90 hover:bg-white/[0.05]'
                    : 'theme-text-dim hover:theme-text-muted'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive
                    ? 'bg-cyan-500/30 theme-text'
                    : isPast
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.06] theme-text-muted'
                }`}
              >
                {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </span>
              <span className="text-xs font-medium hidden sm:block">{step.label}</span>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 rounded ${isPast ? 'bg-emerald-500/40' : 'bg-white/[0.08]'}`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function CotizacionesServicio() {
  const { api, user } = useAuth()
  const [items, setItems] = useState([])
  const [clientes, setClientes] = useState([])
  const [marcas, setMarcas] = useState([])
  const [catalogo, setCatalogo] = useState(CONCEPTOS_SERVICIO)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState(1)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailPreviewUrl, setDetailPreviewUrl] = useState(null)
  const [formPreviewUrl, setFormPreviewUrl] = useState(null)
  const [formFotos, setFormFotos] = useState([])
  const fotoInputRef = useRef(null)
  const detailFotoRef = useRef(null)
  const prevFormUrl = useRef(null)
  const prevDetailUrl = useRef(null)

  const [form, setForm] = useState(emptyForm)

  const conceptosSeleccionados = useMemo(() => {
    return (form.conceptosIds || [])
      .map((id) => catalogo.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        id: c.id,
        concepto: c.concepto,
        descripcion: c.descripcion,
        precio: Number(c.precio) || 0,
        cantidad: 1,
        subtotal: Number(c.precio) || 0,
      }))
  }, [form.conceptosIds, catalogo])

  const preview = useMemo(
    () => calcTotalesServicio(conceptosSeleccionados, form.materiales, form.porcentaje_ganancia),
    [conceptosSeleccionados, form.materiales, form.porcentaje_ganancia],
  )

  const vendedorPdf = {
    nombre: user?.vendedor_nombre || user?.nombre || user?.email || '—',
    email: user?.vendedor_correo || user?.email || '',
    telefono: user?.vendedor_telefono || user?.telefono || '',
  }
  const transferencia = {
    banco: user?.vendedor_banco || '',
    cuenta: user?.vendedor_cuenta || '',
    clabe: user?.vendedor_clabe || '',
    beneficiario: user?.vendedor_nombre || user?.nombre || '',
    tarjeta_ultimos4: user?.vendedor_tarjeta_ultimos4 || '',
  }

  function load() {
    setLoading(true)
    Promise.all([
      api('/servicios/cotizaciones').then((r) => (r.ok ? r.json() : [])),
      api('/clientes').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      api('/servicios/marcas-impresora').then((r) => (r.ok ? r.json() : { marcas: [] })),
      api('/servicios/conceptos').then((r) => (r.ok ? r.json() : CONCEPTOS_SERVICIO)).catch(() => CONCEPTOS_SERVICIO),
    ])
      .then(([cots, cls, m, conceptos]) => {
        setItems(cots || [])
        setClientes(cls || [])
        setMarcas(m?.marcas || [])
        if (Array.isArray(conceptos) && conceptos.length) setCatalogo(conceptos)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [api])

  const byEstado = ESTADOS.reduce((acc, e) => {
    acc[e.id] = items.filter((c) => normEstado(c.estado) === e.id)
    return acc
  }, {})

  const buildPdfDoc = (it, tipo) => (
    <CotizacionServicioPDF
      tipo={tipo}
      folio={`SRV-${it.id || 'NUEVA'}`}
      cliente={{ id: it.cliente_id, nombre: it.cliente_nombre }}
      servicio={{
        marca_impresora: it.marca_impresora,
        modelo_impresora: it.modelo_impresora,
        descripcion: it.descripcion,
      }}
      conceptos={it.conceptos || it.items || []}
      materiales={it.materiales || []}
      costoReparacion={it.costo_reparacion}
      costoBase={it.costo_base}
      costoFinal={it.costo_final}
      porcentajeGanancia={it.porcentaje_ganancia}
      notas={it.descripcion}
      trabajoRealizado={it.trabajo_realizado}
      fotos={it.fotos || []}
      vendedor={vendedorPdf}
      transferencia={transferencia}
      fecha={it.fecha}
      logoUrl={logoUrl()}
    />
  )

  const formAsItem = useMemo(() => {
    const marca =
      form.marca_impresora === 'Otra' ? (form.marca_otra || 'Otra').trim() : form.marca_impresora
    const mats = (form.materiales || [])
      .filter((m) => (m.nombre || '').trim())
      .map((m, i) => ({
        id: `M${String(i + 1).padStart(3, '0')}`,
        nombre: m.nombre.trim(),
        descripcion: (m.descripcion || '').trim() || 'Refacción / material',
        cantidad: Number(m.cantidad) || 1,
        costo_unitario: Number(m.costo_unitario) || 0,
        subtotal: (Number(m.cantidad) || 1) * (Number(m.costo_unitario) || 0),
      }))
    return {
      id: 'NUEVA',
      cliente_id: form.cliente_id || null,
      cliente_nombre: form.cliente_nombre,
      marca_impresora: marca,
      modelo_impresora: form.modelo_impresora,
      descripcion: form.descripcion,
      trabajo_realizado: form.trabajo_realizado,
      conceptos: conceptosSeleccionados,
      items: conceptosSeleccionados,
      costo_reparacion: preview.conceptosTotal,
      materiales: mats,
      porcentaje_ganancia: Number(form.porcentaje_ganancia) || 0,
      costo_base: preview.base,
      costo_final: preview.final,
      fecha: form.fecha,
      fotos: formFotos,
    }
  }, [form, preview, formFotos, conceptosSeleccionados])

  useEffect(() => {
    if (!open || paso !== 3) return undefined
    let cancelled = false
    pdf(buildPdfDoc(formAsItem, 'cotizacion'))
      .toBlob()
      .then((blob) => {
        if (cancelled) return
        if (prevFormUrl.current) URL.revokeObjectURL(prevFormUrl.current)
        const url = URL.createObjectURL(blob)
        prevFormUrl.current = url
        setFormPreviewUrl(url)
      })
      .catch(() => setFormPreviewUrl(null))
    return () => {
      cancelled = true
    }
  }, [open, paso, formAsItem])

  useEffect(() => {
    if (!detail) {
      setDetailPreviewUrl(null)
      return undefined
    }
    let cancelled = false
    const tipo = normEstado(detail.estado) === 'terminado' ? 'informe' : 'cotizacion'
    pdf(buildPdfDoc(detail, tipo))
      .toBlob()
      .then((blob) => {
        if (cancelled) return
        if (prevDetailUrl.current) URL.revokeObjectURL(prevDetailUrl.current)
        const url = URL.createObjectURL(blob)
        prevDetailUrl.current = url
        setDetailPreviewUrl(url)
      })
      .catch(() => setDetailPreviewUrl(null))
    return () => {
      cancelled = true
    }
  }, [detail])

  useEffect(() => () => {
    if (prevFormUrl.current) URL.revokeObjectURL(prevFormUrl.current)
    if (prevDetailUrl.current) URL.revokeObjectURL(prevDetailUrl.current)
  }, [])

  const onCliente = (id) => {
    const c = clientes.find((x) => String(x.id) === String(id))
    setForm((f) => ({
      ...f,
      cliente_id: id,
      cliente_nombre: c ? c.nombre : f.cliente_nombre,
    }))
  }

  const toggleConcepto = (id) => {
    setForm((f) => {
      const has = f.conceptosIds.includes(id)
      return {
        ...f,
        conceptosIds: has ? f.conceptosIds.filter((x) => x !== id) : [...f.conceptosIds, id],
      }
    })
  }

  const abrirNueva = () => {
    setForm(emptyForm())
    setFormFotos([])
    setPaso(1)
    setFormPreviewUrl(null)
    setErr('')
    setOpen(true)
  }

  const cerrarNueva = () => {
    setOpen(false)
    setPaso(1)
  }

  const puedeAvanzar = () => {
    if (paso === 1) {
      return !!(form.cliente_nombre || '').trim()
    }
    if (paso === 2) {
      return conceptosSeleccionados.length > 0 || form.materiales.some((m) => (m.nombre || '').trim())
    }
    return true
  }

  const descargarPdf = async (it, tipo = 'cotizacion') => {
    setPdfBusy(`${it.id}-${tipo}`)
    setErr('')
    try {
      const blob = await pdf(buildPdfDoc(it, tipo)).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = tipo === 'informe'
        ? `Informe-Servicio-SRV-${it.id}.pdf`
        : `Cotizacion-Servicio-SRV-${it.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (ex) {
      setErr(ex.message || 'No se pudo generar el PDF')
    } finally {
      setPdfBusy(null)
    }
  }

  const addFormFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setFormFotos((prev) => [...prev, dataUrl].slice(-6))
    } catch (_) {
      setErr('No se pudo leer la imagen')
    }
    e.target.value = ''
  }

  const addDetailFoto = async (e) => {
    if (!detail) return
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await fileToDataUrl(file)
      const fotos = [...(detail.fotos || []), dataUrl].slice(-6)
      setUpdating(detail.id)
      const r = await api(`/servicios/cotizaciones/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotos }),
      })
      if (!r.ok) throw new Error('No se pudieron guardar las fotos')
      const updated = await r.json()
      setDetail(updated)
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setMsg('Foto del arreglo guardada.')
    } catch (ex) {
      setErr(ex.message || 'Error al subir foto')
    } finally {
      setUpdating(null)
      e.target.value = ''
    }
  }

  const removeDetailFoto = async (idx) => {
    if (!detail) return
    const fotos = (detail.fotos || []).filter((_, i) => i !== idx)
    setUpdating(detail.id)
    try {
      const r = await api(`/servicios/cotizaciones/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotos }),
      })
      if (!r.ok) throw new Error('No se pudo quitar la foto')
      const updated = await r.json()
      setDetail(updated)
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch (ex) {
      setErr(ex.message || 'Error')
    } finally {
      setUpdating(null)
    }
  }

  const save = async () => {
    setErr('')
    setMsg('')
    setSaving(true)
    const body = {
      cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
      cliente_nombre: formAsItem.cliente_nombre || null,
      marca_impresora: formAsItem.marca_impresora,
      modelo_impresora: form.modelo_impresora || null,
      descripcion: form.descripcion || null,
      trabajo_realizado: form.trabajo_realizado || null,
      conceptos: conceptosSeleccionados,
      materiales: formAsItem.materiales,
      porcentaje_ganancia: Number(form.porcentaje_ganancia) || 0,
      fecha: form.fecha || todayISO(),
      estado: 'cotizando',
      fotos: formFotos,
    }
    try {
      const r = await api('/servicios/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error((await r.text()) || 'No se pudo guardar')
      const created = await r.json()
      setMsg('Cotización creada. Usa Continuar para avanzar la orden.')
      cerrarNueva()
      setFormFotos([])
      setForm(emptyForm())
      load()
      setDetail(created)
    } catch (ex) {
      setErr(ex.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const setEstado = async (it, estado) => {
    setUpdating(it.id)
    setErr('')
    try {
      if (estado === 'terminado') {
        const r = await api(`/servicios/cotizaciones/${it.id}/finalizar`, { method: 'POST' })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo terminar')
        const merged = { ...it, ...data, estado: 'terminado', fotos: data.fotos || it.fotos || [] }
        setMsg(`Terminado. Venta #${data.venta_id || '—'} en contabilidad. Abre el informe.`)
        load()
        setDetail(merged)
        await descargarPdf(merged, 'informe')
        return
      }
      const r = await api(`/servicios/cotizaciones/${it.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.detail || 'No se pudo avanzar')
      }
      const updated = await r.json()
      setDetail(updated)
      load()
    } catch (ex) {
      setErr(ex.message || 'Error al cambiar estado')
    } finally {
      setUpdating(null)
    }
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta cotización de servicio?')) return
    await api(`/servicios/cotizaciones/${id}`, { method: 'DELETE' })
    if (detail?.id === id) setDetail(null)
    load()
  }

  const nextLabelFor = (estado) => ESTADOS.find((e) => e.id === normEstado(estado))?.nextLabel

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Servicio / reparación"
        subtitle="Elige conceptos (S001–S003), revisa el PDF y avanza la orden como en cotización normal."
        action={
          <button
            type="button"
            onClick={abrirNueva}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nueva cotización servicio
          </button>
        }
      />

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}

      {open && (
        <Card>
          <StepperServicio
            paso={paso}
            onPaso={(id) => {
              if (id < paso || puedeAvanzar() || id === paso) setPaso(id)
            }}
          />

          {paso === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold theme-text">Cliente y equipo</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="theme-text-muted">Cliente (lista)</span>
                  <select
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.cliente_id}
                    onChange={(e) => onCliente(e.target.value)}
                  >
                    <option value="">— Escribir manual / elegir —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="theme-text-muted">Nombre cliente *</span>
                  <input
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.cliente_nombre}
                    onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="theme-text-muted flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5" /> Marca
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.marca_impresora}
                    onChange={(e) => setForm({ ...form, marca_impresora: e.target.value })}
                  >
                    {(marcas.length ? marcas : ['Creality', 'Bambu Lab', 'Anycubic', 'Otra']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                {form.marca_impresora === 'Otra' && (
                  <label className="block text-sm">
                    <span className="theme-text-muted">Marca (texto)</span>
                    <input
                      className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                      value={form.marca_otra}
                      onChange={(e) => setForm({ ...form, marca_otra: e.target.value })}
                    />
                  </label>
                )}
                <label className="block text-sm">
                  <span className="theme-text-muted">Modelo</span>
                  <input
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.modelo_impresora}
                    onChange={(e) => setForm({ ...form, modelo_impresora: e.target.value })}
                    placeholder="Ender 3 V2, X1 Carbon…"
                  />
                </label>
                <label className="block text-sm">
                  <span className="theme-text-muted">Fecha</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="theme-text-muted">Notas / qué reporta el cliente</span>
                <textarea
                  className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text min-h-[72px]"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej. hace ruido al imprimir, falla extrusión…"
                />
              </label>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div>
                <h3 className="text-sm font-semibold theme-text mb-1">Conceptos de servicio</h3>
                <p className="text-xs theme-text-dim mb-3">
                  Selecciona uno o más. Id · Concepto · Descripción · Precio
                </p>
                <div className="space-y-2">
                  {catalogo.map((c) => {
                    const on = form.conceptosIds.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleConcepto(c.id)}
                        className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                          on
                            ? 'border-cyan-400/50 bg-cyan-500/15'
                            : 'border-white/15 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              on ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-white/30'
                            }`}
                          >
                            {on && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <div className="flex-1 min-w-0 grid sm:grid-cols-12 gap-1 sm:gap-2 items-baseline">
                            <span className="sm:col-span-2 font-mono text-sm font-semibold text-cyan-300">{c.id}</span>
                            <span className="sm:col-span-3 text-sm font-medium theme-text">{c.concepto}</span>
                            <span className="sm:col-span-5 text-sm theme-text-muted truncate">{c.descripcion}</span>
                            <span className="sm:col-span-2 text-sm font-semibold theme-text sm:text-right">
                              ${Number(c.precio).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold theme-text">Materiales / refacciones (opcional)</h3>
                    <p className="text-xs theme-text-dim">Piezas extra aparte del catálogo S001–S003</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-cyan-400"
                    onClick={() => setForm({ ...form, materiales: [...form.materiales, emptyMat()] })}
                  >
                    + Material
                  </button>
                </div>
                {form.materiales.length === 0 && (
                  <p className="text-xs theme-text-dim mb-2">Sin materiales. Puedes agregar si usaste refacciones.</p>
                )}
                {form.materiales.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      className="col-span-4 rounded-lg border bg-white/5 border-white/20 px-2 py-1.5 text-sm theme-text"
                      placeholder="Nombre"
                      value={m.nombre}
                      onChange={(e) => {
                        const materiales = [...form.materiales]
                        materiales[i] = { ...m, nombre: e.target.value }
                        setForm({ ...form, materiales })
                      }}
                    />
                    <input
                      className="col-span-3 rounded-lg border bg-white/5 border-white/20 px-2 py-1.5 text-sm theme-text"
                      placeholder="Descripción"
                      value={m.descripcion || ''}
                      onChange={(e) => {
                        const materiales = [...form.materiales]
                        materiales[i] = { ...m, descripcion: e.target.value }
                        setForm({ ...form, materiales })
                      }}
                    />
                    <input
                      type="number"
                      className="col-span-2 rounded-lg border bg-white/5 border-white/20 px-2 py-1.5 text-sm theme-text"
                      value={m.cantidad}
                      onChange={(e) => {
                        const materiales = [...form.materiales]
                        materiales[i] = { ...m, cantidad: e.target.value }
                        setForm({ ...form, materiales })
                      }}
                    />
                    <input
                      type="number"
                      className="col-span-2 rounded-lg border bg-white/5 border-white/20 px-2 py-1.5 text-sm theme-text"
                      value={m.costo_unitario}
                      onChange={(e) => {
                        const materiales = [...form.materiales]
                        materiales[i] = { ...m, costo_unitario: e.target.value }
                        setForm({ ...form, materiales })
                      }}
                    />
                    <button
                      type="button"
                      className="col-span-1 text-red-400 text-xs"
                      onClick={() => setForm({ ...form, materiales: form.materiales.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="theme-text-muted">% ganancia / margen</span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text"
                    value={form.porcentaje_ganancia}
                    onChange={(e) => setForm({ ...form, porcentaje_ganancia: e.target.value })}
                  />
                </label>
                <div className="rounded-xl border border-white/10 p-3 text-sm space-y-1 self-end">
                  <div className="flex justify-between theme-text-muted">
                    <span>Conceptos</span><span>${preview.conceptosTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between theme-text-muted">
                    <span>Materiales</span><span>${preview.matsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between theme-text font-semibold">
                    <span>Total</span><span>${preview.final.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold theme-text">Vista previa PDF</h3>
              </div>
              <div className="rounded-lg border border-white/15 overflow-hidden bg-white" style={{ minHeight: 520 }}>
                {formPreviewUrl ? (
                  <iframe src={formPreviewUrl} title="Preview cotización servicio" className="w-full h-[560px]" />
                ) : (
                  <div className="flex items-center justify-center h-[520px] text-slate-500 text-sm">Generando preview…</div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {formPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(formPreviewUrl, '_blank', 'noopener')}
                    className="text-xs text-cyan-400 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir en pestaña
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" className="text-xs text-cyan-400" onClick={() => fotoInputRef.current?.click()}>
                    <Camera className="w-3.5 h-3.5 inline mr-1" /> Fotos ({formFotos.length})
                  </button>
                  <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={addFormFoto} />
                </div>
              </div>
              {formFotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formFotos.map((src, i) => (
                    <div key={i} className="relative w-14 h-14 rounded overflow-hidden bg-white/5">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-black/60 p-0.5"
                        onClick={() => setFormFotos((p) => p.filter((_, j) => j !== i))}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => (paso === 1 ? cerrarNueva() : setPaso((p) => p - 1))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-white/20 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {paso === 1 ? 'Cancelar' : 'Atrás'}
            </button>
            {paso < 3 ? (
              <button
                type="button"
                disabled={!puedeAvanzar()}
                onClick={() => setPaso((p) => p + 1)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium disabled:opacity-40"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || !puedeAvanzar()}
                onClick={save}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium disabled:opacity-40"
              >
                {saving ? 'Guardando…' : 'Guardar cotización'}
              </button>
            )}
          </div>
        </Card>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="theme-text font-semibold text-lg">
                  SRV-{detail.id} · {detail.cliente_nombre || 'Sin cliente'}
                </h3>
                <p className="text-xs theme-text-dim">
                  {[detail.marca_impresora, detail.modelo_impresora].filter(Boolean).join(' · ') || 'Equipo'}
                  {' · '}
                  Estado: <span className="text-cyan-300">{normEstado(detail.estado)}</span>
                </p>
                {(detail.conceptos || detail.items || []).length > 0 && (
                  <p className="text-xs theme-text-muted mt-1">
                    {(detail.conceptos || detail.items).map((c) => c.id).join(' · ')}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setDetail(null)} className="theme-text-muted hover:theme-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm theme-text font-medium">
                    {normEstado(detail.estado) === 'terminado' ? 'Reporte / informe' : 'Preview cotización'}
                  </span>
                </div>
                <div className="rounded-lg border border-white/15 overflow-hidden bg-white min-h-[420px]">
                  {detailPreviewUrl ? (
                    <iframe src={detailPreviewUrl} title="Preview PDF servicio" className="w-full h-[460px]" />
                  ) : (
                    <div className="flex items-center justify-center h-[420px] text-slate-500 text-sm">Generando…</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    disabled={!!pdfBusy}
                    onClick={() => descargarPdf(detail, normEstado(detail.estado) === 'terminado' ? 'informe' : 'cotizacion')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Descargar PDF
                  </button>
                  {detailPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(detailPreviewUrl, '_blank', 'noopener')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs theme-text-muted"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Pantalla completa
                    </button>
                  )}
                  {detail.venta_id && (
                    <Link to="/contabilidad" className="text-xs text-cyan-400 self-center">Ver en contabilidad</Link>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {NEXT[normEstado(detail.estado)] && (
                  <button
                    type="button"
                    disabled={updating === detail.id}
                    onClick={() => setEstado(detail, NEXT[normEstado(detail.estado)])}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
                  >
                    Continuar: {nextLabelFor(detail.estado)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm theme-text font-medium flex items-center gap-1">
                      <Camera className="w-4 h-4" /> Fotos del arreglo
                    </span>
                    <button type="button" className="text-xs text-cyan-400" onClick={() => detailFotoRef.current?.click()}>
                      + Subir foto
                    </button>
                    <input ref={detailFotoRef} type="file" accept="image/*" className="hidden" onChange={addDetailFoto} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(detail.fotos || []).map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-black/60 p-0.5"
                          onClick={() => removeDetailFoto(i)}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {!(detail.fotos || []).length && (
                      <p className="text-xs theme-text-dim">Sube fotos; salen en el informe PDF.</p>
                    )}
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="theme-text-muted">Notas / trabajo realizado</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border bg-white/5 border-white/20 px-3 py-2 theme-text min-h-[80px] text-sm"
                    value={detail.trabajo_realizado || ''}
                    onChange={(e) => setDetail({ ...detail, trabajo_realizado: e.target.value })}
                    onBlur={async () => {
                      await api(`/servicios/cotizaciones/${detail.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ trabajo_realizado: detail.trabajo_realizado || '' }),
                      })
                    }}
                  />
                </label>

                <p className="text-xs theme-text-dim">
                  Total ${Number(detail.costo_final || 0).toFixed(2)} · Base ${Number(detail.costo_base || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="theme-text-muted text-sm">Cargando…</p>
      ) : (
        <div className="grid lg:grid-cols-4 gap-3">
          {ESTADOS.map((col) => {
            const Icon = col.icon
            const list = byEstado[col.id] || []
            return (
              <div key={col.id} className={`rounded-xl border p-3 ${colorClasses[col.color]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 theme-text" />
                  <h3 className="text-sm font-semibold theme-text">{col.label}</h3>
                  <span className="text-xs theme-text-dim ml-auto">{list.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {!list.length && <p className="text-xs theme-text-dim">Vacío</p>}
                  {list.map((it) => {
                    const next = NEXT[normEstado(it.estado)]
                    const conceptosLabel = (it.conceptos || it.items || [])
                      .map((c) => c.id)
                      .filter(Boolean)
                      .join(', ')
                    return (
                      <div key={it.id} className="rounded-lg bg-black/25 border border-white/10 p-2.5 text-sm">
                        <button type="button" className="w-full text-left" onClick={() => setDetail(it)}>
                          <div className="font-medium theme-text truncate">#{it.id} {it.cliente_nombre || 'Sin cliente'}</div>
                          <div className="text-xs theme-text-dim flex items-center gap-1 mt-0.5">
                            <Wrench className="w-3 h-3" />
                            {[it.marca_impresora, it.modelo_impresora].filter(Boolean).join(' · ') || '—'}
                          </div>
                          {conceptosLabel && (
                            <div className="text-[11px] text-cyan-400/90 mt-0.5 font-mono">{conceptosLabel}</div>
                          )}
                          <div className="text-xs theme-text-muted truncate mt-0.5">{it.descripcion}</div>
                          <div className="mt-1 flex justify-between text-xs">
                            <span className="theme-text-dim">
                              {(it.fotos || []).length ? `${it.fotos.length} foto(s)` : 'Sin fotos'}
                            </span>
                            <span className="theme-text font-medium">${Number(it.costo_final || 0).toFixed(0)}</span>
                          </div>
                        </button>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {next && (
                            <button
                              type="button"
                              disabled={updating === it.id}
                              onClick={() => setEstado(it, next)}
                              className="w-full py-1.5 rounded-lg bg-cyan-500/90 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1"
                            >
                              Continuar <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetail(it)}
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400"
                            >
                              <Eye className="w-3 h-3" /> Preview
                            </button>
                            <button
                              type="button"
                              disabled={pdfBusy === `${it.id}-cotizacion`}
                              onClick={() => descargarPdf(it, 'cotizacion')}
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400"
                            >
                              <FileDown className="w-3 h-3" /> PDF
                            </button>
                            {normEstado(it.estado) === 'terminado' && (
                              <button
                                type="button"
                                onClick={() => descargarPdf(it, 'informe')}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400"
                              >
                                Informe
                              </button>
                            )}
                            {normEstado(it.estado) !== 'terminado' && (
                              <button type="button" onClick={() => remove(it.id)} className="text-[11px] text-red-400 ml-auto">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
