import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { ServiciosList } from "@/components/servicios/ServiciosList";

export default async function ServiciosPage() {
  const supabase = await createClient();
  const admin = await isAdmin();
  const { data: servicios } = await supabase.from("servicios").select("*").order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Servicios</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/servicios/cotizar"
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Cotizar servicio
          </Link>
          {admin && (
            <Link
              href="/dashboard/servicios/nueva"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Nuevo servicio
            </Link>
          )}
        </div>
      </div>
      <ServiciosList servicios={servicios ?? []} isAdmin={admin} />
    </div>
  );
}
