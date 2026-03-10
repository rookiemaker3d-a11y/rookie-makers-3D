import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/clientes");

  const supabase = await createClient();
  const { data: c } = await supabase.from("clientes").select("*").eq("id", id).single();
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Editar cliente</h1>
      <ClienteForm
        id={c.id}
        nombre={c.nombre}
        correo={c.correo}
        telefono={c.telefono ?? ""}
        direccion={c.direccion ?? ""}
      />
    </div>
  );
}
