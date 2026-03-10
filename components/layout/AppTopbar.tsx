"use client";

export function AppTopbar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-[var(--card-border)] bg-[var(--card-bg)] px-6">
      <h1 className="text-base font-semibold text-[var(--foreground)] md:text-lg">
        {title ?? "Dashboard"}
      </h1>
    </header>
  );
}
