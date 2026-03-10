"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/config/endpoints";
import { formatCurrency } from "@/lib/utils/format";
import { KPICard } from "@/components/shared/KPICard";
import { SkeletonCards } from "@/components/shared/SkeletonTable";

export function FinanzasPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["finanzas-mes"],
    queryFn: async () => {
      const sb = createClient();
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
      const [productosRes, gastosRes] = await Promise.all([
        sb.from(TABLES.PRODUCTOS).select("costo_final, created_at").gte("created_at", start).lte("created_at", end),
        sb.from(TABLES.GASTOS).select("monto, fecha").gte("fecha", start).lte("fecha", end),
      ]);
      const ingresos = (productosRes.data ?? []).reduce((s: number, p: { costo_final: number }) => s + Number(p.costo_final), 0);
      const egresos = (gastosRes.data ?? []).reduce((s: number, g: { monto: number }) => s + Number(g.monto), 0);
      return { ingresos, egresos, metaMensual: 50000 };
    },
    staleTime: 1000 * 60,
  });

  if (isLoading || !data) return <SkeletonCards count={4} />;

  const { ingresos, egresos, metaMensual } = data;
  const pendiente = metaMensual - ingresos;
  const progresoMeta = Math.min(100, (ingresos / metaMensual) * 100);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Ingresos del mes" value={formatCurrency(ingresos)} icon="💰" />
        <KPICard title="Egresos del mes" value={formatCurrency(egresos)} icon="📉" />
        <KPICard title="Pendiente de cobro" value={formatCurrency(Math.max(0, pendiente))} subtitle="Meta mensual" icon="📋" />
        <KPICard title="Meta mensual" value={formatCurrency(metaMensual)} icon="🎯" />
      </section>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Progreso meta</h3>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progresoMeta}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {progresoMeta.toFixed(0)}% de la meta
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sidebar-hover)]"
      >
        Exportar reporte mensual PDF
      </button>
    </div>
  );
}
