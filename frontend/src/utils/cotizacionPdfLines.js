/**
 * Líneas solo de productos (P…) para el PDF del cliente: sin regalías ni materiales extra como partidas.
 * Reparte markup + pago vendedor proporcionalmente en el precio unitario/final de cada producto.
 */
export function descripcionProductoParaPdf(linea) {
  const parts = []
  const base = (linea?.descripcion || '').trim()
  if (base && base !== 'Impresión') parts.push(base)
  if (linea?.tipo_material) parts.push(`Material: ${linea.tipo_material}`)
  if (linea?.color_producto) parts.push(`Color: ${linea.color_producto}`)
  const h = Number(linea?.horas_impresion)
  if (Number.isFinite(h) && h > 0) parts.push(`Tiempo impresión: ${h} h`)
  if (parts.length === 0) return 'Impresión'
  return parts.join(' · ')
}

export function buildLineasParaPDF(productLines, blendMontoRegalias) {
  const lines = Array.isArray(productLines) ? productLines.filter((l) => String(l?.id_producto || '').startsWith('P')) : []
  const blend = Math.max(0, Number(blendMontoRegalias) || 0)
  if (lines.length === 0) return []
  const sub = lines.reduce((s, l) => s + (Number(l.costo_final) || 0), 0)
  return lines.map((l) => {
    const baseFinal = Number(l.costo_final) || 0
    const ratio = sub > 0 ? baseFinal / sub : 1 / lines.length
    const add = Math.round(blend * ratio * 100) / 100
    const cf = Math.round((baseFinal + add) * 100) / 100
    const cant = Math.max(1, Number(l.cantidad) || 1)
    const cu = Math.round((cf / cant) * 100) / 100
    return {
      ...l,
      descripcion: descripcionProductoParaPdf(l),
      costo_final: cf,
      costo_unitario: cu,
    }
  })
}

export function sumLineasFinal(arr) {
  return (Array.isArray(arr) ? arr : []).reduce((s, l) => s + (Number(l.costo_final) || 0), 0)
}
