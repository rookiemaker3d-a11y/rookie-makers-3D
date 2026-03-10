import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProduccionPageClient } from "@/components/produccion/ProduccionPageClient";

export default async function ProduccionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ProduccionPageClient />;
}
