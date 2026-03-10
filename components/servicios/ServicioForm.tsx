"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ServicioFormProps {
  id?: string;
  nombre?: string;
  tarifaFija?: number;
  tarifaPorHora?: number;
}

export function ServicioForm({
  id,
  nombre: initialNombre = "",
  tarifaFija: initialTarifaFija = 0,
  tarifaPorHora: initialTarifaPorHora = 0,
}: ServicioFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState(initialNombre);
  const [tarifaFija, setTarifaFija] = useState(initialTarifaFija.toString());
  const [tarifaPorHora, setTarifaPorHora] = useState(initialTarifaPorHora.toString());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tf = parseFloat(tarifaFija);
    const tph = parseFloat(tarifaPorHora);
    if (!nombre.trim() || isNaN(tf) || isNaN(tph)) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    setError(null);
    if (id) {
      const { error: err } = await supabase
        .from("servicios")
        .update({ nombre: nombre.trim(), tarifa_fija: tf, tarifa_por_hora: tph })
        .eq("id", id);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from("servicios")
        .insert({ nombre: nombre.trim(), tarifa_fija: tf, tarifa_por_hora: tph });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    router.push("/dashboard/servicios");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tarifa fija ($)</label>
        <input
          type="number"
          step={0.01}
          value={tarifaFija}
          onChange={(e) => setTarifaFija(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tarifa por hora ($)</label>
        <input
          type="number"
          step={0.01}
          value={tarifaPorHora}
          onChange={(e) => setTarifaPorHora(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          Guardar
        </button>
        <Link href="/dashboard/servicios" className="rounded border px-4 py-2 hover:bg-gray-50">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
