"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMateriales } from "@/lib/services/erp.service";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { EmptyState } from "@/components/shared/EmptyState";

export function InventarioPageClient() {
  const { data: materiales = [], isLoading } = useQuery({
    queryKey: ["materiales"],
    queryFn: fetchMateriales,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <SkeletonTable rows={6} cols={5} />;
  if (materiales.length === 0) {
    return (
      <EmptyState
        title="No hay materiales registrados"
        description="Añade filamentos en la tabla materiales para ver inventario y punto de reorden."
        icon="📦"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--foreground)]">
        Filamentos
      </h2>
      <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--sidebar-hover)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Material</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Color</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--foreground)]">Kg disponibles</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--foreground)]">Punto reorden</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Proveedor</th>
              <th className="px-4 py-3 w-48">Stock</th>
            </tr>
          </thead>
          <tbody>
            {materiales.map((m: { id: string; material: string; color: string | null; kg_disponibles: number; punto_reorden: number; proveedor: string | null }) => {
              const pct = m.punto_reorden > 0 ? (m.kg_disponibles / m.punto_reorden) * 100 : 100;
              const colorBar =
                pct <= 0 ? "bg-red-500" : pct < 100 ? "bg-yellow-500" : "bg-[var(--success)]";
              return (
                <tr key={m.id} className="border-b border-[var(--card-border)] hover:bg-[var(--sidebar-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{m.material}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{m.color ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[var(--foreground)]">{m.kg_disponibles}</td>
                  <td className="px-4 py-3 text-right text-[var(--foreground)]">{m.punto_reorden}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{m.proveedor ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
                      <div
                        className={`h-full rounded-full ${colorBar}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
