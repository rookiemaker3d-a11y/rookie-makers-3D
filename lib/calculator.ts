import {
  MARGEN_GANANCIA,
  COSTO_FILAMENTO_BASE,
  COSTO_ENERGIA_BASE,
  COSTO_LIMPIEZA_BASE,
  COSTO_DISENO_BASE,
} from "./constants";

export interface CalculatorInput {
  horas: number;
  minutos: number;
  gramos: number;
  limpieza: number;
  diseno: number;
  cantidad: number;
  envio: number;
}

export interface DetallesCotizacion {
  tiempo_total: number;
  costo_filamento: number;
  costo_energia: number;
  costo_limpieza: number;
  costo_diseno: number;
  costo_envio: number;
}

export interface CalculatorResult {
  costo_base_pieza: number;
  costo_final_total: number;
  tiempo_total_min: number;
  detalles: DetallesCotizacion;
}

/**
 * Replica exacta de calculate_cost y add_to_list de calculator_window.py
 */
export function calculateCost(input: CalculatorInput): CalculatorResult {
  const tiempo_total_min = input.horas * 60 + input.minutos;
  const costo_filamento = (input.gramos / 1000) * COSTO_FILAMENTO_BASE;
  const costo_energia = (COSTO_ENERGIA_BASE * tiempo_total_min) / 60;
  const costo_limpieza = (COSTO_LIMPIEZA_BASE * input.limpieza) / 60;
  const costo_diseno = (COSTO_DISENO_BASE * input.diseno) / 60;
  const costo_base_pieza =
    costo_filamento + costo_energia + costo_limpieza + costo_diseno;
  const costo_final_total =
    (costo_base_pieza + costo_base_pieza * MARGEN_GANANCIA) * input.cantidad +
    input.envio;

  return {
    costo_base_pieza: round(costo_base_pieza, 2),
    costo_final_total: round(costo_final_total, 2),
    tiempo_total_min: round(tiempo_total_min, 2),
    detalles: {
      tiempo_total: round(tiempo_total_min, 2),
      costo_filamento: round(costo_filamento, 2),
      costo_energia: round(costo_energia, 2),
      costo_limpieza: round(costo_limpieza, 2),
      costo_diseno: round(costo_diseno, 2),
      costo_envio: round(input.envio, 2),
    },
  };
}

function round(n: number, d: number): number {
  return Math.round(n * 10 ** d) / 10 ** d;
}
