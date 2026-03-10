"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Cliente } from "@/types/database";

interface ClientesListProps {
  clientes: Cliente[];
  isAdmin: boolean;
}

export function ClientesList({ clientes, isAdmin }: ClientesListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const deleteCliente = async (id: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    setLoadingId(id);
    await supabase.from("clientes").delete().eq("id", id);
    setLoadingId(null);
    router.refresh();
  };

  if (clientes.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-[var(--muted)]">
        No hay clientes. {isAdmin && "Crea uno desde Nuevo cliente."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
      <table className="min-w-full divide-y divide-[var(--card-border)]">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">Nombre</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">Correo</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">Teléfono</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">Dirección</th>
            {isAdmin && <th className="px-4 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-[var(--card-border)]">
              <td className="px-4 py-2 text-[var(--foreground)]">{c.nombre}</td>
              <td className="px-4 py-2 text-[var(--foreground)]">{c.correo}</td>
              <td className="px-4 py-2 text-[var(--foreground)]">{c.telefono ?? "-"}</td>
              <td className="px-4 py-2 text-[var(--foreground)]">{c.direccion ?? "-"}</td>
              {isAdmin && (
                <td className="px-4 py-2">
                  <Link href={`/dashboard/clientes/editar/${c.id}`} className="mr-2 text-[var(--accent)] hover:underline">
                    Editar
                  </Link>
                  <button
                    type="button"
                    disabled={loadingId === c.id}
                    onClick={() => deleteCliente(c.id)}
                    className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
