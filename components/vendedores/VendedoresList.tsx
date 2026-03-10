"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Vendedor } from "@/types/database";

interface VendedoresListProps {
  vendedores: Vendedor[];
}

export function VendedoresList({ vendedores }: VendedoresListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const deleteVendedor = async (id: string) => {
    if (!confirm("¿Eliminar este vendedor?")) return;
    setLoadingId(id);
    await supabase.from("vendedores").delete().eq("id", id);
    setLoadingId(null);
    router.refresh();
  };

  if (vendedores.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-600">
        No hay vendedores. Crea uno desde Nuevo vendedor.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Correo</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Teléfono</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Banco</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cuenta</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {vendedores.map((v) => (
            <tr key={v.id} className="border-t border-gray-100">
              <td className="px-4 py-2">{v.nombre}</td>
              <td className="px-4 py-2">{v.correo}</td>
              <td className="px-4 py-2">{v.telefono ?? "-"}</td>
              <td className="px-4 py-2">{v.banco ?? "-"}</td>
              <td className="px-4 py-2">{v.cuenta ?? "-"}</td>
              <td className="px-4 py-2">
                <Link href={`/dashboard/vendedores/editar/${v.id}`} className="text-blue-600 hover:underline mr-2">
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={loadingId === v.id}
                  onClick={() => deleteVendedor(v.id)}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
