export function StatsCards({
  totalVenta,
  totalCosto,
  gananciaNeta,
}: {
  totalVenta: number;
  totalCosto: number;
  gananciaNeta: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h3 className="text-sm font-medium text-[var(--muted)]">Total Venta</h3>
        <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          ${totalVenta.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h3 className="text-sm font-medium text-[var(--muted)]">Total Costo</h3>
        <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          ${totalCosto.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h3 className="text-sm font-medium text-[var(--muted)]">Ganancia Neta</h3>
        <p
          className={`mt-2 text-2xl font-bold ${
            gananciaNeta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          ${gananciaNeta.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
