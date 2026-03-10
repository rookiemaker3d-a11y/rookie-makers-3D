import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default async function NuevaClientePage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/clientes");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nuevo cliente</h1>
      <ClienteForm />
    </div>
  );
}
