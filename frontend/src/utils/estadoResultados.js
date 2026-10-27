/** Tarifas del estado de resultados (misma base que el Excel de sillas). */
export const TARIFAS_RESULTADO = {
  plaKg: 400,
  merma: 0.05,
  watts: 120,
  tarifaKwh: 2.6,
  internetMes: 450,
  horasUsoMes: 120,
  desgasteHora: 3,
  salarioDia: 315.04,
  jornada: 8,
  minPrep: 24,
  minRevCada8h: 9,
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

/**
 * Costo real de una pieza a partir de horas de impresión y gramos.
 * precio = lo que se cobra al cliente (ya con el margen de la calculadora).
 */
export function estadoResultadosPieza({ horas = 0, gramos = 0, precio = 0, costoKg } = {}) {
  const t = TARIFAS_RESULTADO
  const h = Math.max(0, Number(horas) || 0)
  const g = Math.max(0, Number(gramos) || 0)
  const kg = Number(costoKg) > 0 ? Number(costoKg) : t.plaKg
  const material = round2((g / 1000) * kg * (1 + t.merma))
  const luz = round2(h * (t.watts / 1000) * t.tarifaKwh)
  const internet = round2(t.horasUsoMes > 0 ? h * (t.internetMes / t.horasUsoMes) : 0)
  const desgaste = round2(h * t.desgasteHora)
  const horasHombre = t.minPrep / 60 + (h / 8) * (t.minRevCada8h / 60)
  const manoObra = round2(t.jornada > 0 ? horasHombre * (t.salarioDia / t.jornada) : 0)
  const costoReal = round2(material + luz + internet + desgaste + manoObra)
  const cobrado = round2(precio)
  const ganancia = round2(cobrado - costoReal)
  return {
    horas: round2(h),
    gramos: round2(g),
    material,
    luz,
    internet,
    desgaste,
    mano_obra: manoObra,
    costo_real: costoReal,
    precio: cobrado,
    ganancia,
    margen: cobrado > 0 ? ganancia / cobrado : 0,
  }
}

export function sumarEstados(lista) {
  const vacio = {
    material: 0, luz: 0, internet: 0, desgaste: 0, mano_obra: 0,
    costo_real: 0, precio: 0, ganancia: 0, horas: 0, gramos: 0,
  }
  const acc = (lista || []).reduce((s, e) => {
    if (!e) return s
    s.material += Number(e.material) || 0
    s.luz += Number(e.luz) || 0
    s.internet += Number(e.internet) || 0
    s.desgaste += Number(e.desgaste) || 0
    s.mano_obra += Number(e.mano_obra) || 0
    s.costo_real += Number(e.costo_real) || 0
    s.precio += Number(e.precio) || 0
    s.ganancia += Number(e.ganancia) || 0
    s.horas += Number(e.horas) || 0
    s.gramos += Number(e.gramos) || 0
    return s
  }, { ...vacio })
  Object.keys(acc).forEach((k) => { acc[k] = round2(acc[k]) })
  acc.margen = acc.precio > 0 ? acc.ganancia / acc.precio : 0
  return acc
}

export function estadosDeLineas(lineas) {
  return (Array.isArray(lineas) ? lineas : [])
    .map((l) => l?.estado_resultados)
    .filter(Boolean)
}

export function estadoDeVenta(v, productos) {
  const embebidos = (v?.productos || []).map((l) => l?.estado_resultados).filter(Boolean)
  if (embebidos.length) return sumarEstados(embebidos)
  const usados = new Set()
  const partes = []
  for (const linea of v?.productos || []) {
    const nombre = (linea?.descripcion || '').trim()
    if (!nombre) continue
    const prod = (productos || []).find((p) => (
      !usados.has(p.id)
      && (p.descripcion || '').trim() === nombre
      && p.detalles?.estado_resultados
    ))
    if (!prod) continue
    usados.add(prod.id)
    partes.push(prod.detalles.estado_resultados)
  }
  return partes.length ? sumarEstados(partes) : null
}

export function cifrasMovimiento(v, productos) {
  const ingreso = Number(v?.total) || 0
  const estado = estadoDeVenta(v, productos)
  if (estado) {
    const costo = Number(estado.costo_real) || 0
    const ganancia = round2(ingreso - costo)
    return { ingreso, costo, ganancia, estado, pct: ingreso > 0 ? ganancia / ingreso : 0 }
  }
  const ganancia = Number(v?.ganancia_neta) || 0
  return { ingreso, costo: round2(ingreso - ganancia), ganancia, estado: null, pct: ingreso > 0 ? ganancia / ingreso : 0 }
}
