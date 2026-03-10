"use client";

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-[var(--card-border)]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--sidebar-hover)]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-[var(--card-border)]">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div
                    className="h-4 animate-pulse rounded bg-[var(--sidebar-hover)]"
                    style={{ width: c === 0 ? "60%" : "40%" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
        >
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--sidebar-hover)]" />
          <div className="mt-2 h-8 w-24 animate-pulse rounded bg-[var(--sidebar-hover)]" />
        </div>
      ))}
    </div>
  );
}
