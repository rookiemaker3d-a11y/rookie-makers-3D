"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/calculadoras", label: "Calculadoras" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
  { href: "/dashboard/produccion", label: "Producción" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/inventario", label: "Inventario" },
  { href: "/dashboard/cotizador", label: "Cotizador" },
  { href: "/dashboard/finanzas", label: "Finanzas" },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones en espera" },
  { href: "/dashboard/cotizaciones/nueva", label: "Registro nueva impresión" },
  { href: "/dashboard/productos", label: "Productos autorizados" },
  { href: "/dashboard/servicios", label: "Servicios" },
] as const;

const ADMIN_LINKS = [
  { href: "/dashboard/vendedores", label: "Vendedores" },
  { href: "/dashboard/gastos", label: "Gastos" },
] as const;

export function SidebarNav({
  admin,
  vendedorNombre,
}: {
  admin: boolean;
  vendedorNombre: string | null;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--sidebar-fg)]">
          Rookie Makers 3D
        </h2>
        <ThemeToggle />
      </div>
      <nav className="space-y-0.5">
        {NAV_LINKS.map(({ href, label }) => {
          const exactMatch = pathname === href;
          const childMatch = href !== "/dashboard" && pathname.startsWith(href + "/");
          const isActive = exactMatch || childMatch;
          const isCalculadoras = href === "/dashboard/calculadoras";
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isCalculadoras && isActive
                  ? "bg-[var(--accent)] text-white"
                  : isActive
                    ? "bg-[var(--sidebar-hover)] text-[var(--foreground)]"
                    : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
        {admin &&
          ADMIN_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-[var(--sidebar-hover)] text-[var(--foreground)]" : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
      </nav>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="https://www.facebook.com/people/Rookie-Makers-3D/61578689525453/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--muted)] hover:text-[var(--accent)]"
          title="Facebook"
          aria-label="Facebook"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a
          href="https://www.instagram.com/rookiemakers3d/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--muted)] hover:text-[var(--accent)]"
          title="Instagram"
          aria-label="Instagram"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      </div>
      <div className="mt-auto border-t border-[var(--sidebar-border)] pt-4">
        {vendedorNombre && (
          <p className="text-sm text-[var(--muted)]">{vendedorNombre}</p>
        )}
        <form action="/api/auth/signout" method="post" className="mt-2">
          <button
            type="submit"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
