import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

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
  docTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 10 },
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
  // Tabla partidas
  tableWrap: { borderWidth: 1, borderColor: '#111', marginTop: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 3, paddingHorizontal: 4 },
  tableCell: { fontSize: 8, flex: 1 },
  tableHeaderBlack: { fontWeight: 'bold', backgroundColor: '#111', color: '#fff', padding: 4 },
  tableRight: { textAlign: 'right' },
  totalsBlock: { width: 180, alignSelf: 'flex-end', marginTop: 8 },
  // Términos
  termsArea: { borderWidth: 1.5, borderColor: '#111', marginTop: 14 },
  termsText: { fontSize: 9, lineHeight: 1.9, color: '#333', padding: 6 },
})

const TERMINOS_DEFAULT = `SE REQUIERE PAGO MÍNIMO DE 50% ANTES DEL INICIO DEL SERVICIO.
ROOKIE MAKER 3D NO CUBRE GASTOS DE ENTREGA A NO SER QUE SE ESPECIFIQUE.
LOS TIEMPOS DE ENTREGA QUEDAN DE 3 A 5 DIAS HABILES. (ZONA LOCAL)
COTIZACION VALIDA POR 7 DIAS NATURALES A PARTIR DE LA RECEPCION
CUALQUIER DUDA O ACLARACIÓN COMUNICARSE AL TELÉFONO DE CONTACTO DE SU VENDEDOR`

const NA = 'N/A'
function formatDate(d) {
  if (!d) return NA
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

export default function CotizacionPDF({
  folio,
  cliente,
  proyecto,
  desglose,
  notas,
  lineas,
  subTotal: subTotalProp,
  descuento: descuentoProp,
  envio: envioProp,
  empaque: empaqueProp = 0,
  totalFinal: totalFinalProp,
  vendedor = {},
  transferencia = {},
  diasValidez = 7,
  terminos = TERMINOS_DEFAULT,
  logoUrl,
}) {
  const d = desglose || {}
  const hoy = new Date()
  const expira = new Date(hoy)
  expira.setDate(expira.getDate() + (diasValidez || 7))

  const hasLineas = Array.isArray(lineas) && lineas.length > 0
  const descuento = hasLineas ? (Number(descuentoProp) || 0) : 0
  const envio = Number(envioProp) || 0
  const empaque = Number(empaqueProp) || 0
  const precioCliente = Number(d.precioCliente) || 0
  const total = Number(totalFinalProp) || (hasLineas ? (Number(subTotalProp) || 0) - descuento + envio + empaque : precioCliente - descuento + envio + empaque)
  const subTotal = hasLineas ? (Number(subTotalProp) || 0) : (precioCliente || total)
  const partidas = hasLineas
    ? lineas
    : [{
      id_producto: 'P001',
      nombre_producto: (proyecto?.nombre || 'Producto'),
      descripcion: 'Impresión',
      costo_unitario: subTotal,
      cantidad: 1,
      costo_final: subTotal,
    }]

  const v = vendedor
  const t = transferencia

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* TOP: logo + COTIZACIÓN y meta */}
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
            <Text style={styles.docTitle}>COTIZACIÓN</Text>
            <View style={styles.metaTable}>
              <Text><Text style={styles.metaB}>FECHA:</Text> {formatDate(hoy)}</Text>
              <Text><Text style={styles.metaB}>FECHA DE EXPIRACIÓN:</Text> {formatDate(expira)}</Text>
              <Text><Text style={styles.metaB}>NO. COTIZACIÓN:</Text> {folio || NA}</Text>
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
              <Text><Text style={styles.infoB}>{v.codigo || NA}</Text>{v.id ? ` · ${v.id}` : ''}</Text>
              <Text><Text style={styles.infoB}>{v.nombre || NA}</Text></Text>
              <Text>{v.email || NA}</Text>
              <Text>{v.telefono || NA}</Text>
              <Text>{v.rfc || NA}</Text>
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

        {/* PROYECTO */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionHead}>PROYECTO:</Text>
          <View style={styles.infoBlock}>
            <Text><Text style={styles.infoB}>{proyecto?.nombre || NA}</Text></Text>
            {proyecto?.categoria && <Text>{proyecto.categoria}</Text>}
          </View>
        </View>

        {/* DATOS DE TRANSFERENCIA */}
        <View style={styles.bankWrap}>
          <Text style={styles.blackBar}>DATOS DE TRANSFERENCIA</Text>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>BANCO:</Text><Text style={styles.bankValue}>{t.banco || NA}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>CUENTA:</Text><Text style={styles.bankValue}>{t.cuenta || NA}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>CLABE:</Text><Text style={styles.bankValue}>{t.clabe || NA}</Text></View>
          <View style={styles.bankRow}><Text style={styles.bankLabel}>BENEFICIARIO:</Text><Text style={styles.bankValue}>{t.beneficiario || NA}</Text></View>
          {!!t.tarjeta_ultimos4 && (
            <View style={styles.bankRow}><Text style={styles.bankLabel}>TARJETA:</Text><Text style={styles.bankValue}>{`**** ${t.tarjeta_ultimos4}`}</Text></View>
          )}
        </View>

        {/* TABLA DE PARTIDAS — siempre visible con encabezado negro y bloque de totales */}
        <View style={{ marginBottom: 14 }}>
          <View style={[styles.tableWrap, { borderTopWidth: 0 }]}>
            <View style={[styles.tableRow, styles.blackBar, { marginBottom: 0, borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, styles.tableHeaderBlack]}>ID DE PRODUCTO</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, { flex: 2 }]}>PRODUCTO</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, { flex: 1.5 }]}>DESCRIPCION</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>COSTO</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>CANTIDAD</Text>
              <Text style={[styles.tableCell, styles.tableHeaderBlack, styles.tableRight]}>COSTO FINAL</Text>
            </View>
            {partidas.map((l, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{l.id_producto || NA}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{l.nombre_producto || NA}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{l.descripcion || NA}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.costo_unitario ?? 0).toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>{l.cantidad ?? 1}</Text>
                <Text style={[styles.tableCell, styles.tableRight]}>${(l.costo_final ?? 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}><Text style={styles.totalLbl}>SUB TOTAL</Text><Text style={styles.totalVal}>${subTotal.toFixed(2)}</Text></View>
            {(descuento > 0) && <View style={styles.totalRow}><Text style={styles.totalLbl}>DESCUENTO</Text><Text style={styles.totalVal}>${descuento.toFixed(2)}</Text></View>}
            {empaque > 0 && <View style={styles.totalRow}><Text style={styles.totalLbl}>EMPAQUE</Text><Text style={styles.totalVal}>${empaque.toFixed(2)}</Text></View>}
            {(envio > 0) && <View style={styles.totalRow}><Text style={styles.totalLbl}>ENVIO</Text><Text style={styles.totalVal}>${envio.toFixed(2)}</Text></View>}
            <View style={[styles.totalRow, styles.totalFinal]}><Text style={styles.totalFinalLbl}>TOTAL</Text><Text style={styles.totalFinalVal}>${total.toFixed(2)}</Text></View>
          </View>
        </View>

        {/* NOTAS */}
        <View style={styles.bottom}>
          <View style={styles.notesArea}>
            <Text style={styles.blackBar}>NOTAS ADICIONALES:</Text>
            <Text style={styles.notesText}>{notas && notas.trim() ? notas : NA}</Text>
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
