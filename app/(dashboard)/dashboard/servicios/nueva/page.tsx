import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ServicioForm } from "@/components/servicios/ServicioForm";

export default async function NuevaServicioPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/servicios");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nuevo servicio</h1>
      <ServicioForm />
    </div>
  );
}
