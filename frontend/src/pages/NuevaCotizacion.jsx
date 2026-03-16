import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCotizador, materialesFromAPI } from '../hooks/useCotizador'
import StepperCotizacion from '../components/cotizacion/StepperCotizacion'
import PasoCliente from '../components/cotizacion/PasoCliente'
import PasoProyecto from '../components/cotizacion/PasoProyecto'
import PasoCalculadora from '../components/cotizacion/PasoCalculadora'
import PasoPreview from '../components/cotizacion/PasoPreview'
import { folio as genFolio } from '../components/cotizacion/PasoPreview'
import PasoPDF from '../components/cotizacion/PasoPDF'
import PasoConfirmacion from '../components/cotizacion/PasoConfirmacion'
import { SectionHeader } from '../components/ui'

const TOTAL_PASOS = 6

export default function NuevaCotizacion() {
  const { api, user } = useAuth()
  const [materiales, setMateriales] = useState([])
  const [paso, setPaso] = useState(1)
  const [wizardData, setWizardData] = useState({
    cliente: null,
    proyecto: {},
    lineas: [],
    descuento: 0,
    envio: 0,
  })
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    api('/materiales-filamento')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMateriales(Array.isArray(data) ? data : []))
      .catch(() => setMateriales([]))
  }, [api])

  const materialesParaCotizador = useMemo(() => materialesFromAPI(materiales), [materiales])
  const cotizador = useCotizador({ materiales: materialesParaCotizador ?? undefined })
  const folio = useMemo(() => genFolio(), [])

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

  const lineas = wizardData.lineas || []
  const subTotal = lineas.reduce((s, l) => s + (Number(l.costo_final) || 0), 0)
  const descuento = Number(wizardData.descuento) || 0
  const envio = Number(wizardData.envio) || 0
  const totalFinal = subTotal - descuento + envio

  const handleConfirm = async () => {
    setSaveError('')
    setSaving(true)
    try {
      const d = cotizador.desglose
      const descripcion = `${wizardData.proyecto?.nombre ?? 'Proyecto'} - ${wizardData.cliente?.nombre ?? 'Cliente'}`
      const detalles = {
        ...d,
        folio,
        cliente_id: wizardData.cliente?.id,
        proyecto: wizardData.proyecto?.nombre,
        notas,
        estado: 'espera',
        lineas: lineas.length ? lineas : undefined,
        descuento: lineas.length ? descuento : undefined,
        envio: lineas.length ? envio : undefined,
        sub_total: lineas.length ? subTotal : undefined,
        total: lineas.length ? totalFinal : undefined,
      }
      await api('/cotizaciones-en-espera', {
        method: 'POST',
        body: JSON.stringify({
          descripcion,
          cantidad: 1,
          costo_base: lineas.length ? subTotal : d.costoTotal,
          costo_final: lineas.length ? totalFinal : d.precioCliente,
          detalles,
        }),
      })
      return true
    } catch (e) {
      const msg = e?.message || (e?.status === 403 ? 'Solo vendedores pueden crear cotizaciones. Inicia sesión como vendedor.' : 'Error al guardar')
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
      </div>

      <StepperCotizacion
        pasoActual={paso}
        onPasoClick={(id) => setPaso(id)}
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
          />
        )}
        {paso === 3 && (
          <PasoCalculadora
            key="paso3"
            cotizador={cotizador}
            wizardData={wizardData}
            setWizardData={setWizardData}
            onNext={() => setPaso(4)}
          />
        )}
        {paso === 4 && (
          <PasoPreview
            key="paso4"
            wizardData={wizardData}
            setWizardData={setWizardData}
            desglose={cotizador.desglose}
            lineas={lineas}
            subTotal={subTotal}
            descuento={descuento}
            envio={envio}
            totalFinal={totalFinal}
            notas={notas}
            setNotas={setNotas}
            onMasProductos={() => setPaso(3)}
          />
        )}
        {paso === 5 && (
          <PasoPDF
            key="paso5"
            folio={folio}
            wizardData={wizardData}
            desglose={cotizador.desglose}
            lineas={lineas}
            subTotal={subTotal}
            descuento={descuento}
            envio={envio}
            totalFinal={totalFinal}
            notas={notas}
            vendedor={{
              codigo: user?.vendedor_codigo ?? 'V001',
              nombre: user?.vendedor_nombre || user?.email || '—',
              email: user?.email || '—',
              telefono: user?.vendedor_telefono || '—',
            }}
            transferencia={user?.vendedor_banco ? { banco: user.vendedor_banco, cuenta: user.vendedor_cuenta, clabe: user.vendedor_clabe, beneficiario: user.vendedor_nombre } : {}}
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
          {paso === 3 && lineas.length === 0 && (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08]">
              Siguiente (un solo total) <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {paso === 4 && (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium border border-white/[0.08]">
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
