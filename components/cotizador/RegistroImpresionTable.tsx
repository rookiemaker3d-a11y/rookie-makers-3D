"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateCost } from "@/lib/calculator";
import {
  MARGEN_GANANCIA,
  COSTO_FILAMENTO_BASE,
  COSTO_ENERGIA_BASE,
  COSTO_LIMPIEZA_BASE,
  COSTO_DISENO_BASE,
} from "@/lib/constants";

interface FilaRow {
  id: number;
  descripcion: string;
  horas: number;
  minutos: number;
  gramos: number;
  limpieza: number;
  diseno: number;
  cantidad: number;
  envio: number;
}

const emptyFila = (id: number): FilaRow => ({
  id,
  descripcion: "",
  horas: 0,
  minutos: 0,
  gramos: 0,
  limpieza: 0,
  diseno: 0,
  cantidad: 1,
  envio: 0,
});

interface RegistroImpresionTableProps {
  vendedorId: string | null;
  vendedorNombre: string;
}

export function RegistroImpresionTable({
  vendedorId,
  vendedorNombre,
}: RegistroImpresionTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [nextId, setNextId] = useState(1);
  const [filas, setFilas] = useState<FilaRow[]>([emptyFila(0)]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateFila = useCallback((id: number, field: keyof FilaRow, value: string | number) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }, []);

  const addFila = useCallback(() => {
    setFilas((prev) => [...prev, emptyFila(nextId)]);
    setNextId((n) => n + 1);
  }, [nextId]);

  const removeFila = useCallback((id: number) => {
    setFilas((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const saveCotizaciones = async () => {
    const conDatos = filas.filter((f) => f.descripcion.trim() !== "");
    if (conDatos.length === 0) {
      setError("Agrega al menos una fila con descripción.");
      return;
    }
    setLoading(true);
    setError(null);
    const fecha = new Date().toISOString().slice(0, 10);
    for (const f of conDatos) {
      const result = calculateCost({
        horas: f.horas,
        minutos: f.minutos,
        gramos: f.gramos,
        limpieza: f.limpieza,
        diseno: f.diseno,
        cantidad: f.cantidad,
        envio: f.envio,
      });
      const { error: insertError } = await supabase
        .from("cotizaciones_en_espera")
        .insert({
          vendedor_id: vendedorId,
          vendedor_nombre: vendedorNombre,
          descripcion: f.descripcion.trim(),
          cantidad: f.cantidad,
          costo_base: result.costo_base_pieza,
          costo_final: result.costo_final_total,
          fecha,
          detalles: result.detalles,
        });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    router.push("/dashboard/cotizaciones");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <p className="mb-2 text-sm font-medium text-[var(--muted)]">
          Constantes: MARGEN {(MARGEN_GANANCIA * 100).toFixed(0)}% · Filamento $
          {COSTO_FILAMENTO_BASE} · Energía ${COSTO_ENERGIA_BASE} · Limpieza $
          {COSTO_LIMPIEZA_BASE} · Diseño ${COSTO_DISENO_BASE}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--sidebar-hover)]">
              <th className="whitespace-nowrap px-2 py-2 text-left font-medium text-[var(--foreground)]">
                Descripción
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">H</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Min</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Gramos</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Limp</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Diseño</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Cant</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">Envío</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">C. base</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-[var(--foreground)]">C. final</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <FilaRowEdit
                key={fila.id}
                fila={fila}
                onUpdate={(field, value) => updateFila(fila.id, field, value)}
                onRemove={() => removeFila(fila.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addFila}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sidebar-hover)]"
        >
          + Agregar fila
        </button>
        <button
          type="button"
          onClick={saveCotizaciones}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar en cotizaciones"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function FilaRowEdit({
  fila,
  onUpdate,
  onRemove,
}: {
  fila: FilaRow;
  onUpdate: (field: keyof FilaRow, value: string | number) => void;
  onRemove: () => void;
}) {
  const result = calculateCost({
    horas: fila.horas,
    minutos: fila.minutos,
    gramos: fila.gramos,
    limpieza: fila.limpieza,
    diseno: fila.diseno,
    cantidad: fila.cantidad,
    envio: fila.envio,
  });

  const inputClass =
    "w-full min-w-0 rounded border border-[var(--card-border)] bg-[var(--background)] px-1.5 py-0.5 text-right text-[var(--foreground)]";

  return (
    <tr className="border-b border-[var(--card-border)]">
      <td className="p-1">
        <input
          type="text"
          value={fila.descripcion}
          onChange={(e) => onUpdate("descripcion", e.target.value)}
          className="min-w-[120px] rounded border border-[var(--card-border)] bg-[var(--background)] px-1.5 py-0.5 text-[var(--foreground)]"
          placeholder="Descripción"
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          value={fila.horas || ""}
          onChange={(e) => onUpdate("horas", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          value={fila.minutos || ""}
          onChange={(e) => onUpdate("minutos", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          step={0.1}
          value={fila.gramos || ""}
          onChange={(e) => onUpdate("gramos", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          value={fila.limpieza || ""}
          onChange={(e) => onUpdate("limpieza", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          value={fila.diseno || ""}
          onChange={(e) => onUpdate("diseno", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={fila.cantidad || ""}
          onChange={(e) => onUpdate("cantidad", Number(e.target.value) || 1)}
          className={inputClass}
        />
      </td>
      <td className="p-1">
        <input
          type="number"
          min={0}
          step={0.01}
          value={fila.envio || ""}
          onChange={(e) => onUpdate("envio", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </td>
      <td className="whitespace-nowrap px-2 py-1 text-right text-[var(--foreground)]">
        ${result.costo_base_pieza.toFixed(2)}
      </td>
      <td className="whitespace-nowrap px-2 py-1 text-right font-medium text-[var(--foreground)]">
        ${result.costo_final_total.toFixed(2)}
      </td>
      <td className="p-1">
        <button
          type="button"
          onClick={onRemove}
          className="text-[var(--muted)] hover:text-red-600"
          title="Quitar fila"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
