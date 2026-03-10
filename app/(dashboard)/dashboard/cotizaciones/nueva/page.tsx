import { getVendedorId, getVendedorNombre } from "@/lib/auth";
import { RegistroImpresionTable } from "@/components/cotizador/RegistroImpresionTable";

export default async function NuevaCotizacionPage() {
  const vendedorId = await getVendedorId();
  const vendedorNombre = (await getVendedorNombre()) ?? "Administrador";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Registro nueva impresión
      </h1>
      <RegistroImpresionTable
        vendedorId={vendedorId}
        vendedorNombre={vendedorNombre}
      />
    </div>
  );
}
