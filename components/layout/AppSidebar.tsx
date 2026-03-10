"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: "📋" },
  { href: "/dashboard/produccion", label: "Producción", icon: "🖨️" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👥" },
  { href: "/dashboard/inventario", label: "Inventario", icon: "📦" },
  { href: "/dashboard/cotizador", label: "Cotizador", icon: "🧮" },
  { href: "/dashboard/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/dashboard/calculadoras", label: "Calculadoras", icon: "🔢" },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: "📄" },
  { href: "/dashboard/cotizaciones/nueva", label: "Registro impresión", icon: "✏️" },
  { href: "/dashboard/productos", label: "Productos", icon: "✅" },
  { href: "/dashboard/servicios", label: "Servicios", icon: "⚙️" },
];

export function AppSidebar({
  admin,
  vendedorNombre,
}: {
  admin: boolean;
  vendedorNombre: string | null;
}) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      style={{ width: collapsed ? 60 : 240 }}
      className="flex shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-[width] duration-150 ease-out"
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--sidebar-border)] px-3">
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-[var(--sidebar-fg)]">
            Rookie Makers 3D
          </span>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"
              } ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? label : undefined}
            >
              <span className="text-base shrink-0">{icon}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
        {admin && (
          <>
            <div className="my-2 border-t border-[var(--sidebar-border)]" />
            <Link
              href="/dashboard/vendedores"
              prefetch
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--sidebar-hover)] ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? "Vendedores" : undefined}
            >
              <span>👤</span>
              {!collapsed && <span>Vendedores</span>}
            </Link>
            <Link
              href="/dashboard/gastos"
              prefetch
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--sidebar-hover)] ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? "Gastos" : undefined}
            >
              <span>📉</span>
              {!collapsed && <span>Gastos</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="border-t border-[var(--sidebar-border)] p-2">
        {vendedorNombre && !collapsed && (
          <p className="truncate px-2 py-1 text-xs text-[var(--muted)]">{vendedorNombre}</p>
        )}
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className={`w-full rounded-lg py-2 text-sm text-[var(--accent)] hover:bg-[var(--sidebar-hover)] ${collapsed ? "px-0" : "px-3"}`}
          >
            {collapsed ? "🚪" : "Cerrar sesión"}
          </button>
        </form>
      </div>
    </aside>
  );
}
