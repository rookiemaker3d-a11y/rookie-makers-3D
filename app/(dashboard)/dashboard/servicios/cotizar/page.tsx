import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVendedorId, getVendedorNombre } from "@/lib/auth";
import Link from "next/link";
import { CotizarServicio } from "@/components/servicios/CotizarServicio";

export default async function CotizarServicioPage() {
  const vendedorId = await getVendedorId();
  const vendedorNombre = await getVendedorNombre();
  if (!vendedorNombre) redirect("/dashboard");

  const supabase = await createClient();
  const { data: servicios } = await supabase.from("servicios").select("*").order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/servicios" className="text-blue-600 hover:underline">
          Volver a Servicios
        </Link>
      </div>
      <CotizarServicio
        servicios={servicios ?? []}
        vendedorId={vendedorId}
        vendedorNombre={vendedorNombre}
      />
    </div>
  );
}
