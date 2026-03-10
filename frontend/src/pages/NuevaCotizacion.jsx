import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCotizador } from '../hooks/useCotizador'
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
  const [paso, setPaso] = useState(1)
  const [wizardData, setWizardData] = useState({
    cliente: null,
    proyecto: {},
  })
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const cotizador = useCotizador()
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

  const handleConfirm = async () => {
    setSaveError('')
    setSaving(true)
    try {
      const d = cotizador.desglose
      const descripcion = `${wizardData.proyecto?.nombre ?? 'Proyecto'} - ${wizardData.cliente?.nombre ?? 'Cliente'}`
      await api('/cotizaciones-en-espera', {
        method: 'POST',
        body: JSON.stringify({
          descripcion,
          cantidad: 1,
          costo_base: d.costoTotal,
          costo_final: d.precioCliente,
          detalles: {
            ...d,
            folio,
            cliente_id: wizardData.cliente?.id,
            proyecto: wizardData.proyecto?.nombre,
            notas,
            estado: 'espera',
          },
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
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"
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
          <PasoCalculadora key="paso3" cotizador={cotizador} />
        )}
        {paso === 4 && (
          <PasoPreview
            key="paso4"
            wizardData={wizardData}
            desglose={cotizador.desglose}
            notas={notas}
            setNotas={setNotas}
          />
        )}
        {paso === 5 && (
          <PasoPDF
            key="paso5"
            folio={folio}
            wizardData={wizardData}
            desglose={cotizador.desglose}
            notas={notas}
          />
        )}
        {paso === 6 && (
          <PasoConfirmacion
            key="paso6"
            folio={folio}
            wizardData={wizardData}
            desglose={cotizador.desglose}
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>
          {paso <= 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={(paso === 1 && !wizardData.cliente) || (paso === 2 && !wizardData.proyecto?.nombre?.trim())}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] text-white font-medium border border-white/[0.08] disabled:opacity-40 disabled:pointer-events-none"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
