"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMaquinas } from "@/lib/services/erp.service";
import { calcularTiempoRestante } from "@/lib/utils/format";
import { SkeletonCards } from "@/components/shared/SkeletonTable";
import { EmptyState } from "@/components/shared/EmptyState";

export function ProduccionPageClient() {
  const { data: maquinas = [], isLoading } = useQuery({
    queryKey: ["maquinas"],
    queryFn: fetchMaquinas,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <SkeletonCards count={4} />;
  if (maquinas.length === 0) {
    return (
      <EmptyState
        title="No hay máquinas registradas"
        description="Añade máquinas en la base de datos (tabla maquinas) para ver la cola de impresión."
        icon="🖨️"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--foreground)]">
        Cola de impresión
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {maquinas.map((m: { id: string; nombre: string; estado: string; progreso_porcentaje: number; tiempo_inicio_impresion: string | null; duracion_estimada_min: number | null; pedido_actual?: { descripcion: string } | null }) => (
          <div
            key={m.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--foreground)]">{m.nombre}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  m.estado === "ocupada"
                    ? "bg-yellow-500/20 text-yellow-200"
                    : m.estado === "pausada"
                    ? "bg-orange-500/20 text-orange-200"
                    : "bg-[var(--success)]/20 text-green-200"
                }`}
              >
                {m.estado}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {m.pedido_actual?.descripcion ?? "Sin pedido"}
            </p>
            {m.estado === "ocupada" && (
              <>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${m.progreso_porcentaje ?? 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {calcularTiempoRestante(m.tiempo_inicio_impresion, m.duracion_estimada_min)}
                </p>
              </>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded border border-[var(--card-border)] px-2 py-1 text-xs hover:bg-[var(--sidebar-hover)]"
              >
                Iniciar
              </button>
              <button
                type="button"
                className="rounded border border-[var(--card-border)] px-2 py-1 text-xs hover:bg-[var(--sidebar-hover)]"
              >
                Pausar
              </button>
              <button
                type="button"
                className="rounded border border-[var(--card-border)] px-2 py-1 text-xs hover:bg-[var(--sidebar-hover)]"
              >
                Completar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
