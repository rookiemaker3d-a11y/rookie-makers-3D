import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, MessageCircle } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import CotizacionPDF from './CotizacionPDF'
import { Card } from '../ui'

const WHATSAPP_NUM = '524721488913'

export default function PasoPDF({ folio, wizardData, desglose, notas }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const doc = (
        <CotizacionPDF
          folio={folio}
          cliente={wizardData?.cliente}
          proyecto={wizardData?.proyecto}
          desglose={desglose}
          notas={notas}
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

  const whatsappText = encodeURIComponent(
    `Hola, te envío la cotización ${folio} por un total de $${desglose?.precioCliente?.toFixed(2) ?? '0'} MXN. Anticipo: $${desglose?.anticipoMonto?.toFixed(2) ?? '0'}.`
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
          <h3 className="text-lg font-semibold text-white">Generar PDF y enviar</h3>
          <p className="text-slate-500 text-sm mt-0.5">Folio: {folio}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.14] text-white font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-white font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </a>
        </div>
        <p className="text-slate-500 text-xs mt-3">El PDF incluye datos del cliente, concepto y total. Métodos de pago: Clip, transferencia, efectivo.</p>
      </Card>
    </motion.div>
  )
}
