"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Servicio } from "@/types/database";

interface ServiciosListProps {
  servicios: Servicio[];
  isAdmin: boolean;
}

export function ServiciosList({ servicios, isAdmin }: ServiciosListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const deleteServicio = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    setLoadingId(id);
    await supabase.from("servicios").delete().eq("id", id);
    setLoadingId(null);
    router.refresh();
  };

  if (servicios.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-600">
        No hay servicios. {isAdmin && "Crea uno desde Nuevo servicio."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Tarifa fija</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Tarifa por hora</th>
            {isAdmin && <th className="px-4 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {servicios.map((s) => (
            <tr key={s.id} className="border-t border-gray-100">
              <td className="px-4 py-2">{s.nombre}</td>
              <td className="px-4 py-2 text-right">${Number(s.tarifa_fija).toFixed(2)}</td>
              <td className="px-4 py-2 text-right">${Number(s.tarifa_por_hora).toFixed(2)}</td>
              {isAdmin && (
                <td className="px-4 py-2">
                  <Link href={`/dashboard/servicios/editar/${s.id}`} className="text-blue-600 hover:underline mr-2">
                    Editar
                  </Link>
                  <button
                    type="button"
                    disabled={loadingId === s.id}
                    onClick={() => deleteServicio(s.id)}
                    className="text-red-600 hover:underline disabled:opacity-50"
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
