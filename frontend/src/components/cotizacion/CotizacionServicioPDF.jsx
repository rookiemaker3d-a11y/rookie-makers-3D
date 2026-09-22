import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoWrap: { alignItems: 'flex-start', minWidth: 140 },
  logoImage: { width: 120, height: 84, marginBottom: 8, objectFit: 'contain' },
  logoBox: {
    width: 120,
    height: 84,
    backgroundColor: '#111',
    borderRadius: 6,
    marginBottom: 8,
  },
  brandName: { fontWeight: 'bold', fontSize: 18, lineHeight: 1.2, color: '#111' },
  tagline: { fontSize: 9, letterSpacing: 1.5, color: '#666', marginTop: 2 },
  metaRight: { textAlign: 'right' },
  docTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  metaTable: { fontSize: 11, lineHeight: 2 },
  metaB: { fontWeight: 'bold' },
  validityNote: { fontSize: 8, color: '#888', marginTop: 6 },
  divider: { borderTopWidth: 2, borderTopColor: '#111', marginVertical: 12 },
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
  bottom: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  notesArea: { flex: 1, borderWidth: 1.5, borderColor: '#111' },
  notesText: { fontSize: 10, color: '#333', lineHeight: 1.7, minHeight: 40, padding: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 },
  totalLbl: { color: '#666' },
  totalVal: { fontWeight: 'bold', textAlign: 'right' },
  totalFinal: { borderTopWidth: 2, borderTopColor: '#111', paddingTop: 4, marginTop: 2 },
  totalFinalLbl: { fontWeight: 'bold', color: '#111' },
  totalFinalVal: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  tableWrap: { borderWidth: 1, borderColor: '#111', marginTop: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 3, paddingHorizontal: 4 },
  tableCell: { fontSize: 8, flex: 1 },
  tableHeaderBlack: { fontWeight: 'bold', backgroundColor: '#111', color: '#fff', padding: 4 },
  tableRight: { textAlign: 'right' },
  totalsBlock: { width: 180, alignSelf: 'flex-end', marginTop: 8 },
  termsArea: { borderWidth: 1.5, borderColor: '#111', marginTop: 14 },
  termsText: { fontSize: 9, lineHeight: 1.9, color: '#333', padding: 6 },
})

const TERMINOS_SERVICIO = `SE REQUIERE PAGO MÍNIMO DE 50% ANTES DEL INICIO DEL SERVICIO / REPARACIÓN.
ROOKIE MAKER 3D NO CUBRE REPUESTOS NO AUTORIZADOS NI DAÑOS PREEXISTENTES NO DECLARADOS.
LOS TIEMPOS DE ENTREGA DEPENDEN DE DISPONIBILIDAD DE REFACCIONES (ZONA LOCAL 3 A 5 DÍAS HÁBILES TÍPICOS).
COTIZACIÓN VÁLIDA POR 7 DÍAS NATURALES A PARTIR DE LA RECEPCIÓN.
CUALQUIER DUDA O ACLARACIÓN COMUNICARSE AL TELÉFONO DE CONTACTO DE SU VENDEDOR.`

const NA = 'N/A'
function formatDate(d) {
  if (!d) return NA
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return String(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

/**
 * PDF de cotización / informe de servicio-reparación.
 * Mismo formato visual que CotizacionPDF (impresión), adaptado a servicio.
 * tipo: 'cotizacion' | 'informe'
 */
export default function CotizacionServicioPDF({
  tipo = 'cotizacion',
  folio,
  cliente = {},
  servicio = {},
  materiales = [],
  costoReparacion = 0,
  costoBase = 0,
  costoFinal = 0,
  porcentajeGanancia = 0,
  notas,
  trabajoRealizado,
  vendedor = {},
  transferencia = {},
  diasValidez = 7,
  terminos = TERMINOS_SERVICIO,
  logoUrl,
  fecha,
  fotos = [],
}) {
  const hoy = fecha ? new Date(fecha) : new Date()
  const expira = new Date(hoy)
  expira.setDate(expira.getDate() + (diasValidez || 7))

  const marca = servicio.marca_impresora || servicio.marca || ''
  const modelo = servicio.modelo_impresora || servicio.modelo || ''
  const equipo = [marca, modelo].filter(Boolean).join(' ') || 'Impresora 3D'
  const descripcion = servicio.descripcion || 'Servicio / reparación'
  const fotosOk = (fotos || []).filter((f) => typeof f === 'string' && f.startsWith('data:image')).slice(0, 6)

  const partidas = [
    {
      id: 'S001',
      nombre: 'Mano de obra / reparación',
      desc: descripcion,
      costo: Number(costoReparacion) || 0,
      cant: 1,
      final: Number(costoReparacion) || 0,
    },
    ...(materiales || []).map((m, i) => {
      const cant = Number(m.cantidad) || 1
      const cu = Number(m.costo_unitario) || 0
      const sub = m.subtotal != null ? Number(m.subtotal) : cant * cu
      return {
        id: `M${String(i + 1).padStart(3, '0')}`,
        nombre: m.nombre || 'Material',
        desc: 'Refacción / material',
        costo: cu,
        cant,
        final: sub,
      }
    }),
  ]

  const subTotal = Number(costoBase) || partidas.reduce((s, p) => s + (p.final || 0), 0)
  const total = Number(costoFinal) || subTotal
  const margen = Number(porcentajeGanancia) || 0
  const isInforme = tipo === 'informe'
  const titulo = isInforme ? 'INFORME DE SERVICIO' : 'COTIZACIÓN SERVICIO'
  const v = vendedor
  const t = transferencia

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <>
                <View style={styles.logoBox} />
                <Text style={styles.brandName}>ROOKIE{'\n'}MAKERS 3D</Text>
                <Text style={styles.tagline}>PRINT YOUR DREAMS</Text>
              </>
            )}
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.docTitle}>{titulo}</Text>
            <View style={styles.metaTable}>
              <Text><Text style={styles.metaB}>FECHA:</Text> {formatDate(hoy)}</Text>
              {!isInforme && (
                <Text><Text style={styles.metaB}>FECHA DE EXPIRACIÓN:</Text> {formatDate(expira)}</Text>
              )}
              <Text><Text style={styles.metaB}>NO. {isInforme ? 'INFORME' : 'COTIZACIÓN'}:</Text> {folio || NA}</Text>
            </View>
            {!isInforme && (
              <Text style={styles.validityNote}>
                Cotización válida por {diasValidez} días naturales a partir de la recepción
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.sectionHead}>DATOS DEL VENDEDOR:</Text>
            <View style={styles.infoBlock}>
              <Text><Text style={styles.infoB}>{v.nombre || NA}</Text></Text>
              <Text>{v.email || NA}</Text>
              <Text>{v.telefono || NA}</Text>
            </View>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.sectionHead}>DATOS DEL CLIENTE:</Text>
            <View style={styles.infoBlock}>
              {cliente?.id && <Text><Text style={styles.infoB}>{cliente.id}</Text></Text>}
              <Text><Text style={styles.infoB}>{cliente?.nombre || NA}</Text></Text>
              <Text>{cliente?.correo || NA}</Text>
              <Text>{cliente?.telefono || NA}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHead}>EQUIPO / SERVICIO:</Text>
          <View style={styles.infoBlock}>
            <Text><Text style={styles.infoB}>{equipo}</Text></Text>
            <Text>{descripcion}</Text>
            {margen > 0 && !isInforme && <Text>Margen aplicado: {margen}%</Text>}
          </View>
        </View>

        {!isInforme && (
          <View style={styles.bankWrap}>
            <Text style={styles.blackBar}>DATOS DE TRANSFERENCIA</Text>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>BANCO:</Text><Text style={styles.bankValue}>{t.banco || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>CUENTA:</Text><Text style={styles.bankValue}>{t.cuenta || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>CLABE:</Text><Text style={styles.bankValue}>{t.clabe || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>BENEFICIARIO:</Text><Text style={styles.bankValue}>{t.beneficiario || NA}</Text></View>
          </View>
        )}

        <View style={{ marginBottom: 14 }}>
          <View style={[styles.tableWrap, { borderTopWidth: 0 }]}>
            <View style={[styles.tableRow, styles.blackBar, { marginBottom: 0, borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, styles.tableHeaderBlack]}>ID</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, { flex: 2 }]}>CONCEPTO</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, { flex: 1.5 }]}>DESCRIPCIÓN</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>COSTO</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>CANT.</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>COSTO FINAL</Text>
            </View>
            {partidas.map((l, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{l.id}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{l.nombre}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{l.desc}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.costo ?? 0).toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>{l.cant ?? 1}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.final ?? 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}><Text style={styles.totalLbl}>SUBTOTAL (COSTO)</Text><Text style={styles.totalVal}>${subTotal.toFixed(2)}</Text></View>
            {margen > 0 && (
              <View style={styles.totalRow}><Text style={styles.totalLbl}>MARGEN {margen}%</Text><Text style={styles.totalVal}>${(total - subTotal).toFixed(2)}</Text></View>
            )}
            <View style={[styles.totalRow, styles.totalFinal]}><Text style={styles.totalFinalLbl}>TOTAL</Text><Text style={styles.totalFinalVal}>${total.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.notesArea}>
            <Text style={styles.blackBar}>{isInforme ? 'TRABAJO REALIZADO / INFORME:' : 'NOTAS ADICIONALES:'}</Text>
            <Text style={styles.notesText}>
              {isInforme
                ? (trabajoRealizado && String(trabajoRealizado).trim() ? trabajoRealizado : (notas && notas.trim() ? notas : NA))
                : (notas && notas.trim() ? notas : NA)}
            </Text>
          </View>
        </View>

        {isInforme && fotosOk.length > 0 && (
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={styles.sectionHead}>FOTOS DEL ARREGLO:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {fotosOk.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  style={{ width: 160, height: 120, objectFit: 'cover', marginBottom: 6, borderWidth: 1, borderColor: '#111' }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.termsArea}>
          <Text style={styles.blackBar}>TERMINOS GENERALES:</Text>
          <Text style={styles.termsText}>{terminos}</Text>
        </View>
      </Page>
    </Document>
  )
}
