/**
 * Catálogo fijo de conceptos de servicio / reparación.
 * Id · Concepto · Descripción · Precio
 */
export const CONCEPTOS_SERVICIO = [
  {
    id: 'S001',
    concepto: 'Mantenimiento',
    descripcion: 'Limpieza y lubricación',
    precio: 300,
  },
  {
    id: 'S002',
    concepto: 'Reparación',
    descripcion: 'Reparación de daños en impresión',
    precio: 500,
  },
  {
    id: 'S003',
    concepto: 'Diagnóstico',
    descripcion: 'Diagnóstico técnico',
    precio: 200,
  },
]

export function conceptoById(id) {
  return CONCEPTOS_SERVICIO.find((c) => c.id === id) || null
}

export function calcTotalesServicio(conceptos = [], materiales = [], pct = 0) {
  const conceptosTotal = (conceptos || []).reduce((s, c) => {
    const cant = Number(c.cantidad) || 1
    const precio = Number(c.precio) || 0
    return s + cant * precio
  }, 0)
  const matsTotal = (materiales || []).reduce((s, m) => {
    const cant = Number(m.cantidad) || 0
    const cu = Number(m.costo_unitario) || 0
    return s + cant * cu
  }, 0)
  const base = conceptosTotal + matsTotal
  const final = base * (1 + (Number(pct) || 0) / 100)
  return {
    conceptosTotal,
    matsTotal,
    base,
    final,
    ganancia: final - base,
  }
}
