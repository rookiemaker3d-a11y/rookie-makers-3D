import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  docTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  metaTable: { fontSize: 10, lineHeight: 1.8 },
  metaB: { fontWeight: 'bold' },
  validityNote: { fontSize: 8, color: '#888', marginTop: 6 },
  divider: { borderTopWidth: 2, borderTopColor: '#111', marginVertical: 10 },
  parties: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  partyCol: { flex: 1 },
  sectionHead: {
    fontSize: 10,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 3,
    marginBottom: 6,
  },
  infoBlock: { fontSize: 10, lineHeight: 1.7, color: '#222' },
  infoB: { fontWeight: 'bold' },

  /* Cajas: un solo borde exterior; cabecera negra sin borde propio */
  box: {
    borderWidth: 1.5,
    borderColor: '#111',
    marginBottom: 12,
  },
  boxHead: {
    backgroundColor: '#111',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  boxHeadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  boxBody: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  bankRow: { flexDirection: 'row', fontSize: 10, paddingVertical: 2 },
  bankLabel: { width: 90, fontWeight: 'bold', color: '#222' },
  bankValue: { flex: 1, color: '#222' },

  table: {
    borderWidth: 1.5,
    borderColor: '#111',
    marginBottom: 8,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeadCell: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableCell: { fontSize: 8, flex: 1, color: '#222' },
  tableRight: { textAlign: 'right' },

  totalsBlock: { width: 180, alignSelf: 'flex-end', marginBottom: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 },
  totalLbl: { color: '#666' },
  totalVal: { fontWeight: 'bold', textAlign: 'right' },
  totalFinal: { borderTopWidth: 2, borderTopColor: '#111', paddingTop: 4, marginTop: 2 },
  totalFinalLbl: { fontWeight: 'bold', color: '#111' },
  totalFinalVal: { fontSize: 13, fontWeight: 'bold', textAlign: 'right' },

  notesText: { fontSize: 10, color: '#333', lineHeight: 1.6 },
  termsText: { fontSize: 9, lineHeight: 1.7, color: '#333' },
})

const TERMINOS_SERVICIO = [
  'SE REQUIERE PAGO MÍNIMO DE 50% ANTES DEL INICIO DEL SERVICIO / REPARACIÓN.',
  'ROOKIE MAKER 3D NO CUBRE REPUESTOS NO AUTORIZADOS NI DAÑOS PREEXISTENTES NO DECLARADOS.',
  'LOS TIEMPOS DE ENTREGA DEPENDEN DE DISPONIBILIDAD DE REFACCIONES (ZONA LOCAL 3 A 5 DÍAS HÁBILES TÍPICOS).',
]

const NA = 'N/A'
function formatDate(d) {
  if (!d) return NA
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return String(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function Box({ title, children, style, wrap = false }) {
  return (
    <View style={[styles.box, style]} wrap={wrap}>
      <View style={styles.boxHead}>
        <Text style={styles.boxHeadText}>{title}</Text>
      </View>
      <View style={styles.boxBody}>{children}</View>
    </View>
  )
}

/**
 * PDF de cotización / informe de servicio-reparación.
 * Columnas: Id · Concepto · Descripción · Costo · Cant. · Costo final
 */
export default function CotizacionServicioPDF({
  tipo = 'cotizacion',
  folio,
  cliente = {},
  servicio = {},
  conceptos = [],
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
  terminosLines = TERMINOS_SERVICIO,
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

  const partidasConceptos = (conceptos || []).length
    ? (conceptos || []).map((c) => {
        const cant = Number(c.cantidad) || 1
        const precio = Number(c.precio) || 0
        return {
          id: c.id || 'S—',
          concepto: c.concepto || c.nombre || 'Servicio',
          desc: c.descripcion || '',
          costo: precio,
          cant,
          final: cant * precio,
        }
      })
    : Number(costoReparacion) > 0
      ? [{
          id: 'S001',
          concepto: 'Mano de obra / reparación',
          desc: descripcion,
          costo: Number(costoReparacion) || 0,
          cant: 1,
          final: Number(costoReparacion) || 0,
        }]
      : []

  const partidasMats = (materiales || []).map((m, i) => {
    const cant = Number(m.cantidad) || 1
    const cu = Number(m.costo_unitario) || 0
    const sub = m.subtotal != null ? Number(m.subtotal) : cant * cu
    return {
      id: m.id || `M${String(i + 1).padStart(3, '0')}`,
      concepto: m.nombre || 'Material',
      desc: m.descripcion || 'Refacción / material',
      costo: cu,
      cant,
      final: sub,
    }
  })

  const partidas = [...partidasConceptos, ...partidasMats]
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
          <Box title="DATOS DE TRANSFERENCIA">
            <View style={styles.bankRow}><Text style={styles.bankLabel}>BANCO:</Text><Text style={styles.bankValue}>{t.banco || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>CUENTA:</Text><Text style={styles.bankValue}>{t.cuenta || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>CLABE:</Text><Text style={styles.bankValue}>{t.clabe || NA}</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>BENEFICIARIO:</Text><Text style={styles.bankValue}>{t.beneficiario || NA}</Text></View>
          </Box>
        )}

        <View style={styles.table} wrap={false}>
          <View style={styles.tableHead}>
            <Text style={styles.tableHeadCell}>ID</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.6 }]}>CONCEPTO</Text>
            <Text style={[styles.tableHeadCell, { flex: 2 }]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableHeadCell, styles.tableRight]}>COSTO</Text>
            <Text style={[styles.tableHeadCell, styles.tableRight]}>CANT.</Text>
            <Text style={[styles.tableHeadCell, styles.tableRight]}>COSTO FINAL</Text>
          </View>
          {partidas.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>—</Text>
              <Text style={[styles.tableCell, { flex: 1.6 }]}>Sin partidas</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{NA}</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>$0.00</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>0</Text>
              <Text style={[styles.tableCell, styles.tableRight]}>$0.00</Text>
            </View>
          ) : (
            partidas.map((l, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{l.id}</Text>
                <Text style={[styles.tableCell, { flex: 1.6 }]}>{l.concepto}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{l.desc || NA}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.costo ?? 0).toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>{l.cant ?? 1}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.final ?? 0).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}><Text style={styles.totalLbl}>SUBTOTAL</Text><Text style={styles.totalVal}>${subTotal.toFixed(2)}</Text></View>
          {margen > 0 && (
            <View style={styles.totalRow}><Text style={styles.totalLbl}>MARGEN {margen}%</Text><Text style={styles.totalVal}>${(total - subTotal).toFixed(2)}</Text></View>
          )}
          <View style={[styles.totalRow, styles.totalFinal]}><Text style={styles.totalFinalLbl}>TOTAL</Text><Text style={styles.totalFinalVal}>${total.toFixed(2)}</Text></View>
        </View>

        <Box title={isInforme ? 'TRABAJO REALIZADO / INFORME:' : 'NOTAS ADICIONALES:'}>
          <Text style={styles.notesText}>
            {isInforme
              ? (trabajoRealizado && String(trabajoRealizado).trim() ? trabajoRealizado : (notas && notas.trim() ? notas : NA))
              : (notas && notas.trim() ? notas : NA)}
          </Text>
        </Box>

        {isInforme && fotosOk.length > 0 && (
          <View style={{ marginBottom: 10 }} wrap={false}>
            <Text style={styles.sectionHead}>FOTOS DEL ARREGLO:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {fotosOk.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  style={{ width: 150, height: 110, objectFit: 'cover', borderWidth: 1, borderColor: '#111' }}
                />
              ))}
            </View>
          </View>
        )}

        <Box title="TERMINOS GENERALES:" wrap={false}>
          {(terminosLines || []).map((line, i) => (
            <Text key={i} style={styles.termsText}>{line}</Text>
          ))}
        </Box>

        {!isInforme && (
          <Box title="VIGENCIA:" wrap={false}>
            <Text style={styles.termsText}>
              COTIZACIÓN VÁLIDA POR {diasValidez} DÍAS NATURALES A PARTIR DE LA RECEPCIÓN.
            </Text>
            <Text style={styles.termsText}>
              CUALQUIER DUDA O ACLARACIÓN COMUNICARSE AL TELÉFONO DE CONTACTO DE SU VENDEDOR.
            </Text>
          </Box>
        )}
      </Page>
    </Document>
  )
}
