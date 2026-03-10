import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CotizadorPageClient } from "@/components/cotizador/CotizadorPageClient";

export default async function CotizadorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CotizadorPageClient />;
}
