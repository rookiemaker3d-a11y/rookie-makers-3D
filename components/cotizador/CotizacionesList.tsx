"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downloadCotizacionPDF, downloadReciboPDF } from "@/lib/pdf-download";
import type { CotizacionEnEspera } from "@/types/database";

interface CotizacionesListProps {
  cotizaciones: CotizacionEnEspera[];
}

export function CotizacionesList({ cotizaciones }: CotizacionesListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === cotizaciones.length) setSelected(new Set());
    else setSelected(new Set(cotizaciones.map((c) => c.id)));
  };

  const authorizeSale = async () => {
    if (selected.size === 0) {
      setError("Selecciona al menos una cotización.");
      return;
    }
    setLoading(true);
    setError(null);
    const toMove = cotizaciones.filter((c) => selected.has(c.id));
    for (const c of toMove) {
      const { error: insertErr } = await supabase.from("productos").insert({
        vendedor_id: c.vendedor_id,
        vendedor_nombre: c.vendedor_nombre,
        descripcion: c.descripcion,
        costo_base: c.costo_base,
        costo_final: c.costo_final,
        cantidad: c.cantidad,
        detalles: c.detalles ?? {},
      });
      if (insertErr) {
        setError(insertErr.message);
        setLoading(false);
        return;
      }
      const { error: deleteErr } = await supabase
        .from("cotizaciones_en_espera")
        .delete()
        .eq("id", c.id);
      if (deleteErr) {
        setError(deleteErr.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setSelected(new Set());
    router.refresh();
  };

  const deleteSelected = async () => {
    if (selected.size === 0) {
      setError("Selecciona al menos una cotización.");
      return;
    }
    if (!confirm(`¿Eliminar ${selected.size} cotización(es)?`)) return;
    setLoading(true);
    setError(null);
    for (const id of selected) {
      await supabase.from("cotizaciones_en_espera").delete().eq("id", id);
    }
    setSelected(new Set());
    setLoading(false);
    router.refresh();
  };

  const getVendedorInfo = async (vendedorId: string | null) => {
    if (!vendedorId) return { banco: null, cuenta: null };
    const { data } = await supabase
      .from("vendedores")
      .select("banco, cuenta")
      .eq("id", vendedorId)
      .single();
    return {
      banco: (data?.banco as string) ?? null,
      cuenta: (data?.cuenta as string) ?? null,
    };
  };

  const handleGenerarCotizacionPDF = async () => {
    if (selected.size === 0) {
      setError("Selecciona al menos una cotización.");
      return;
    }
    const toExport = cotizaciones.filter((c) => selected.has(c.id));
    const first = toExport[0];
    const vendedorInfo = await getVendedorInfo(first?.vendedor_id ?? null);
    await downloadCotizacionPDF(
      toExport,
      first?.vendedor_nombre ?? "",
      vendedorInfo
    );
  };

  const handleGenerarReciboPDF = async () => {
    if (selected.size === 0) {
      setError("Selecciona al menos una cotización.");
      return;
    }
    const toExport = cotizaciones.filter((c) => selected.has(c.id));
    const first = toExport[0];
    const vendedorInfo = await getVendedorInfo(first?.vendedor_id ?? null);
    await downloadReciboPDF(
      toExport,
      first?.vendedor_nombre ?? "",
      vendedorInfo
    );
  };

  if (cotizaciones.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-[var(--muted)]">
        No hay cotizaciones en espera.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded bg-red-100 p-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={authorizeSale}
          disabled={loading || selected.size === 0}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          Autorizar venta
        </button>
        <button
          type="button"
          onClick={handleGenerarCotizacionPDF}
          disabled={loading || selected.size === 0}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          Generar cotización PDF
        </button>
        <button
          type="button"
          onClick={handleGenerarReciboPDF}
          disabled={loading || selected.size === 0}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          Generar recibo PDF
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          disabled={loading || selected.size === 0}
          className="rounded-lg border border-red-300 bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Eliminar
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-[var(--foreground)] hover:bg-[var(--sidebar-hover)]"
        >
          {selected.size === cotizaciones.length ? "Desmarcar" : "Seleccionar todo"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
        <table className="min-w-full divide-y divide-[var(--card-border)]">
          <thead>
            <tr>
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={
                    cotizaciones.length > 0 &&
                    selected.size === cotizaciones.length
                  }
                  onChange={selectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">
                Descripción
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                Cantidad
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                Costo base
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                Costo final
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">
                Vendedor
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-[var(--foreground)]">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c) => (
              <tr key={c.id} className="border-t border-[var(--card-border)] hover:bg-[var(--sidebar-hover)]">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-2 text-[var(--foreground)]">{c.descripcion}</td>
                <td className="px-4 py-2 text-right text-[var(--foreground)]">{c.cantidad}</td>
                <td className="px-4 py-2 text-right text-[var(--foreground)]">
                  ${Number(c.costo_base).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--foreground)]">
                  ${Number(c.costo_final).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-[var(--foreground)]">{c.vendedor_nombre}</td>
                <td className="px-4 py-2 text-[var(--foreground)]">{c.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
