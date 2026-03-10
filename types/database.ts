export interface Vendedor {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  banco: string | null;
  cuenta: string | null;
  created_at?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  created_at?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  tarifa_fija: number;
  tarifa_por_hora: number;
  created_at?: string;
}

export interface DetallesCotizacion {
  tiempo_total?: number;
  costo_filamento?: number;
  costo_energia?: number;
  costo_limpieza?: number;
  costo_diseno?: number;
  costo_envio?: number;
}

export interface CotizacionEnEspera {
  id: string;
  vendedor_id: string | null;
  vendedor_nombre: string;
  descripcion: string;
  cantidad: number;
  costo_base: number;
  costo_final: number;
  fecha: string;
  detalles: DetallesCotizacion | null;
  created_at?: string;
}

export interface Producto {
  id: string;
  vendedor_id: string | null;
  vendedor_nombre: string | null;
  descripcion: string;
  costo_base: number;
  costo_final: number;
  cantidad: number;
  detalles: DetallesCotizacion | null;
  created_at?: string;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  vendedor_id: string | null;
  notas: string | null;
  created_at?: string;
}

export interface ItemCotizacionServicio {
  vendedor?: string;
  descripcion: string;
  cantidad: number;
  horas: number;
  costo_final: number;
  fecha?: string;
}

export interface CotizacionServicio {
  id: string;
  vendedor_id: string | null;
  items: ItemCotizacionServicio[];
  created_at?: string;
}
