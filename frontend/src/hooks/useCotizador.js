import { useState, useMemo, useCallback } from 'react'
import {
  COTIZADOR_DEFAULTS,
  MATERIALES,
  EXTRAS_CONFIG,
} from '../config/cotizador'

const round2 = (n) => Math.round((n ?? 0) * 100) / 100

/** Estado inicial de extras: cada uno con { on, valor, cantidad? } */
function getExtrasInitial() {
  return EXTRAS_CONFIG.reduce((acc, e) => {
    acc[e.id] = {
      on: false,
      valor: e.defaultCosto,
      ...(e.porUnidad ? { cantidad: 0 } : {}),
    }
    return acc
  }, {})
}

/**
 * Hook con toda la lógica de la calculadora de cotización.
 * Cálculos con useMemo para no recalcular innecesariamente.
 */
export function useCotizador(initialConfig = {}) {
  const config = { ...COTIZADOR_DEFAULTS, ...initialConfig }

  // ─── Material (Sección A) ─────────────────────────────────────────
  const [materialId, setMaterialId] = useState('pla')
  const [gramos, setGramos] = useState(0)
  const [materialEspecial, setMaterialEspecial] = useState(false)
  const [materialEspecialCosto, setMaterialEspecialCosto] = useState(0)

  // ─── Tiempo máquina (Sección B) ─────────────────────────────────────
  const [horasMaquina, setHorasMaquina] = useState(0)

  // ─── Diseño y corrección (Sección C) ───────────────────────────────
  const [requiereDiseno, setRequiereDiseno] = useState(false)
  const [horasDiseno, setHorasDiseno] = useState(0)
  const [requiereCorreccionSTL, setRequiereCorreccionSTL] = useState(false)
  const [requiereIngenieriaReversa, setRequiereIngenieriaReversa] = useState(false)
  const [horasIngenieria, setHorasIngenieria] = useState(0)

  // ─── Extras (Sección D) ───────────────────────────────────────────
  const [extras, setExtras] = useState(getExtrasInitial)

  // ─── Margen (Sección E) ───────────────────────────────────────────
  const [margenPorcentaje, setMargenPorcentaje] = useState(config.margenDefault)

  // ─── Helpers ──────────────────────────────────────────────────────
  const material = useMemo(
    () => MATERIALES.find((m) => m.id === materialId) || MATERIALES[0],
    [materialId]
  )

  const updateExtra = useCallback((id, patch) => {
    setExtras((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }, [])

  // ─── Cálculos (useMemo) ────────────────────────────────────────────

  const costoMaterial = useMemo(() => {
    if (materialEspecial) return round2(materialEspecialCosto)
    const precioKg = material?.costoPorKg ?? 500
    return round2((gramos / 1000) * precioKg)
  }, [materialEspecial, materialEspecialCosto, gramos, material])

  const costoTiempoMaquina = useMemo(() => {
    return round2(horasMaquina * config.costoHoraMaquina)
  }, [horasMaquina, config.costoHoraMaquina])

  const costoDisenoYArchivo = useMemo(() => {
    let total = 0
    if (requiereDiseno) total += horasDiseno * config.tarifaDisenoHora
    if (requiereCorreccionSTL) total += config.costoCorreccionSTL
    if (requiereIngenieriaReversa) total += horasIngenieria * config.tarifaIngenieriaReversaHora
    return round2(total)
  }, [
    requiereDiseno,
    horasDiseno,
    requiereCorreccionSTL,
    requiereIngenieriaReversa,
    horasIngenieria,
    config.tarifaDisenoHora,
    config.costoCorreccionSTL,
    config.tarifaIngenieriaReversaHora,
  ])

  const costoExtras = useMemo(() => {
    let total = 0
    EXTRAS_CONFIG.forEach((ec) => {
      const e = extras[ec.id]
      if (!e?.on) return
      if (ec.porUnidad) total += (e.cantidad ?? 0) * (e.valor ?? ec.defaultCosto)
      else total += e.valor ?? ec.defaultCosto
    })
    return round2(total)
  }, [extras])

  const costoTotal = useMemo(() => {
    return round2(
      costoMaterial + costoTiempoMaquina + costoDisenoYArchivo + costoExtras
    )
  }, [costoMaterial, costoTiempoMaquina, costoDisenoYArchivo, costoExtras])

  const margenDecimal = useMemo(
    () => (margenPorcentaje ?? 0) / 100,
    [margenPorcentaje]
  )

  const precioCliente = useMemo(() => {
    return round2(costoTotal * (1 + margenDecimal))
  }, [costoTotal, margenDecimal])

  const ganancia = useMemo(() => {
    return round2(precioCliente - costoTotal)
  }, [precioCliente, costoTotal])

  const anticipoPorcentaje = config.anticipoPorcentaje ?? 50
  const anticipoMonto = useMemo(() => {
    return round2((precioCliente * anticipoPorcentaje) / 100)
  }, [precioCliente, anticipoPorcentaje])

  // ─── Resumen para preview/PDF ───────────────────────────────────────
  const desglose = useMemo(
    () => ({
      material: costoMaterial,
      tiempoMaquina: costoTiempoMaquina,
      disenoArchivo: costoDisenoYArchivo,
      extras: costoExtras,
      costoTotal,
      margenPorcentaje,
      precioCliente,
      ganancia,
      anticipoMonto,
      anticipoPorcentaje,
    }),
    [
      costoMaterial,
      costoTiempoMaquina,
      costoDisenoYArchivo,
      costoExtras,
      costoTotal,
      margenPorcentaje,
      precioCliente,
      ganancia,
      anticipoMonto,
      anticipoPorcentaje,
    ]
  )

  return {
    config,
    MATERIALES,
    EXTRAS_CONFIG,

    // Material
    materialId,
    setMaterialId,
    material,
    gramos,
    setGramos,
    materialEspecial,
    setMaterialEspecial,
    materialEspecialCosto,
    setMaterialEspecialCosto,

    // Tiempo máquina
    horasMaquina,
    setHorasMaquina,

    // Diseño / corrección
    requiereDiseno,
    setRequiereDiseno,
    horasDiseno,
    setHorasDiseno,
    requiereCorreccionSTL,
    setRequiereCorreccionSTL,
    requiereIngenieriaReversa,
    setRequiereIngenieriaReversa,
    horasIngenieria,
    setHorasIngenieria,

    // Extras
    extras,
    setExtras,
    updateExtra,

    // Margen
    margenPorcentaje,
    setMargenPorcentaje,

    // Calculados
    costoMaterial,
    costoTiempoMaquina,
    costoDisenoYArchivo,
    costoExtras,
    costoTotal,
    precioCliente,
    ganancia,
    anticipoMonto,
    anticipoPorcentaje,

    // Para preview/PDF
    desglose,
  }
}
