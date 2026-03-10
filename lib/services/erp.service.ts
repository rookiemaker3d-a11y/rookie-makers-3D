/**
 * Capa de abstracción ERP — todas las llamadas a datos pasan por aquí.
 * Actualmente usa Supabase; si en el futuro hay API REST externa, se cambia solo este archivo.
 */
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/config/endpoints";
import type { Pedido, Cliente, Maquina, Material } from "@/lib/types";

const getSupabase = () => createClient();

// ——— Pedidos ———
export async function fetchPedidos(opts?: {
  estado?: string;
  material?: string;
  desde?: string;
  hasta?: string;
  search?: string;
}) {
  const sb = getSupabase();
  try {
    let q = sb
      .from(TABLES.PEDIDOS)
      .select("*, cliente:clientes(nombre, correo, empresa)")
      .order("created_at", { ascending: false });

    if (opts?.estado) q = q.eq("estado", opts.estado);
    if (opts?.material) q = q.eq("material", opts.material);
    if (opts?.desde) q = q.gte("fecha_entrega", opts.desde);
    if (opts?.hasta) q = q.lte("fecha_entrega", opts.hasta);
    if (opts?.search) {
      q = q.or(
        `descripcion.ilike.%${opts.search}%,id.ilike.%${opts.search}%`
      );
    }
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as (Pedido & { cliente?: { nombre: string; correo: string; empresa: string | null } | null })[];
  } catch {
    return [];
  }
}

export async function fetchPedidoById(id: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLES.PEDIDOS)
    .select("*, cliente:clientes(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Pedido & { cliente?: Cliente | null };
}

export async function createPedido(payload: Partial<Pedido>) {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLES.PEDIDOS).insert(payload).select().single();
  if (error) throw error;
  return data as Pedido;
}

export async function updatePedido(id: string, payload: Partial<Pedido>) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLES.PEDIDOS)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Pedido;
}

export async function deletePedido(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from(TABLES.PEDIDOS).delete().eq("id", id);
  if (error) throw error;
}

// ——— Clientes ———
export async function fetchClientes() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLES.CLIENTES)
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function fetchClienteById(id: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLES.CLIENTES).select("*").eq("id", id).single();
  if (error) throw error;
  return data as Cliente;
}

export async function updateCliente(id: string, payload: Partial<Cliente>) {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLES.CLIENTES).update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Cliente;
}

// ——— Máquinas ———
export async function fetchMaquinas() {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from(TABLES.MAQUINAS)
      .select("*, pedido_actual:pedidos(*)")
      .order("nombre");
    if (error) return [];
    return (data ?? []) as (Maquina & { pedido_actual?: Pedido | null })[];
  } catch {
    return [];
  }
}

export async function updateMaquina(id: string, payload: Partial<Maquina>) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLES.MAQUINAS)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Maquina;
}

// ——— Materiales / Inventario ———
export async function fetchMateriales() {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLES.MATERIALES).select("*").order("material");
  if (error) throw error;
  return (data ?? []) as Material[];
}

export async function updateMaterial(id: string, payload: Partial<Material>) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLES.MATERIALES)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Material;
}

// ——— KPIs Dashboard (usa tablas existentes + pedidos) ———
export async function fetchKPIs(): Promise<{
  pedidosActivos: number;
  ingresosMes: number;
  maquinasActivas: number;
  piezasHoy: number;
  totalMaquinas: number;
}> {
  const sb = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  try {
    const [pedidosRes, productosRes, maquinasRes] = await Promise.allSettled([
      sb.from(TABLES.PEDIDOS).select("id, estado, monto, created_at", { count: "exact" }),
      sb.from(TABLES.PRODUCTOS).select("costo_final, created_at"),
      sb.from(TABLES.MAQUINAS).select("id, estado"),
    ]);

    const pedidos = (pedidosRes.status === "fulfilled" ? pedidosRes.value.data ?? [] : []) as { id: string; estado: string; monto: number; created_at: string }[];
    const productos = (productosRes.status === "fulfilled" ? productosRes.value.data ?? [] : []) as { costo_final: number; created_at: string }[];
    const maquinas = (maquinasRes.status === "fulfilled" ? maquinasRes.value.data ?? [] : []) as { id: string; estado: string }[];

    const pedidosActivos = pedidos.filter(
      (p) => ["cotizacion", "confirmado", "imprimiendo", "post_proceso"].includes(p.estado)
    ).length;
    const ingresosMes = productos
      .filter((p) => p.created_at.startsWith(startOfMonth.slice(0, 7)))
      .reduce((s, p) => s + Number(p.costo_final), 0);
    const maquinasActivas = maquinas.filter((m) => m.estado === "ocupada" || m.estado === "pausada").length;
    const piezasHoy = productos.filter((p) => p.created_at.startsWith(today)).length;

    return {
      pedidosActivos,
      ingresosMes,
      maquinasActivas,
      piezasHoy,
      totalMaquinas: maquinas.length,
    };
  } catch {
    return {
      pedidosActivos: 0,
      ingresosMes: 0,
      maquinasActivas: 0,
      piezasHoy: 0,
      totalMaquinas: 0,
    };
  }
}

// Últimos 5 pedidos para dashboard
export async function fetchUltimosPedidos(limit = 5) {
  const sb = getSupabase();
  try {
    const { data, error } = await sb
      .from(TABLES.PEDIDOS)
      .select("id, descripcion, estado, monto, fecha_entrega, created_at, cliente:clientes(nombre)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as (Pedido & { cliente?: { nombre: string } | null })[];
  } catch {
    return [];
  }
}

// Alertas: stock bajo, pedidos retrasados
export async function fetchAlertas(): Promise<{
  stockBajo: { id: string; material: string; color: string | null; kg_disponibles: number; punto_reorden: number }[];
  retrasados: { id: string; descripcion: string; fecha_entrega: string | null; estado: string }[];
}> {
  const sb = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [materialesRes, pedidosRes] = await Promise.allSettled([
      sb.from(TABLES.MATERIALES).select("id, material, color, kg_disponibles, punto_reorden"),
      sb.from(TABLES.PEDIDOS).select("id, descripcion, fecha_entrega, estado").lt("fecha_entrega", today).neq("estado", "entregado").neq("estado", "cancelado"),
    ]);
    const materiales = (materialesRes.status === "fulfilled" ? materialesRes.value.data ?? [] : []) as { id: string; material: string; color: string | null; kg_disponibles: number; punto_reorden: number }[];
    const pedidos = (pedidosRes.status === "fulfilled" ? pedidosRes.value.data ?? [] : []) as { id: string; descripcion: string; fecha_entrega: string | null; estado: string }[];
    const stockBajo = materiales.filter((m) => m.kg_disponibles <= m.punto_reorden && m.punto_reorden > 0);
    return { stockBajo, retrasados: pedidos };
  } catch {
    return { stockBajo: [], retrasados: [] };
  }
}
