"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateCost } from "@/lib/calculator";
import type { CalculatorResult, DetallesCotizacion } from "@/lib/calculator";

interface PiezaLocal {
  descripcion: string;
  cantidad: number;
  tiempo_min: number;
  costo_final: number;
  costo_base: number;
  detalles: DetallesCotizacion;
}

interface NuevaCotizacionFormProps {
  vendedorId: string | null;
  vendedorNombre: string;
}

export function NuevaCotizacionForm({
  vendedorId,
  vendedorNombre,
}: NuevaCotizacionFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [descripcion, setDescripcion] = useState("");
  const [horas, setHoras] = useState(0);
  const [minutos, setMinutos] = useState(0);
  const [gramos, setGramos] = useState(0);
  const [limpieza, setLimpieza] = useState(0);
  const [diseno, setDiseno] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [envio, setEnvio] = useState(0);
  const [lista, setLista] = useState<PiezaLocal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const result: CalculatorResult | null =
    descripcion.trim() !== ""
      ? calculateCost({
          horas,
          minutos,
          gramos,
          limpieza,
          diseno,
          cantidad,
          envio,
        })
      : null;

  const addToList = useCallback(() => {
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!result) return;
    setLista((prev) => [
      ...prev,
      {
        descripcion: descripcion.trim(),
        cantidad,
        tiempo_min: result.tiempo_total_min,
        costo_final: result.costo_final_total,
        costo_base: result.costo_base_pieza,
        detalles: result.detalles,
      },
    ]);
    setDescripcion("");
    setError(null);
  }, [descripcion, cantidad, result]);

  const removeFromList = (index: number) => {
    setLista((prev) => prev.filter((_, i) => i !== index));
  };

  const submitCotizar = async () => {
    if (lista.length === 0) {
      setError("Agrega al menos una pieza a la lista.");
      return;
    }
    setLoading(true);
    setError(null);
    const fecha = new Date().toISOString().slice(0, 10);
    for (const p of lista) {
      const { error: insertError } = await supabase
        .from("cotizaciones_en_espera")
        .insert({
          vendedor_id: vendedorId,
          vendedor_nombre: vendedorNombre,
          descripcion: p.descripcion,
          cantidad: p.cantidad,
          costo_base: p.costo_base,
          costo_final: p.costo_final,
          fecha,
          detalles: p.detalles,
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nueva cotización</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-700">
          Datos de impresión
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Horas / Minutos
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={0}
                value={horas}
                onChange={(e) => setHoras(Number(e.target.value) || 0)}
                className="w-20 rounded border border-gray-300 px-3 py-2"
              />
              <input
                type="number"
                min={0}
                value={minutos}
                onChange={(e) => setMinutos(Number(e.target.value) || 0)}
                className="w-20 rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gramos filamento
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={gramos}
              onChange={(e) => setGramos(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Limpieza (min)
            </label>
            <input
              type="number"
              min={0}
              value={limpieza}
              onChange={(e) => setLimpieza(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Diseño (min)
            </label>
            <input
              type="number"
              min={0}
              value={diseno}
              onChange={(e) => setDiseno(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cantidad
            </label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Envío ($)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={envio}
              onChange={(e) => setEnvio(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        {result && (
          <p className="mt-4 text-lg font-semibold text-blue-600">
            Costo final total: ${result.costo_final_total.toFixed(2)}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addToList}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Agregar a la lista
          </button>
        </div>
      </div>

      {lista.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-700">
            Piezas a cotizar
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Descripción
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Cantidad
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Tiempo (min)
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Costo final
                  </th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2">{p.descripcion}</td>
                    <td className="px-4 py-2 text-right">{p.cantidad}</td>
                    <td className="px-4 py-2 text-right">
                      {Math.round(p.tiempo_min)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${p.costo_final.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeFromList(i)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submitCotizar}
            disabled={loading}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Cotizar"}
          </button>
        </div>
      )}
    </div>
  );
}
