"use client";

import { usePathname } from "next/navigation";
import { AppTopbar } from "./AppTopbar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/pedidos": "Pedidos",
  "/dashboard/produccion": "Producción",
  "/dashboard/clientes": "Clientes",
  "/dashboard/inventario": "Inventario",
  "/dashboard/cotizador": "Cotizador",
  "/dashboard/finanzas": "Finanzas",
  "/dashboard/calculadoras": "Calculadoras",
  "/dashboard/cotizaciones": "Cotizaciones en espera",
  "/dashboard/cotizaciones/nueva": "Registro nueva impresión",
  "/dashboard/productos": "Productos autorizados",
  "/dashboard/servicios": "Servicios",
  "/dashboard/vendedores": "Vendedores",
  "/dashboard/gastos": "Gastos",
};

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/dashboard/cotizaciones/nueva")) return "Registro nueva impresión";
  if (pathname.startsWith("/dashboard/servicios/cotizar")) return "Cotización de servicio";
  return "Dashboard";
}

export function DashboardTopbar() {
  const pathname = usePathname();
  return <AppTopbar title={getTitle(pathname)} />;
}
