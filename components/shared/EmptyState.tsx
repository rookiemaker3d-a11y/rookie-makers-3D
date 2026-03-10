"use client";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] py-12 px-4">
      {icon && <span className="mb-3 text-4xl opacity-60">{icon}</span>}
      <h3 className="text-center text-sm font-medium text-[var(--foreground)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
