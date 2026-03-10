"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Producto } from "@/types/database";

interface ProductosListProps {
  productos: Producto[];
}

export function ProductosList({ productos }: ProductosListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importDesc, setImportDesc] = useState("");
  const [importCostoProd, setImportCostoProd] = useState("");
  const [importCostoFinal, setImportCostoFinal] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const totalCosto = productos.reduce((acc, p) => {
    const envio = (p.detalles as { costo_envio?: number } | null)?.costo_envio ?? 0;
    return acc + Number(p.costo_base) + envio;
  }, 0);
  const totalVenta = productos.reduce((acc, p) => acc + Number(p.costo_final), 0);
  const gananciaNeta = totalVenta - totalCosto;

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setLoading(id);
    await supabase.from("productos").delete().eq("id", id);
    setLoading(null);
    router.refresh();
  };

  const submitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = importDesc.trim();
    const costoProd = parseFloat(importCostoProd);
    const costoFinal = parseFloat(importCostoFinal);
    if (!desc || isNaN(costoProd) || isNaN(costoFinal)) {
      setImportError("Completa todos los campos con valores válidos.");
      return;
    }
    setImportError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("users_roles")
      .select("vendedor_id, vendedores(nombre)")
      .eq("user_id", user.id)
      .single();
    const vendedorId = (profile as { vendedor_id?: string })?.vendedor_id ?? null;
    const rawVendedores = (profile as { vendedores?: { nombre: string } | { nombre: string }[] })?.vendedores;
    const vendedorNombre =
      (Array.isArray(rawVendedores) ? rawVendedores[0]?.nombre : rawVendedores?.nombre) ?? "Importado";
    const { error } = await supabase.from("productos").insert({
      vendedor_id: vendedorId,
      vendedor_nombre: vendedorNombre,
      descripcion: desc,
      costo_base: costoProd,
      costo_final: costoFinal,
      cantidad: 1,
      detalles: {},
    });
    if (error) {
      setImportError(error.message);
      return;
    }
    setImportOpen(false);
    setImportDesc("");
    setImportCostoProd("");
    setImportCostoFinal("");
    router.refresh();
  };

  if (productos.length === 0 && !importOpen) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-600">
          No hay productos autorizados. Autoriza ventas desde Cotizaciones en espera o importa una venta.
        </p>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Importar venta
        </button>
        {importOpen && (
          <form onSubmit={submitImport} className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 font-medium">Importar venta</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Descripción"
                value={importDesc}
                onChange={(e) => setImportDesc(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
              <input
                type="number"
                step={0.01}
                placeholder="Costo de producción"
                value={importCostoProd}
                onChange={(e) => setImportCostoProd(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
              <input
                type="number"
                step={0.01}
                placeholder="Costo final de venta"
                value={importCostoFinal}
                onChange={(e) => setImportCostoFinal(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            {importError && <p className="text-sm text-red-600">{importError}</p>}
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white">
                Guardar
              </button>
              <button type="button" onClick={() => setImportOpen(false)} className="rounded border px-4 py-2">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Importar venta
        </button>
      </div>

      {importOpen && (
        <form onSubmit={submitImport} className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 font-medium">Importar venta</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Descripción"
              value={importDesc}
              onChange={(e) => setImportDesc(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="number"
              step={0.01}
              placeholder="Costo de producción"
              value={importCostoProd}
              onChange={(e) => setImportCostoProd(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="number"
              step={0.01}
              placeholder="Costo final de venta"
              value={importCostoFinal}
              onChange={(e) => setImportCostoFinal(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          {importError && <p className="text-sm text-red-600">{importError}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white">
              Guardar
            </button>
            <button type="button" onClick={() => setImportOpen(false)} className="rounded border px-4 py-2">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Total Costo</p>
          <p className="text-xl font-bold">${totalCosto.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Total Venta</p>
          <p className="text-xl font-bold">${totalVenta.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Ganancia Neta</p>
          <p className={`text-xl font-bold ${gananciaNeta >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${gananciaNeta.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Descripción</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Costo producción</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Costo final</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Ganancia</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const envio = (p.detalles as { costo_envio?: number } | null)?.costo_envio ?? 0;
              const ganancia = Number(p.costo_final) - (Number(p.costo_base) + envio);
              return (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{p.descripcion}</td>
                  <td className="px-4 py-2 text-right">${Number(p.costo_base).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">${Number(p.costo_final).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">${ganancia.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={loading === p.id}
                      onClick={() => deleteProduct(p.id)}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
