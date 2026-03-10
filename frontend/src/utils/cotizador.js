// Misma base que el backend (calculator_window / cost_calculator)
const MARGEN = 0.5
const COSTO_FILAMENTO_KG = 500
const COSTO_ENERGIA = 4.5
const COSTO_LIMPIEZA = 25
const COSTO_DISENO = 50

// Relación de relleno por calidad (proporción relacional a partir de uso típico en impresión 3D)
// Baja: ~15% relleno, económico. Media: ~25-30% estándar. Alta: ~50%+ resistente/detalle
export const CALIDADES = {
  baja: { label: 'Baja (económica)', relleno: '~15%', factor: 0.75 },
  media: { label: 'Media (estándar)', relleno: '~25-30%', factor: 1 },
  alta: { label: 'Alta (resistente)', relleno: '~50%+', factor: 1.35 },
}

// Tamaño como proporción relacional (afecta gramos y tiempo)
export const TAMANOS = {
  pequeno: { label: 'Pequeño', factor: 0.6 },
  mediano: { label: 'Mediano', factor: 1 },
  grande: { label: 'Grande', factor: 1.5 },
}

export function calcularCosto(horas, minutos, gramos, limpieza, diseno, cantidad, envio, calidadKey = 'media', tamañoKey = 'mediano') {
  const calidad = CALIDADES[calidadKey] || CALIDADES.media
  const tamaño = TAMANOS[tamañoKey] || TAMANOS.mediano
  const factor = calidad.factor * tamaño.factor

  const tiempoMin = (horas * 60 + minutos) * factor
  const gramosAjustados = gramos * factor
  const costoFilamento = (gramosAjustados / 1000) * COSTO_FILAMENTO_KG
  const costoEnergia = (COSTO_ENERGIA * tiempoMin) / 60
  const costoLimpieza = (COSTO_LIMPIEZA * limpieza) / 60
  const costoDiseno = (COSTO_DISENO * diseno) / 60
  const costoBasePieza = costoFilamento + costoEnergia + costoLimpieza + costoDiseno
  const total = (costoBasePieza + costoBasePieza * MARGEN) * cantidad + envio
  return { total: Math.round(total * 100) / 100, costoBasePieza }
}
