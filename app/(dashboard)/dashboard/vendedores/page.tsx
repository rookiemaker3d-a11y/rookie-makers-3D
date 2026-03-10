import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { VendedoresList } from "@/components/vendedores/VendedoresList";

export default async function VendedoresPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  const supabase = await createClient();
  const { data: vendedores } = await supabase.from("vendedores").select("*").order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Vendedores</h1>
        <Link
          href="/dashboard/vendedores/nueva"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Nuevo vendedor
        </Link>
      </div>
      <VendedoresList vendedores={vendedores ?? []} />
    </div>
  );
}
