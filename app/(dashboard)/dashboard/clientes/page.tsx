import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { ClientesList } from "@/components/clientes/ClientesList";

export default async function ClientesPage() {
  const supabase = await createClient();
  const admin = await isAdmin();
  const { data: clientes } = await supabase.from("clientes").select("*").order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Clientes</h1>
        {admin && (
          <Link
            href="/dashboard/clientes/nueva"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:opacity-90"
          >
            Nuevo cliente
          </Link>
        )}
      </div>
      <ClientesList clientes={clientes ?? []} isAdmin={admin} />
    </div>
  );
}
