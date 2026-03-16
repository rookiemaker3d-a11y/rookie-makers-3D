import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, MessageCircle, FileText, ExternalLink } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import CotizacionPDF from './CotizacionPDF'
import { Card } from '../ui'

const WHATSAPP_NUM = '524721488913'

export default function PasoPDF({ folio, wizardData, desglose, lineas = [], subTotal = 0, descuento = 0, envio = 0, totalFinal = 0, notas, vendedor, transferencia }) {
  const [downloading, setDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const prevUrlRef = useRef(null)

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logos/logo-cotizacion.png` : ''
  const doc = (
    <CotizacionPDF
      folio={folio}
      cliente={wizardData?.cliente}
      proyecto={wizardData?.proyecto}
      desglose={desglose}
      lineas={lineas}
      subTotal={subTotal}
      descuento={descuento}
      envio={envio}
      totalFinal={totalFinal}
      notas={notas}
      vendedor={vendedor}
      transferencia={transferencia}
      logoUrl={logoUrl}
    />
  )

  useEffect(() => {
    let cancelled = false
    const docForPreview = (
      <CotizacionPDF
        folio={folio}
        cliente={wizardData?.cliente}
        proyecto={wizardData?.proyecto}
        desglose={desglose}
        lineas={lineas}
        subTotal={subTotal}
        descuento={descuento}
        envio={envio}
        totalFinal={totalFinal}
        notas={notas}
        vendedor={vendedor}
        transferencia={transferencia}
        logoUrl={logoUrl}
      />
    )
    pdf(docForPreview).toBlob().then((blob) => {
      if (cancelled) return
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
      const url = URL.createObjectURL(blob)
      prevUrlRef.current = url
      setPreviewUrl(url)
    }).catch(() => setPreviewUrl(null))
    return () => {
      cancelled = true
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
    }
  }, [folio, subTotal, descuento, envio, totalFinal, lineas?.length, wizardData?.cliente?.id, wizardData?.proyecto?.nombre, notas])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cotizacion-${folio}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const totalParaWhatsApp = (Array.isArray(lineas) && lineas.length > 0) ? totalFinal : desglose?.precioCliente
  const whatsappText = encodeURIComponent(
    `Hola, te envío la cotización ${folio} por un total de $${(totalParaWhatsApp ?? 0).toFixed(2)} MXN.${(Array.isArray(lineas) && lineas.length === 0) ? ` Anticipo: $${(desglose?.anticipoMonto ?? 0).toFixed(2)}.` : ''}`
  )
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUM}?text=${whatsappText}`

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Vista previa del PDF */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold theme-text">Vista previa del PDF</h3>
        </div>
        <p className="theme-text-muted text-sm mb-3">Así se verá la cotización al descargarla. Datos del vendedor y cuenta se importan del perfil seleccionado.</p>
        <div className="rounded-lg border overflow-hidden bg-white" style={{ minHeight: 420, borderColor: 'var(--theme-border)' }}>
          {previewUrl ? (
            <iframe src={previewUrl} title="Vista previa cotización" className="w-full h-[420px]" />
          ) : (
            <div className="flex items-center justify-center h-[420px] theme-text-muted text-sm">Generando vista previa...</div>
          )}
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg border theme-text-muted hover:theme-text text-sm"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir vista previa en nueva pestaña
          </button>
        )}
      </Card>

      <Card>
        <div className="border-b border-white/[0.08] pb-3 mb-3">
          <h3 className="text-lg font-semibold theme-text">Generar PDF y enviar</h3>
          <p className="theme-text-dim text-sm mt-0.5">Folio: {folio}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 theme-text font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </a>
        </div>
        <p className="theme-text-dim text-xs mt-3">El PDF incluye datos del cliente, concepto y total. Métodos de pago: Clip, transferencia, efectivo.</p>
      </Card>
    </motion.div>
  )
}
