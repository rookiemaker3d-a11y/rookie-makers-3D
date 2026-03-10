import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VendedorForm } from "@/components/vendedores/VendedorForm";

export default async function EditarVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/vendedores");

  const supabase = await createClient();
  const { data: v } = await supabase.from("vendedores").select("*").eq("id", id).single();
  if (!v) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Editar vendedor</h1>
      <VendedorForm
        id={v.id}
        nombre={v.nombre}
        correo={v.correo}
        telefono={v.telefono ?? ""}
        banco={v.banco ?? ""}
        cuenta={v.cuenta ?? ""}
      />
    </div>
  );
}
