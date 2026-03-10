"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ClienteFormProps {
  id?: string;
  nombre?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

export function ClienteForm({
  id,
  nombre: initialNombre = "",
  correo: initialCorreo = "",
  telefono: initialTelefono = "",
  direccion: initialDireccion = "",
}: ClienteFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState(initialNombre);
  const [correo, setCorreo] = useState(initialCorreo);
  const [telefono, setTelefono] = useState(initialTelefono);
  const [direccion, setDireccion] = useState(initialDireccion);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    if (id) {
      const { error: err } = await supabase
        .from("clientes")
        .update({
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
        })
        .eq("id", id);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("clientes").insert({
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    router.push("/dashboard/clientes");
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
        <label className="block text-sm font-medium text-gray-700">Correo</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Dirección</label>
        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          Guardar
        </button>
        <Link href="/dashboard/clientes" className="rounded border px-4 py-2 hover:bg-gray-50">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
