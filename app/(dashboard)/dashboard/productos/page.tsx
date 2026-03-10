import { createClient } from "@/lib/supabase/server";
import { ProductosList } from "@/components/dashboard/ProductosList";

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Productos autorizados</h1>
      <ProductosList productos={productos ?? []} />
    </div>
  );
}
