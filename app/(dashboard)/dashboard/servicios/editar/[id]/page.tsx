import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ServicioForm } from "@/components/servicios/ServicioForm";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/servicios");

  const supabase = await createClient();
  const { data: s } = await supabase.from("servicios").select("*").eq("id", id).single();
  if (!s) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Editar servicio</h1>
      <ServicioForm
        id={s.id}
        nombre={s.nombre}
        tarifaFija={Number(s.tarifa_fija)}
        tarifaPorHora={Number(s.tarifa_por_hora)}
      />
    </div>
  );
}
