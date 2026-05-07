import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Droplets, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCotizador, materialesFromAPI } from '../hooks/useCotizador'
import StepperCotizacion from '../components/cotizacion/StepperCotizacion'
import PasoCliente from '../components/cotizacion/PasoCliente'
import PasoProyecto from '../components/cotizacion/PasoProyecto'
import PasoCalculadora from '../components/cotizacion/PasoCalculadora'
import PasoEmpaqueEnvio from '../components/cotizacion/PasoEmpaqueEnvio'
import PasoPreview from '../components/cotizacion/PasoPreview'
import { folio as genFolio } from '../components/cotizacion/PasoPreview'
import PasoPDF from '../components/cotizacion/PasoPDF'
import PasoConfirmacion from '../components/cotizacion/PasoConfirmacion'
import { SectionHeader } from '../components/ui'
import { buildLineasParaPDF, sumLineasFinal } from '../utils/cotizacionPdfLines'

const TOTAL_PASOS = 6

export default function NuevaCotizacion() {
  const { api, apiUpload, user } = useAuth()
  const draftKey = useMemo(() => `cotizacion_draft_v1:${user?.id ?? 'anon'}`, [user?.id])
  const remoteDraftIdKey = useMemo(() => `cotizacion_remote_id_v1:${user?.id ?? 'anon'}`, [user?.id])
  const restoringRef = useRef(false)
  const saveTimerRef = useRef(null)
  const remoteTimerRef = useRef(null)
  const [materiales, setMateriales] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState(null)
  const [paso, setPaso] = useState(1)
  const [wizardData, setWizardData] = useState({
    cliente: null,
    proyecto: {},
    lineas: [],
    descuento: 0,
    envio: 0,
    empaque: 0,
    regalia_markup_pct: 20,
    regalia_vendedor_pct: 20,
  })
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showCostosFilamento, setShowCostosFilamento] = useState(false)
  const [ordenEnviadaMsg, setOrdenEnviadaMsg] = useState('')
  const [draftInfo, setDraftInfo] = useState(null)
  const [remoteDraftId, setRemoteDraftId] = useState(null)
  const [remoteStatus, setRemoteStatus] = useState('') // '', 'guardando', 'ok', 'error'

  const readDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return null
      const obj = JSON.parse(raw)
      if (!obj || typeof obj !== 'object') return null
      return obj
    } catch (_) {
      return null
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey)
      localStorage.removeItem(remoteDraftIdKey)
    } catch (_) {
      // ignore
    }
    setDraftInfo(null)
    setRemoteDraftId(null)
    setRemoteStatus('')
  }

  useEffect(() => {
    api('/materiales-filamento')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMateriales(Array.isArray(data) ? data : []))
      .catch(() => setMateriales([]))
  }, [api])

  const isAdmin = user?.role === 'administrador'

  const folio = useMemo(() => (typeof genFolio === 'function' ? genFolio() : `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`), [])
  const materialesParaCotizador = useMemo(() => materialesFromAPI(Array.isArray(materiales) ? materiales : []), [materiales])
  const cotizadorConfig = useMemo(() => ({ materiales: materialesParaCotizador || undefined }), [materialesParaCotizador])
  const cotizador = useCotizador(cotizadorConfig)

  const vendedorSeleccionado = useMemo(() => {
    if (!isAdmin) return null
    return vendedores.find((v) => v?.id === vendedorSeleccionadoId) || null
  }, [isAdmin, vendedores, vendedorSeleccionadoId])

  const descripcionActual = useMemo(() => {
    return `${wizardData.proyecto?.nombre ?? 'Proyecto'} - ${wizardData.cliente?.nombre ?? 'Cliente'}`
  }, [wizardData.cliente?.nombre, wizardData.proyecto?.nombre])

  const detallesRemoteBase = useMemo(() => {
    const base = {
      folio,
      estado: 'borrador',
      borrador: true,
      cliente_id: wizardData.cliente?.id,
      cliente_nombre: wizardData.cliente?.nombre,
      proyecto: wizardData.proyecto?.nombre,
      categoria_proyecto: wizardData.proyecto?.categoria || undefined,
      es_funko: wizardData.proyecto?.categoria === 'funko' || undefined,
      notas,
    }
    if (isAdmin) {
      return {
        ...base,
        vendedor_id: vendedorSeleccionado?.id ?? undefined,
        vendedor_nombre: vendedorSeleccionado?.nombre ?? undefined,
        vendedor_email: vendedorSeleccionado?.correo ?? undefined,
      }
    }
    return base
  }, [
    folio,
    isAdmin,
    notas,
    vendedorSeleccionado?.correo,
    vendedorSeleccionado?.id,
    vendedorSeleccionado?.nombre,
    wizardData.cliente?.id,
    wizardData.cliente?.nombre,
    wizardData.proyecto?.categoria,
    wizardData.proyecto?.nombre,
  ])

  // Restore borrador al entrar
  useEffect(() => {
    const d = readDraft()
    if (!d) return
    restoringRef.current = true
    try {
      if (d?.wizardData) setWizardData(d.wizardData)
      if (typeof d?.notas === 'string') setNotas(d.notas)
      if (typeof d?.paso === 'number' && d.paso >= 1 && d.paso <= TOTAL_PASOS) setPaso(d.paso)
      if (d?.vendedorSeleccionadoId != null) setVendedorSeleccionadoId(d.vendedorSeleccionadoId)
      setDraftInfo({ savedAt: d?.savedAt || null })
    } finally {
      setTimeout(() => {
        restoringRef.current = false
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Restore remote draft id
  useEffect(() => {
    try {
      const raw = localStorage.getItem(remoteDraftIdKey)
      if (raw && String(raw).trim()) setRemoteDraftId(Number(raw) || null)
    } catch (_) {
      // ignore
    }
  }, [remoteDraftIdKey])
  useEffect(() => {
    if (!isAdmin) return
    api('/vendedores')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setVendedores(arr)
        // default: vendedor con correo igual al user.email, si existe; si no, el primero.
        const match = arr.find((v) => (v?.correo || '').toLowerCase() === (user?.email || '').toLowerCase())
        const id = match?.id ?? arr[0]?.id ?? null
        setVendedorSeleccionadoId((prev) => prev ?? id)
      })
      .catch(() => setVendedores([]))
  }, [api, isAdmin, user?.email])

  // Autosave borrador (debounce)
  useEffect(() => {
    if (!draftKey) return
    if (restoringRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        const payload = {
          savedAt: new Date().toISOString(),
          paso,
          wizardData,
          notas,
          vendedorSeleccionadoId,
        }
        localStorage.setItem(draftKey, JSON.stringify(payload))
        setDraftInfo({ savedAt: payload.savedAt })
      } catch (_) {
        // ignore
      }
    }, 400)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [draftKey, paso, wizardData, notas, vendedorSeleccionadoId])

  const shouldRemoteDraft = !!wizardData?.cliente && !!wizardData?.proyecto?.nombre?.trim()

  // Crear borrador remoto (una vez) cuando ya hay cliente+proyecto
  useEffect(() => {
    if (!shouldRemoteDraft) return
    if (remoteDraftId) return
    if (saving) return
    let cancelled = false
    const run = async () => {
      setRemoteStatus('guardando')
      try {
        const res = await api('/cotizaciones-en-espera', {
          method: 'POST',
          body: JSON.stringify({
            descripcion: descripcionActual,
            cantidad: 1,
            costo_base: 0,
            costo_final: 0,
            detalles: detallesRemoteBase,
          }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(d?.detail || 'No se pudo crear borrador')
        if (cancelled) return
        const id = d?.id
        if (id != null) {
          setRemoteDraftId(id)
          try {
            localStorage.setItem(remoteDraftIdKey, String(id))
          } catch (_) {
            // ignore
          }
          setRemoteStatus('ok')
        }
      } catch (_) {
        if (!cancelled) setRemoteStatus('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [api, descripcionActual, detallesRemoteBase, remoteDraftId, remoteDraftIdKey, saving, shouldRemoteDraft])

  // Actualizar borrador remoto conforme avanzas (debounce)
  useEffect(() => {
    if (!shouldRemoteDraft) return
    if (!remoteDraftId) return
    if (saving) return
    if (restoringRef.current) return
    if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current)
    remoteTimerRef.current = setTimeout(async () => {
      setRemoteStatus('guardando')
      try {
        const payload = {
          detalles: {
            ...detallesRemoteBase,
            paso_actual: paso,
          },
          costo_base: 0,
          costo_final: 0,
        }
        const res = await api(`/cotizaciones-en-espera/${remoteDraftId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) {
          // si ya no existe, recrear
          if (res.status === 404) {
            try {
              localStorage.removeItem(remoteDraftIdKey)
            } catch (_) {
              // ignore
            }
            setRemoteDraftId(null)
          }
          throw new Error(d?.detail || 'No se pudo actualizar borrador')
        }
        setRemoteStatus('ok')
      } catch (_) {
        setRemoteStatus('error')
      }
    }, 900)
    return () => {
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current)
    }
  }, [api, detallesRemoteBase, paso, remoteDraftId, remoteDraftIdKey, saving, shouldRemoteDraft])

  const canGoNext = () => {
    if (paso === 1) return !!wizardData.cliente
    if (paso === 2) return !!(wizardData.proyecto?.nombre?.trim())
    return true
  }

  const handleNext = () => {
    if (paso < TOTAL_PASOS && canGoNext()) setPaso((p) => p + 1)
  }

  const handlePrev = () => {
    if (paso > 1) setPaso((p) => p - 1)
  }

  const isVendedorVentas = user?.role === 'vendedor_ventas'

  const handleEnviarOrdenDesdePaso2 = async () => {
    if (!wizardData.cliente || !wizardData.proyecto?.nombre?.trim()) return
    setSaveError('')
    setOrdenEnviadaMsg('')
    setSaving(true)
    try {
      const res = await api('/cotizaciones-en-espera', {
        method: 'POST',
        body: JSON.stringify({
          descripcion: descripcionActual,
          cantidad: 1,
          costo_base: 0,
          costo_final: 0,
          detalles: {
            orden_vendedor: true,
            estado_cotizacion_vendedor: 'pendiente',
            visto_por_vendedor: false,
            folio: genFolio(),
            cliente_id: wizardData.cliente?.id,
            proyecto: wizardData.proyecto?.nombre,
            cliente_nombre: wizardData.cliente?.nombre,
            ...(isAdmin
              ? {
                  vendedor_id: vendedorSeleccionado?.id ?? undefined,
                  vendedor_nombre: vendedorSeleccionado?.nombre ?? undefined,
                  vendedor_email: vendedorSeleccionado?.correo ?? undefined,
                }
              : {}),
          },
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSaveError(errData?.detail || res.statusText || 'Error al enviar la orden')
        return
      }
      const data = await res.json()
      const file = wizardData.proyecto?.file
      if (file && data?.id != null) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          await apiUpload(`/cotizaciones-en-espera/${data.id}/archivo`, formData)
        } catch (_) {
          // Orden ya creada; fallo en archivo no bloquea
        }
      }
      setOrdenEnviadaMsg('Orden enviada a Norberto. Aparece en su dashboard (Pipeline de pedidos). Verás "Recibido" cuando él la cotice.')
      clearDraft()
    } catch (e) {
      setSaveError(e?.message || 'Error al enviar la orden')
    } finally {
      setSaving(false)
    }
  }
  const lineas = wizardData.lineas || []
  const materialesExtra = Array.isArray(wizardData.materiales_extra) ? wizardData.materiales_extra : []
  const lineasMateriales = materialesExtra.map((m, idx) => ({
    id_producto: `I${String(idx + 1).padStart(3, '0')}`,
    nombre_producto: m.nombre || 'Material',
    descripcion: `${Number(m.cantidad ?? 0)} ${(m.unidad || '').trim()}`.trim() || 'Material',
    costo_unitario: Number(m.costo_unitario ?? 0) || 0,
    cantidad: Number(m.cantidad ?? 0) || 0,
    costo_final: Number(m.costo_total ?? 0) || 0,
    costo_base_unitario: 0,
    costo_base_total: 0,
  }))
  const subTotalLineas = lineas.reduce((s, l) => s + (Number(l.costo_final) || 0), 0)
  const subTotalMateriales = materialesExtra.reduce((s, m) => s + (Number(m.costo_total) || 0), 0)
  const subTotalBase = subTotalLineas + subTotalMateriales
  const regaliaMarkupPct = Number(wizardData.regalia_markup_pct) || 0
  const regaliaVendedorPct = Number(wizardData.regalia_vendedor_pct) || 0
  const regaliaMarkupMonto = Math.round((subTotalBase * (regaliaMarkupPct / 100)) * 100) / 100
  const regaliaVendedorMonto = Math.round((subTotalBase * (regaliaVendedorPct / 100)) * 100) / 100

  const lineasParaCotizacion = [
    ...lineas,
    ...lineasMateriales,
    ...(regaliaMarkupMonto > 0 ? [{
      id_producto: 'R001',
      nombre_producto: 'Regalías',
      descripcion: `Markup ${regaliaMarkupPct}%`,
      costo_unitario: regaliaMarkupMonto,
      cantidad: 1,
      costo_final: regaliaMarkupMonto,
      costo_base_unitario: 0,
      costo_base_total: 0,
    }] : []),
  ]
  const subTotal = subTotalBase + regaliaMarkupMonto
  const subTotalBaseCost = lineas.reduce((s, l) => s + (Number(l.costo_base_total) || 0), 0)
  const descuento = Number(wizardData.descuento) || 0
  const envio = Number(wizardData.envio) || 0
  const empaque = Number(wizardData.empaque) || 0
  const totalFinal = subTotal - descuento + envio + empaque

  const productLinesOnly = useMemo(
    () => lineas.filter((l) => String(l?.id_producto || '').startsWith('P')),
    [lineas],
  )
  const lineasParaPDF = useMemo(
    () => buildLineasParaPDF(productLinesOnly, regaliaMarkupMonto + regaliaVendedorMonto),
    [productLinesOnly, regaliaMarkupMonto, regaliaVendedorMonto],
  )
  const subTotalPDF = useMemo(() => sumLineasFinal(lineasParaPDF), [lineasParaPDF])
  const totalFinalPDF = useMemo(() => {
    if (lineasParaPDF.length > 0) return subTotalPDF - descuento + envio + empaque
    return totalFinal
  }, [lineasParaPDF.length, subTotalPDF, descuento, envio, empaque, totalFinal])

  const handleConfirm = async () => {
    setSaveError('')
    setSaving(true)
    try {
      const d = cotizador?.desglose ?? {}
      const esOrdenVendedor = isVendedorVentas && lineas.length === 0
      const detalles = {
        ...(esOrdenVendedor ? {} : d),
        ...detallesRemoteBase,
        estado: 'espera',
        borrador: undefined,
        borrador_finalizado_at: new Date().toISOString(),
        orden_vendedor: esOrdenVendedor || undefined,
        lineas: lineasParaCotizacion.length ? lineasParaCotizacion : undefined,
        materiales_extra: materialesExtra.length ? materialesExtra : undefined,
        regalia_markup_pct: regaliaMarkupPct || undefined,
        regalia_markup_monto: regaliaMarkupMonto || undefined,
        regalia_vendedor_pct: regaliaVendedorPct || undefined,
        regalia_vendedor_monto: regaliaVendedorMonto || undefined,
        modoProductos: lineas.length ? (wizardData?.modoProductos || 'unico') : undefined,
        kitNombre: lineas.length ? (wizardData?.kitNombre || undefined) : undefined,
        descuento: lineas.length ? descuento : undefined,
        envio,
        empaque: empaque || undefined,
        sub_total: lineasParaCotizacion.length ? subTotal : (esOrdenVendedor ? 0 : undefined),
        total: totalFinal,
      }
      const costoBaseFinal = lineas.length ? subTotalBaseCost : (esOrdenVendedor ? 0 : (d.costoTotal ?? 0))
      let res
      if (remoteDraftId) {
        res = await api(`/cotizaciones-en-espera/${remoteDraftId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            detalles,
            costo_base: costoBaseFinal,
            costo_final: totalFinal,
          }),
        })
      } else {
        res = await api('/cotizaciones-en-espera', {
          method: 'POST',
          body: JSON.stringify({
            descripcion: descripcionActual,
            cantidad: 1,
            costo_base: costoBaseFinal,
            costo_final: totalFinal,
            detalles,
          }),
        })
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSaveError(errData?.detail || res.statusText || 'Error al guardar')
        return false
      }
      const data = await res.json().catch(() => ({}))
      const savedId = data?.id ?? remoteDraftId
      const file = wizardData.proyecto?.file
      if (file && savedId != null) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          await apiUpload(`/cotizaciones-en-espera/${savedId}/archivo`, formData)
        } catch (_) {
          // Orden ya creada; fallo en archivo no bloquea
        }
      }
      clearDraft()
      return true
    } catch (e) {
      const msg = e?.message || (e?.status === 403 ? 'No tienes permiso para crear cotizaciones.' : 'Error al guardar')
      setSaveError(msg)
      return false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 theme-text-muted hover:theme-text text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
        <SectionHeader
          title="Nueva cotización"
          subtitle={`Paso ${paso} de ${TOTAL_PASOS}`}
        />
        {user?.role !== 'vendedor_ventas' && (
          <button
            type="button"
            onClick={() => setShowCostosFilamento(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
          >
            <Droplets className="w-4 h-4" />
            Ver costos de filamentos
          </button>
        )}
      </div>

      {draftInfo?.savedAt ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm theme-text">
                Borrador guardado automáticamente.
              </p>
              <p className="text-xs theme-text-dim mt-0.5">
                Último guardado: {new Date(draftInfo.savedAt).toLocaleString()}
              </p>
              {remoteDraftId ? (
                <p className="text-xs theme-text-dim mt-0.5">
                  Guardado en servidor: #{remoteDraftId}{' '}
                  <span className={remoteStatus === 'error' ? 'text-red-400' : remoteStatus === 'guardando' ? 'text-amber-300' : 'text-emerald-400'}>
                    {remoteStatus === 'error' ? 'error' : remoteStatus === 'guardando' ? 'guardando…' : 'ok'}
                  </span>
                </p>
              ) : shouldRemoteDraft ? (
                <p className="text-xs theme-text-dim mt-0.5">
                  Guardado en servidor:{' '}
                  <span className={remoteStatus === 'error' ? 'text-red-400' : remoteStatus === 'guardando' ? 'text-amber-300' : 'theme-text-dim'}>
                    {remoteStatus === 'error' ? 'error' : remoteStatus === 'guardando' ? 'creando…' : '—'}
                  </span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 theme-text"
              title="Borrar borrador"
            >
              Borrar
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal: tabla de costos de filamentos */}
      {showCostosFilamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowCostosFilamento(false)}>
          <div className="bg-[var(--theme-bg-card)] border rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col" style={{ borderColor: 'var(--theme-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <h3 className="text-lg font-semibold theme-text">Costos de filamentos (para cotización)</h3>
              <button type="button" onClick={() => setShowCostosFilamento(false)} className="p-2 rounded-lg theme-text-muted hover:bg-white/[0.06]" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b theme-text-muted" style={{ borderColor: 'var(--theme-border)' }}>
                    <th className="p-2 font-medium">Material</th>
                    <th className="p-2 font-medium text-right">Costo por kg (MXN)</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((m) => (
                    <tr key={m.id} className="border-b theme-text" style={{ borderColor: 'var(--theme-border)' }}>
                      <td className="p-2">{m.nombre || 'N/A'}</td>
                      <td className="p-2 text-right tabular-nums">${(m.costo_por_kg ?? 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {materiales.length === 0 && <p className="theme-text-muted text-sm py-4">No hay materiales cargados. Configúralos en Inventario.</p>}
            </div>
          </div>
        </div>
      )}

      <StepperCotizacion
        pasoActual={paso}
        onPasoClick={(id) => setPaso(id)}
        isVendedorVentas={isVendedorVentas}
      />

      {saveError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {paso === 1 && (
          <PasoCliente
            key="paso1"
            data={wizardData}
            onChange={(patch) => setWizardData((d) => ({ ...d, ...patch }))}
            onValid={() => {}}
          />
        )}
        {paso === 2 && (
          <PasoProyecto
            key="paso2"
            data={wizardData}
            onChange={(patch) => setWizardData((d) => ({ ...d, ...patch }))}
            isVendedorVentas={isVendedorVentas}
            onEnviarOrden={handleEnviarOrdenDesdePaso2}
            enviando={saving}
            ordenEnviadaMsg={ordenEnviadaMsg}
          />
        )}
        {paso === 3 && isVendedorVentas ? (
          <PasoEmpaqueEnvio
            key="paso3"
            wizardData={wizardData}
            setWizardData={setWizardData}
            onNext={() => setPaso(4)}
            api={api}
          />
        ) : paso === 3 && (
          <PasoCalculadora
            key="paso3"
            cotizador={cotizador}
            wizardData={wizardData}
            setWizardData={setWizardData}
            onNext={() => setPaso(4)}
            api={api}
          />
        )}
        {paso === 4 && (
          <PasoPreview
            key="paso4"
            wizardData={wizardData}
            setWizardData={setWizardData}
            desglose={cotizador?.desglose ?? {}}
            lineas={lineasParaCotizacion}
            subTotal={subTotal}
            descuento={descuento}
            envio={envio}
            empaque={empaque}
            totalFinal={totalFinal}
            notas={notas}
            setNotas={setNotas}
            onMasProductos={isVendedorVentas ? undefined : () => setPaso(3)}
            isVendedorVentas={isVendedorVentas}
            isAdmin={isAdmin}
            vendedores={vendedores}
            vendedorSeleccionadoId={vendedorSeleccionadoId}
            onChangeVendedorSeleccionadoId={setVendedorSeleccionadoId}
          />
        )}
        {paso === 5 && (
          <PasoPDF
            key="paso5"
            folio={folio}
            wizardData={wizardData}
            desglose={isVendedorVentas && !lineas.length ? null : (cotizador?.desglose ?? null)}
            lineas={lineasParaCotizacion}
            lineasPDF={lineasParaPDF.length > 0 ? lineasParaPDF : undefined}
            subTotalPDF={lineasParaPDF.length > 0 ? subTotalPDF : undefined}
            totalFinalPDF={lineasParaPDF.length > 0 ? totalFinalPDF : undefined}
            subTotal={subTotal}
            descuento={descuento}
            envio={envio}
            empaque={empaque}
            totalFinal={totalFinal}
            notas={notas}
            vendedor={
              isAdmin
                ? {
                    codigo: `V${String(vendedorSeleccionado?.id ?? '').padStart(3, '0')}` || 'V001',
                    nombre: vendedorSeleccionado?.nombre || user?.email,
                    email: vendedorSeleccionado?.correo || user?.email,
                    telefono: vendedorSeleccionado?.telefono,
                  }
                : {
                    codigo: user?.vendedor_codigo ?? 'V001',
                    nombre: user?.vendedor_nombre || user?.email,
                    email: user?.vendedor_correo || user?.email,
                    telefono: user?.vendedor_telefono,
                    rfc: user?.vendedor_rfc,
                  }
            }
            transferencia={
              isAdmin
                ? (vendedorSeleccionado
                    ? {
                        banco: vendedorSeleccionado?.banco ?? '',
                        cuenta: vendedorSeleccionado?.cuenta ?? '',
                        clabe: vendedorSeleccionado?.clabe ?? '',
                        beneficiario: vendedorSeleccionado?.nombre ?? '',
                        tarjeta_ultimos4: vendedorSeleccionado?.tarjeta_ultimos4 ?? '',
                      }
                    : {})
                : (user?.vendedor_id
                    ? {
                        banco: user.vendedor_banco ?? '',
                        cuenta: user.vendedor_cuenta ?? '',
                        clabe: user.vendedor_clabe ?? '',
                        beneficiario: user.vendedor_nombre ?? '',
                        tarjeta_ultimos4: user.vendedor_tarjeta_ultimos4 ?? '',
                      }
                    : {})
            }
          />
        )}
        {paso === 6 && (
          <PasoConfirmacion
            key="paso6"
            folio={folio}
            wizardData={wizardData}
            desglose={cotizador.desglose}
            lineas={lineas}
            totalFinal={totalFinal}
            onConfirm={handleConfirm}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {paso < 6 && (
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={paso <= 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] theme-text disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>
          {paso === 1 && (
            <button type="button" onClick={handleNext} disabled={!wizardData.cliente} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08] disabled:opacity-40 disabled:pointer-events-none">
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {paso === 2 && (
            <button type="button" onClick={handleNext} disabled={!wizardData.proyecto?.nombre?.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08] disabled:opacity-40 disabled:pointer-events-none">
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {paso === 3 && !isVendedorVentas && lineas.length === 0 && (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08]">
              Siguiente (un solo total) <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {paso === 4 && (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08]">
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {paso === 5 && (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              Confirmar y registrar <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
