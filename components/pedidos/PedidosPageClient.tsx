"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { fetchPedidos } from "@/lib/services/erp.service";
import { formatCurrency, formatDateShort, getEstadoLabel } from "@/lib/utils/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePedidosStore } from "@/stores/usePedidosStore";
import { toast } from "sonner";
import Link from "next/link";

const ESTADOS = ["cotizacion", "confirmado", "imprimiendo", "post_proceso", "entregado", "cancelado"] as const;

export function PedidosPageClient() {
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const { setSelectedId, setDrawerNuevoOpen } = usePedidosStore();

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", filtroEstado, searchDebounced],
    queryFn: () =>
      fetchPedidos({
        estado: filtroEstado || undefined,
        search: searchDebounced || undefined,
      }),
    staleTime: 1000 * 60,
  });

  const filtered = useMemo(() => pedidos, [pedidos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Buscar por descripción o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)] w-64"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {getEstadoLabel(e)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDrawerNuevoOpen(true)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Nuevo Pedido
          </button>
          <button
            type="button"
            onClick={() => {
              if (filtered.length === 0) {
                toast.info("No hay datos para exportar");
                return;
              }
              const csv = [
                ["ID", "Cliente", "Producto", "Material", "Estado", "Fecha entrega", "Monto"].join(","),
                ...filtered.map((p: { id: string; descripcion: string; material: string | null; estado: string; fecha_entrega: string | null; monto: number; cliente?: { nombre: string } | null }) =>
                  [p.id, (p.cliente as { nombre?: string })?.nombre ?? "", p.descripcion, p.material ?? "", p.estado, p.fecha_entrega ?? "", p.monto].join(",")
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
              toast.success("CSV descargado");
            }}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sidebar-hover)]"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {isLoading && <SkeletonTable rows={8} cols={7} />}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="No hay pedidos"
          description="Crea un pedido o ajusta los filtros."
          action={
            <button
              type="button"
              onClick={() => setDrawerNuevoOpen(true)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
            >
              Nuevo Pedido
            </button>
          }
          icon="📋"
        />
      )}
      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--sidebar-hover)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">ID</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Material</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--foreground)]">Fecha entrega</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--foreground)]">Monto</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: { id: string; descripcion: string; material: string | null; estado: string; fecha_entrega: string | null; monto: number; cliente?: { nombre: string } | null }) => (
                <tr
                  key={p.id}
                  className="cursor-pointer border-b border-[var(--card-border)] hover:bg-[var(--sidebar-hover)]"
                  onClick={() => setSelectedId(p.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{(p.cliente as { nombre?: string })?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{p.descripcion}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{p.material ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--foreground)]">{p.fecha_entrega ? formatDateShort(p.fecha_entrega) : "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--foreground)]">{formatCurrency(p.monto)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/pedidos?id=${p.id}`}
                      className="text-[var(--accent)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer Nuevo Pedido: placeholder; se puede implementar con un modal que llame a createPedido */}
      {/* Modal detalle: usar selectedId y fetchPedidoById */}
    </div>
  );
}
