import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CotizacionesList } from "@/components/cotizador/CotizacionesList";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data: cotizaciones } = await supabase
    .from("cotizaciones_en_espera")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Cotizaciones en espera
        </h1>
        <Link
          href="/dashboard/cotizaciones/nueva"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:opacity-90"
        >
          Nueva cotización
        </Link>
      </div>
      <CotizacionesList cotizaciones={cotizaciones ?? []} />
    </div>
  );
}
