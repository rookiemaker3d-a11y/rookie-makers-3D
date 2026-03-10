"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Gasto } from "@/types/database";

interface GastosListProps {
  gastos: Gasto[];
  isAdmin: boolean;
  vendedorId: string | null;
}

export function GastosList({ gastos, isAdmin, vendedorId }: GastosListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deleteGasto = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    setLoadingId(id);
    await supabase.from("gastos").delete().eq("id", id);
    setLoadingId(null);
    router.refresh();
  };

  const submitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monto);
    if (!concepto.trim() || isNaN(m)) {
      setError("Concepto y monto son obligatorios.");
      return;
    }
    setError(null);
    const { error: err } = await supabase.from("gastos").insert({
      concepto: concepto.trim(),
      monto: m,
      fecha,
      vendedor_id: isAdmin ? null : vendedorId,
      notas: notas.trim() || null,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setFormOpen(false);
    setConcepto("");
    setMonto("");
    setNotas("");
    router.refresh();
  };

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Nuevo gasto
        </button>
        <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
      </div>

      {formOpen && (
        <form onSubmit={submitGasto} className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-medium">Nuevo gasto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Concepto</label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                step={0.01}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              Guardar
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {gastos.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-600">
          No hay gastos registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Concepto</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Monto</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notas</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{g.fecha}</td>
                  <td className="px-4 py-2">{g.concepto}</td>
                  <td className="px-4 py-2 text-right">${Number(g.monto).toFixed(2)}</td>
                  <td className="px-4 py-2">{g.notas ?? "-"}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={loadingId === g.id}
                      onClick={() => deleteGasto(g.id)}
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
      )}
    </div>
  );
}
