import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formato moneda México: "$1,250.00 MXN"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Fecha en español México: "lun 3 mar 2025"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEE d MMM yyyy", { locale: es });
}

/**
 * Fecha corta: "03/03/2025"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

/**
 * Margen bruto en porcentaje: (precio - costo) / precio * 100
 */
export function calcularMargen(costo: number, precio: number): number {
  if (precio <= 0) return 0;
  return Math.round(((precio - costo) / precio) * 100);
}

/**
 * Clase Tailwind para estado de pedido (badge)
 */
export function getEstadoColor(
  estado: string
): string {
  const map: Record<string, string> = {
    cotizacion: "bg-gray-500/20 text-gray-200 border-gray-500/50",
    confirmado: "bg-blue-500/20 text-blue-200 border-blue-500/50",
    imprimiendo: "bg-yellow-500/20 text-yellow-200 border-yellow-500/50",
    post_proceso: "bg-orange-500/20 text-orange-200 border-orange-500/50",
    entregado: "bg-green-500/20 text-green-200 border-green-500/50",
    cancelado: "bg-red-500/20 text-red-200 border-red-500/50",
  };
  return map[estado] ?? "bg-gray-500/20 text-gray-200 border-gray-500/50";
}

/**
 * Tiempo restante estimado: "2h 15min restantes"
 */
export function calcularTiempoRestante(
  inicio: string | null,
  duracionMin: number | null
): string {
  if (!inicio || duracionMin == null || duracionMin <= 0) return "—";
  const start = typeof inicio === "string" ? parseISO(inicio) : inicio;
  const end = new Date(start.getTime() + duracionMin * 60 * 1000);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "Completado";
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 0) return `${h}h ${m}min restantes`;
  return `${m}min restantes`;
}

export function getEstadoLabel(estado: string): string {
  const map: Record<string, string> = {
    cotizacion: "Cotización",
    confirmado: "Confirmado",
    imprimiendo: "Imprimiendo",
    post_proceso: "Post-proceso",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  return map[estado] ?? estado;
}
