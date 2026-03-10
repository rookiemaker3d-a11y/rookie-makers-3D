import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, getVendedorId } from "@/lib/auth";
import { GastosList } from "@/components/gastos/GastosList";

export default async function GastosPage() {
  const admin = await isAdmin();
  const vendedorId = await getVendedorId();
  if (!admin && !vendedorId) redirect("/dashboard");

  const supabase = await createClient();
  let query = supabase.from("gastos").select("*").order("fecha", { ascending: false });
  if (!admin && vendedorId) {
    query = query.eq("vendedor_id", vendedorId);
  }
  const { data: gastos } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
      <GastosList gastos={gastos ?? []} isAdmin={admin} vendedorId={vendedorId} />
    </div>
  );
}
