import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PedidosPageClient } from "@/components/pedidos/PedidosPageClient";

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PedidosPageClient />;
}
