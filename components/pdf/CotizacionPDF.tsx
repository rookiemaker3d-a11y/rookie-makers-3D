import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  subtitle: { fontSize: 16, marginBottom: 24 },
  row: { flexDirection: "row", marginBottom: 8 },
  label: { width: 200 },
  line: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 12 },
  tableHeader: { flexDirection: "row", fontWeight: "bold", marginBottom: 8 },
  colDesc: { width: "35%" },
  colCant: { width: "15%", textAlign: "right" },
  colTiempo: { width: "25%", textAlign: "right" },
  colCosto: { width: "25%", textAlign: "right" },
  tableRow: { flexDirection: "row", marginBottom: 6 },
  totalRow: { flexDirection: "row", marginTop: 12, fontWeight: "bold" },
  terms: { marginTop: 24, fontSize: 10 },
  bank: { marginTop: 24, fontWeight: "bold" },
});

export interface CotizacionItemPDF {
  descripcion: string;
  cantidad: number;
  tiempo_min: number;
  costo_final: number;
}

interface CotizacionPDFDocProps {
  items: CotizacionItemPDF[];
  vendedorNombre: string;
  fecha: string;
  banco?: string;
  cuenta?: string;
}

export function CotizacionPDFDoc({
  items,
  vendedorNombre,
  fecha,
  banco = "",
  cuenta = "",
}: CotizacionPDFDocProps) {
  const total = items.reduce((s, i) => s + i.costo_final, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rookie Makers 3D</Text>
        <Text style={styles.subtitle}>COTIZACIÓN DE IMPRESIÓN 3D</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha: {fecha}</Text>
          <Text>Vendedor: {vendedorNombre}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colCant}>Cantidad</Text>
          <Text style={styles.colTiempo}>Tiempo (min)</Text>
          <Text style={styles.colCosto}>Costo Final</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.descripcion}</Text>
            <Text style={styles.colCant}>{item.cantidad}</Text>
            <Text style={styles.colTiempo}>{Math.round(item.tiempo_min)}</Text>
            <Text style={styles.colCosto}>${item.costo_final.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.line} />
        <View style={styles.totalRow}>
          <Text style={styles.colDesc}></Text>
          <Text style={styles.colCant}></Text>
          <Text style={styles.colTiempo}>Total:</Text>
          <Text style={styles.colCosto}>${total.toFixed(2)}</Text>
        </View>
        <Text style={styles.terms}>
          Esta cotización tiene una validez de 3 días hábiles. El tiempo de
          entrega es de 3 días hábiles a partir de la confirmación del pedido.
        </Text>
        <Text style={styles.bank}>Cuenta para Depósito:</Text>
        <Text>
          Banco: {banco} - Cuenta: {cuenta}
        </Text>
      </Page>
    </Document>
  );
}
