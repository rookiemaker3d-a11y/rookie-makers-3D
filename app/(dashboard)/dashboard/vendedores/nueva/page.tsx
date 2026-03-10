import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { VendedorForm } from "@/components/vendedores/VendedorForm";

export default async function NuevaVendedorPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard/vendedores");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nuevo vendedor</h1>
      <VendedorForm />
    </div>
  );
}
