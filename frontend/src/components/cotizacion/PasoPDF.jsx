import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, MessageCircle } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import CotizacionPDF from './CotizacionPDF'
import { Card } from '../ui'

const WHATSAPP_NUM = '524721488913'

export default function PasoPDF({ folio, wizardData, desglose, lineas = [], subTotal = 0, descuento = 0, envio = 0, totalFinal = 0, notas, vendedor, transferencia }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
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
