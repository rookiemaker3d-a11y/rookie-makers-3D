"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [vendedorNombre, setVendedorNombre] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setAdmin(data.admin ?? false);
        setVendedorNombre(data.vendedorNombre ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4">
        <SidebarNav admin={admin} vendedorNombre={vendedorNombre} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar />
        <main className="min-h-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
