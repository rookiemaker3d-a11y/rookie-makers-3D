// Tipos del ERP — dominio 3D printing

export type EstadoPedido =
  | "cotizacion"
  | "confirmado"
  | "imprimiendo"
  | "post_proceso"
  | "entregado"
  | "cancelado";

export interface Pedido {
  id: string;
  cliente_id: string | null;
  vendedor_id: string | null;
  descripcion: string;
  material: string | null;
  estado: EstadoPedido;
  fecha_entrega: string | null;
  monto: number;
  cantidad: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente | null;
}

export interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  empresa: string | null;
  segmento: string | null;
  notas_internas: string | null;
  created_at: string;
  total_pedidos?: number;
  monto_acumulado?: number;
  ultimo_pedido?: string | null;
}

export type EstadoMaquina = "libre" | "ocupada" | "pausada" | "mantenimiento";

export interface Maquina {
  id: string;
  nombre: string;
  estado: EstadoMaquina;
  pedido_actual_id: string | null;
  progreso_porcentaje: number;
  tiempo_inicio_impresion: string | null;
  duracion_estimada_min: number | null;
  created_at: string;
  updated_at: string;
  pedido_actual?: Pedido | null;
}

export interface Material {
  id: string;
  material: string;
  color: string | null;
  kg_disponibles: number;
  punto_reorden: number;
  proveedor: string | null;
  unidad: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialUso {
  id: string;
  material_id: string;
  pedido_id: string | null;
  kg_usados: number;
  created_at: string;
}

export interface MaterialCompra {
  id: string;
  material_id: string;
  kg: number;
  costo_total: number | null;
  fecha: string;
  notas: string | null;
  created_at: string;
}

export interface KPI {
  pedidosActivos: number;
  ingresosMes: number;
  maquinasActivas: number;
  piezasHoy: number;
}

export type SegmentoCliente = "Universitario" | "Industrial" | "Recurrente" | null;
