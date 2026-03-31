/**
 * Configuración por defecto de la calculadora de cotización.
 * Valores editables desde ajustes más adelante.
 */

export const COTIZADOR_DEFAULTS = {
  // Tiempo de máquina (PASO 3 - Sección B)
  costoHoraMaquina: 18, // MXN/hr
  calibracionMin: 25, // minutos extra por calibración (Excel)

  // Diseño y archivo (Sección C)
  tarifaDisenoHora: 150, // MXN/hr diseño desde cero
  costoCorreccionSTL: 150, // MXN fijo
  tarifaIngenieriaReversaHora: 150, // MXN/hr

  // Margen
  margenMin: 30, // %
  margenMax: 200, // %
  margenDefault: 50, // %

  // Anticipo
  anticipoPorcentaje: 50, // %
}

// Materiales con costo por kg y nombre (inventario/disponibilidad se puede conectar a API)
export const MATERIALES = [
  { id: 'pla', nombre: 'PLA', costoPorKg: 300 },
  { id: 'pla_plus', nombre: 'PLA+', costoPorKg: 330 },
  { id: 'abs', nombre: 'ABS', costoPorKg: 380 },
  { id: 'petg', nombre: 'PETG', costoPorKg: 420 },
  { id: 'asa', nombre: 'ASA', costoPorKg: 450 },
  { id: 'tpu', nombre: 'TPU', costoPorKg: 650 },
  { id: 'nylon', nombre: 'Nylon', costoPorKg: 750 },
  { id: 'resina', nombre: 'Resina', costoPorKg: 1100 },
  { id: 'pla_madera', nombre: 'PLA Madera', costoPorKg: 360 },
  { id: 'abs_cf', nombre: 'ABS-CF', costoPorKg: 950 },
  { id: 'otro', nombre: 'Otro', costoPorKg: 300 },
]

/** Extras con label y costo por defecto (MXN). porUnidad: true = cantidad × valor */
export const EXTRAS_CONFIG = [
  { id: 'lijado', label: 'Lijado y acabado superficial', defaultCosto: 80, porUnidad: false },
  { id: 'pintura', label: 'Pintura (color a especificar)', defaultCosto: 120, porUnidad: false },
  { id: 'insertos', label: 'Insertos roscados metálicos', defaultCosto: 15, porUnidad: true },
  { id: 'ensamble', label: 'Ensamble de piezas múltiples', defaultCosto: 100, porUnidad: false },
  { id: 'resina_acabado', label: 'Resina de acabado (coating)', defaultCosto: 60, porUnidad: false },
  { id: 'empaque', label: 'Empaque especial', defaultCosto: 50, porUnidad: false },
  { id: 'envio', label: 'Envío incluido', defaultCosto: 0, porUnidad: false },
  { id: 'extra_personalizado', label: 'Extra personalizado', defaultCosto: 0, porUnidad: false },
]
