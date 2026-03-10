"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils/format";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCards } from "@/components/shared/SkeletonTable";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/config/endpoints";
import { useMemo } from "react";

const DashboardChart = dynamic(
  () => import("@/components/dashboard/DashboardChart").then((m) => m.DashboardChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded bg-[var(--card-bg)]" /> }
);

// Datos semanales/mensuales para la gráfica (ingresos)
async function fetchIngresosChart() {
  const sb = createClient();
  const { data } = await sb
    .from(TABLES.PRODUCTOS)
    .select("costo_final, created_at");
  const list = (data ?? []) as { costo_final: number; created_at: string }[];
  const byWeek: Record<string, number> = {};
  list.forEach((p) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    byWeek[key] = (byWeek[key] ?? 0) + Number(p.costo_final);
  });
  return Object.entries(byWeek)
    .map(([name, ingresos]) => ({ name, ingresos }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-8);
}

export function DashboardERP() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Error al cargar dashboard");
      return res.json();
    },
    staleTime: 1000 * 60,
  });

  const chartQuery = useQuery({
    queryKey: ["dashboard-chart"],
    queryFn: fetchIngresosChart,
    staleTime: 1000 * 60,
  });

  const chartData = useMemo(() => chartQuery.data ?? [], [chartQuery.data]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        No se pudo cargar el dashboard. Ejecuta la migración 002_erp_expansion.sql si aún no existe la tabla pedidos.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonCards count={4} />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--card-bg)]" />
        <div className="h-48 animate-pulse rounded-xl bg-[var(--card-bg)]" />
      </div>
    );
  }

  const { kpis, ultimosPedidos, alertas, usoMaquinas } = data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Pedidos activos" value={kpis.pedidosActivos} icon="📋" />
        <KPICard title="Ingresos del mes" value={formatCurrency(kpis.ingresosMes)} icon="💰" />
        <KPICard
          title="Máquinas activas"
          value={`${kpis.maquinasActivas} / ${kpis.totalMaquinas || "—"}`}
          subtitle="Hoy"
          icon="🖨️"
        />
        <KPICard title="Piezas producidas hoy" value={kpis.piezasHoy} icon="📦" />
      </section>

      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          Ingresos (últimas semanas)
        </h2>
        <DashboardChart data={chartData} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
            Últimos 5 pedidos
          </h2>
          {ultimosPedidos.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No hay pedidos recientes.</p>
          ) : (
            <ul className="space-y-2">
              {ultimosPedidos.map((p: { id: string; descripcion: string; estado: string; monto: number; cliente?: { nombre: string } | null }) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-2 hover:bg-[var(--sidebar-hover)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {p.descripcion}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {p.cliente?.nombre ?? "—"} · {formatCurrency(p.monto)}
                    </p>
                  </div>
                  <StatusBadge estado={p.estado} className="ml-2 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">
              Utilización de máquinas (hoy)
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${usoMaquinas ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {usoMaquinas ?? 0}%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">
              Alertas
            </h2>
            <ul className="space-y-2 text-sm">
              {alertas.stockBajo?.length > 0 && (
                <li className="text-amber-200">
                  📦 Stock bajo: {alertas.stockBajo.map((m: { material: string }) => m.material).join(", ")}
                </li>
              )}
              {alertas.retrasados?.length > 0 && (
                <li className="text-orange-200">
                  ⏱️ Pedidos retrasados: {alertas.retrasados.length}
                </li>
              )}
              {(!alertas.stockBajo?.length && !alertas.retrasados?.length) && (
                <li className="text-[var(--muted)]">Sin alertas</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
