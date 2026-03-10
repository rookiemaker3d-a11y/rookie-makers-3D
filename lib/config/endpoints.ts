// Endpoints del ERP — constantes centralizadas (Supabase = tablas)
// Si en el futuro se usa API REST externa, se cambian aquí.

export const TABLES = {
  PEDIDOS: "pedidos",
  CLIENTES: "clientes",
  MAQUINAS: "maquinas",
  MATERIALES: "materiales",
  MATERIAL_USO: "material_uso",
  MATERIAL_COMPRAS: "material_compras",
  MAQUINA_LOGS: "maquina_logs",
  COTIZACIONES_EN_ESPERA: "cotizaciones_en_espera",
  PRODUCTOS: "productos",
  GASTOS: "gastos",
  RECIBOS_VENTA: "recibos_venta",
  VENDEDORES: "vendedores",
} as const;
