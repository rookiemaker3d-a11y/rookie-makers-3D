import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { fontSize: 9, color: '#666', marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 120, color: '#666' },
  value: { flex: 1 },
  table: { marginTop: 16, marginBottom: 16 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 6 },
  tableHead: { fontWeight: 'bold', color: '#444' },
  tableCell: { flex: 1 },
  tableCellRight: { flex: 1, textAlign: 'right' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333', fontWeight: 'bold', flexDirection: 'row', justifyContent: 'space-between' },
  footer: { marginTop: 24, fontSize: 8, color: '#888' },
})

export default function CotizacionPDF({ folio, cliente, proyecto, desglose, notas }) {
  const d = desglose || {}
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rookie Makers 3D</Text>
        <Text style={styles.subtitle}>Cotización · {folio}</Text>
        <View style={styles.row}><Text style={styles.label}>Cliente:</Text><Text style={styles.value}>{cliente?.nombre ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Correo:</Text><Text style={styles.value}>{cliente?.correo ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Proyecto:</Text><Text style={styles.value}>{proyecto?.nombre ?? '—'}</Text></View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={styles.tableCell}>Concepto</Text>
            <Text style={styles.tableCellRight}>Monto (MXN)</Text>
          </View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Material</Text><Text style={styles.tableCellRight}>${d.material?.toFixed(2)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Tiempo máquina</Text><Text style={styles.tableCellRight}>${d.tiempoMaquina?.toFixed(2)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Diseño / archivo</Text><Text style={styles.tableCellRight}>${d.disenoArchivo?.toFixed(2)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Extras</Text><Text style={styles.tableCellRight}>${d.extras?.toFixed(2)}</Text></View>
        </View>
        <View style={styles.totalRow}>
          <Text>TOTAL</Text>
          <Text>${d.precioCliente?.toFixed(2)} MXN</Text>
        </View>
        <Text style={styles.subtitle}>Anticipo {d.anticipoPorcentaje}%: ${d.anticipoMonto?.toFixed(2)} MXN</Text>
        {notas && <Text style={styles.footer}>{notas}</Text>}
        <Text style={styles.footer}>Vigencia 7 días · Métodos de pago: Transferencia, Clip, Efectivo</Text>
      </Page>
    </Document>
  )
}
