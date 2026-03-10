"use client";

import { useState, useMemo } from "react";
import { formatCurrency, calcularMargen } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

// Constantes ejemplo (se pueden mover a config)
const COSTO_HORA_MAQUINA = 50;
const COSTO_HORA_DISENO = 80;
const COSTO_MATERIAL_POR_GRAMO = 0.5;

export function CotizadorPageClient() {
  const router = useRouter();
  const [material, setMaterial] = useState("");
  const [tiempoImpresionMin, setTiempoImpresionMin] = useState(0);
  const [horasDiseno, setHorasDiseno] = useState(0);
  const [gramos, setGramos] = useState(0);
  const [margenDeseado, setMargenDeseado] = useState(50);

  const costoMaterial = useMemo(() => gramos * COSTO_MATERIAL_POR_GRAMO, [gramos]);
  const costoMaquina = useMemo(
    () => (tiempoImpresionMin / 60) * COSTO_HORA_MAQUINA,
    [tiempoImpresionMin]
  );
  const costoDiseno = useMemo(() => horasDiseno * COSTO_HORA_DISENO, [horasDiseno]);
  const costoTotal = useMemo(
    () => costoMaterial + costoMaquina + costoDiseno,
    [costoMaterial, costoMaquina, costoDiseno]
  );
  const precioSugerido = useMemo(
    () => (costoTotal * (100 + margenDeseado)) / 100,
    [costoTotal, margenDeseado]
  );
  const margenReal = useMemo(
    () => calcularMargen(costoTotal, precioSugerido),
    [costoTotal, precioSugerido]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-base font-semibold text-[var(--foreground)]">
        Cotizador rápido
      </h2>
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted)]">Material</label>
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Ej. PLA, PETG"
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)]">Tiempo impresión (min)</label>
            <input
              type="number"
              min={0}
              value={tiempoImpresionMin || ""}
              onChange={(e) => setTiempoImpresionMin(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)]">Gramos</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={gramos || ""}
              onChange={(e) => setGramos(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)]">Horas de diseño</label>
            <input
              type="number"
              min={0}
              step={0.25}
              value={horasDiseno || ""}
              onChange={(e) => setHorasDiseno(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)]">Margen deseado %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={margenDeseado || ""}
              onChange={(e) => setMargenDeseado(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            />
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4 space-y-2 text-sm">
          <p className="flex justify-between text-[var(--muted)]">
            <span>Costo material</span> {formatCurrency(costoMaterial)}
          </p>
          <p className="flex justify-between text-[var(--muted)]">
            <span>Costo máquina</span> {formatCurrency(costoMaquina)}
          </p>
          <p className="flex justify-between text-[var(--muted)]">
            <span>Costo diseño</span> {formatCurrency(costoDiseno)}
          </p>
          <p className="flex justify-between font-medium text-[var(--foreground)]">
            <span>Precio sugerido</span> {formatCurrency(precioSugerido)}
          </p>
          <p className="flex justify-between text-[var(--success)]">
            <span>Margen bruto</span> {margenReal}%
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/pedidos")}
          className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Convertir en Pedido
        </button>
      </div>
    </div>
  );
}
