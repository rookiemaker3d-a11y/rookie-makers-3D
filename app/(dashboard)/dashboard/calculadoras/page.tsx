import Link from "next/link";
import { getVendedorId, getVendedorNombre } from "@/lib/auth";
import { RegistroImpresionTable } from "@/components/cotizador/RegistroImpresionTable";

export default async function CalculadorasPage() {
  const vendedorId = await getVendedorId();
  const vendedorNombre = (await getVendedorNombre()) ?? "Administrador";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
          Calculadoras
        </h1>
        <p className="text-[var(--muted)]">
          Registro de impresión 3D — misma lógica que el Excel: horas, gramos,
          limpieza, diseño. Costo base y costo final por fila.
        </p>
      </div>

      <RegistroImpresionTable
        vendedorId={vendedorId}
        vendedorNombre={vendedorNombre}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/servicios/cotizar"
          className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--accent)]"
        >
          <span className="text-2xl">⚙️</span>
          <div>
            <span className="font-medium text-[var(--foreground)]">
              Cotización de servicio
            </span>
            <p className="text-sm text-[var(--muted)]">
              Tarifa fija + por hora
            </p>
          </div>
          <span className="ml-auto text-[var(--accent)]">→</span>
        </Link>
        <Link
          href="/dashboard/cotizaciones"
          className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--accent)]"
        >
          <span className="text-2xl">📋</span>
          <div>
            <span className="font-medium text-[var(--foreground)]">
              Cotizaciones en espera
            </span>
            <p className="text-sm text-[var(--muted)]">
              Ver y gestionar guardadas
            </p>
          </div>
          <span className="ml-auto text-[var(--accent)]">→</span>
        </Link>
      </div>
    </div>
  );
}
