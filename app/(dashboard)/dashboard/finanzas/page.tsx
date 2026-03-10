import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FinanzasPageClient } from "@/components/finanzas/FinanzasPageClient";

export default async function FinanzasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <FinanzasPageClient />;
}
