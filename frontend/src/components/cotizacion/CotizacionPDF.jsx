import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
  },
  // Encabezado: logo + título y meta
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoWrap: { alignItems: 'flex-start' },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#111',
    borderRadius: 6,
    marginBottom: 6,
  },
  brandName: { fontWeight: 'bold', fontSize: 15, lineHeight: 1.2, color: '#111' },
  tagline: { fontSize: 8, letterSpacing: 1.5, color: '#666', marginTop: 2 },
  metaRight: { textAlign: 'right' },
  docTitle: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  metaTable: { fontSize: 11, lineHeight: 2 },
  metaB: { fontWeight: 'bold' },
  validityNote: { fontSize: 8, color: '#888', marginTop: 6 },
  divider: { borderTopWidth: 2, borderTopColor: '#111', marginVertical: 12 },
  // Dos columnas: vendedor y cliente
  parties: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  partyCol: { flex: 1 },
  sectionHead: {
    fontSize: 10,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 3,
    marginBottom: 7,
  },
  infoBlock: { fontSize: 10, lineHeight: 1.85, color: '#222' },
  infoB: { fontWeight: 'bold' },
  // Banco
  bankWrap: { marginBottom: 14, borderWidth: 1.5, borderColor: '#111' },
  blackBar: {
    backgroundColor: '#111',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    padding: 4,
  },
  bankRow: { flexDirection: 'row', fontSize: 10, paddingHorizontal: 5, paddingVertical: 2 },
  bankLabel: { width: 90, fontWeight: 'bold', color: '#222' },
  bankValue: { flex: 1, color: '#222' },
  // Notas + total (sin desglose de costos en la cotización)
  bottom: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  notesArea: { flex: 1, borderWidth: 1.5, borderColor: '#111' },
  notesText: { fontSize: 10, color: '#333', lineHeight: 1.7, minHeight: 40, padding: 6 },
  totals: { width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 },
  totalLbl: { color: '#666' },
  totalVal: { fontWeight: 'bold', textAlign: 'right' },
  totalFinal: { borderTopWidth: 2, borderTopColor: '#111', paddingTop: 4, marginTop: 2 },
  totalFinalLbl: { fontWeight: 'bold', color: '#111' },
  totalFinalVal: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  // Términos
  termsArea: { borderWidth: 1.5, borderColor: '#111', marginTop: 14 },
  termsText: { fontSize: 9, lineHeight: 1.9, color: '#333', padding: 6 },
})

const TERMINOS_DEFAULT = `SE REQUIERE PAGO MÍNIMO DE 50% ANTES DEL INICIO DEL SERVICIO.
ROOKIE MAKER 3D NO CUBRE GASTOS DE ENTREGA A NO SER QUE SE ESPECIFIQUE.
LOS TIEMPOS DE ENTREGA QUEDAN DE 3 A 5 DIAS HABILES. (ZONA LOCAL)
COTIZACION VALIDA POR 7 DIAS NATURALES A PARTIR DE LA RECEPCION
CUALQUIER DUDA O ACLARACIÓN COMUNICARSE AL TELÉFONO DE CONTACTO DE SU VENDEDOR`

function formatDate(d) {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

export default function CotizacionPDF({
  folio,
  cliente,
  proyecto,
  desglose,
  notas,
  vendedor = {},
  transferencia = {},
  diasValidez = 7,
  terminos = TERMINOS_DEFAULT,
}) {
  const d = desglose || {}
  const hoy = new Date()
  const expira = new Date(hoy)
  expira.setDate(expira.getDate() + (diasValidez || 7))

  const material = Number(d.material) || 0
  const tiempoMaquina = Number(d.tiempoMaquina) || 0
  const disenoArchivo = Number(d.disenoArchivo) || 0
  const extras = Number(d.extras) || 0
  const subtotal = material + tiempoMaquina + disenoArchivo + extras
  const descuento = 0
  const envio = 0
  const total = Number(d.precioCliente) || subtotal - descuento + envio

  const v = vendedor
  const t = transferencia

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* TOP: logo + COTIZACIÓN y meta */}
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <View style={styles.logoBox} />
            <Text style={styles.brandName}>ROOKIE{'\n'}MAKERS 3D</Text>
            <Text style={styles.tagline}>PRINT YOUR DREAMS</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.docTitle}>COTIZACIÓN</Text>
            <View style={styles.metaTable}>
              <Text><Text style={styles.metaB}>FECHA:</Text> {formatDate(hoy)}</Text>
              <Text><Text style={styles.metaB}>FECHA DE EXPIRACIÓN:</Text> {formatDate(expira)}</Text>
              <Text><Text style={styles.metaB}>NO. COTIZACIÓN:</Text> {folio || '—'}</Text>
            </View>
            <Text style={styles.validityNote}>
              Cotización válida por {diasValidez} días naturales a partir de la recepción
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* PARTES: vendedor y cliente */}
        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.sectionHead}>DATOS DEL VENDEDOR:</Text>
            <View style={styles.infoBlock}>
              <Text><Text style={styles.infoB}>{v.codigo || '—'}</Text>{v.id ? ` · ${v.id}` : ''}</Text>
              <Text><Text style={styles.infoB}>{v.nombre || '—'}</Text></Text>
              <Text>{v.email || '—'}</Text>
              <Text>{v.telefono || '—'}</Text>
              <Text>{v.rfc || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.sectionHead}>DATOS DEL CLIENTE:</Text>
            <View style={styles.infoBlock}>
              {cliente?.id && <Text><Text style={styles.infoB}>{cliente.id}</Text></Text>}
              <Text><Text style={styles.infoB}>{cliente?.nombre || '—'}</Text></Text>
              <Text>{cliente?.correo || '—'}</Text>
              <Text>{cliente?.telefono || '—'}</Text>
            </View>
          </View>
        </View>

        {/* DATOS DE TRANSFERENCIA */}
        <View style={styles.bankWrap}>
          <Text style={styles.blackBar}>DATOS DE TRANSFERENCIA</Text>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>BANCO:</Text><Text style={styles.bankValue}>{t.banco || '—'}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>CUENTA:</Text><Text style={styles.bankValue}>{t.cuenta || '—'}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>CLABE:</Text><Text style={styles.bankValue}>{t.clabe || '—'}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>BENEFICIARIO:</Text><Text style={styles.bankValue}>{t.beneficiario || '—'}</Text></View>
        </View>

        {/* NOTAS + TOTAL (sin desglose de costos) */}
        <View style={styles.bottom}>
          <View style={styles.notesArea}>
            <Text style={styles.blackBar}>NOTAS ADICIONALES:</Text>
            <Text style={styles.notesText}>{notas || ''}</Text>
          </View>
          <View style={styles.totals}>
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalFinalLbl}>TOTAL</Text>
              <Text style={styles.totalFinalVal}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* TÉRMINOS */}
        <View style={styles.termsArea}>
          <Text style={styles.blackBar}>TERMINOS GENERALES:</Text>
          <Text style={styles.termsText}>{terminos}</Text>
        </View>

        {/* Anticipo (pie) */}
        {(d.anticipoPorcentaje != null || d.anticipoMonto != null) && (
          <Text style={{ marginTop: 10, fontSize: 9, color: '#666' }}>
            Anticipo {d.anticipoPorcentaje ?? 0}%: ${(d.anticipoMonto ?? 0).toFixed(2)} MXN
          </Text>
        )}
      </Page>
    </Document>
  )
}
