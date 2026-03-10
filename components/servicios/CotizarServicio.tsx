"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Servicio } from "@/types/database";

interface CotizarServicioProps {
  servicios: Servicio[];
  vendedorId: string | null;
  vendedorNombre: string;
}

interface ItemLocal {
  descripcion: string;
  cantidad: number;
  horas: number;
  costoFinal: number;
}

export function CotizarServicio({
  servicios,
  vendedorId,
  vendedorNombre,
}: CotizarServicioProps) {
  const router = useRouter();
  const supabase = createClient();
  const [servicioId, setServicioId] = useState("");
  const [horas, setHoras] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [lista, setLista] = useState<ItemLocal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedServicio = servicios.find((s) => s.id === servicioId);
  const costoFinal = selectedServicio
    ? (Number(selectedServicio.tarifa_fija) + Number(selectedServicio.tarifa_por_hora) * horas) * cantidad
    : 0;

  const addToList = () => {
    if (!selectedServicio) {
      setError("Selecciona un servicio.");
      return;
    }
    setLista((prev) => [
      ...prev,
      {
        descripcion: selectedServicio.nombre,
        cantidad,
        horas,
        costoFinal,
      },
    ]);
    setError(null);
  };

  const removeFromList = (index: number) => {
    setLista((prev) => prev.filter((_, i) => i !== index));
  };

  const submitCotizacion = async () => {
    if (lista.length === 0) {
      setError("Añade al menos un ítem.");
      return;
    }
    setLoading(true);
    setError(null);
    const fecha = new Date().toISOString().slice(0, 10);
    const items = lista.map((item) => ({
      vendedor: vendedorNombre,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      horas: item.horas,
      costo_final: item.costoFinal,
      fecha,
    }));
    const { error: err } = await supabase.from("cotizaciones_servicios").insert({
      vendedor_id: vendedorId,
      items,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/dashboard/servicios");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cotización de servicio</h1>
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Servicio</label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="mt-1 rounded border px-3 py-2"
            >
              <option value="">Seleccionar</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Horas</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value) || 0)}
              className="mt-1 w-24 rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value) || 1)}
              className="mt-1 w-24 rounded border px-3 py-2"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Costo final: </span>
            <span className="font-bold">${costoFinal.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={addToList}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Añadir a cotización
          </button>
        </div>
      </div>

      {lista.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 font-medium">Ítems</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-700">Descripción</th>
                <th className="text-right text-sm font-medium text-gray-700">Cantidad</th>
                <th className="text-right text-sm font-medium text-gray-700">Horas</th>
                <th className="text-right text-sm font-medium text-gray-700">Costo final</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{item.descripcion}</td>
                  <td className="py-2 text-right">{item.cantidad}</td>
                  <td className="py-2 text-right">{item.horas}</td>
                  <td className="py-2 text-right">${item.costoFinal.toFixed(2)}</td>
                  <td className="py-2">
                    <button type="button" onClick={() => removeFromList(i)} className="text-red-600 hover:underline">
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submitCotizacion}
            disabled={loading}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Generar cotización"}
          </button>
        </div>
      )}
    </div>
  );
}
