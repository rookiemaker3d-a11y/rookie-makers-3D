"use client";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  delay?: number;
}

export function KPICard({ title, value, subtitle, icon }: KPICardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-80" aria-hidden>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
