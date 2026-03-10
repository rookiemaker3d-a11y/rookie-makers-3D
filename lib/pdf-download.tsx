"use client";

import { pdf } from "@react-pdf/renderer";
import { CotizacionPDFDoc } from "@/components/pdf/CotizacionPDF";
import { ReciboPDFDoc } from "@/components/pdf/ReciboPDF";
import type { CotizacionEnEspera } from "@/types/database";

export interface VendedorInfo {
  banco: string | null;
  cuenta: string | null;
}

export async function downloadCotizacionPDF(
  items: CotizacionEnEspera[],
  vendedorNombre: string,
  vendedorInfo: VendedorInfo
) {
  const pdfItems = items.map((c) => ({
    descripcion: c.descripcion,
    cantidad: Number(c.cantidad),
    tiempo_min: (c.detalles as { tiempo_total?: number })?.tiempo_total ?? 0,
    costo_final: Number(c.costo_final),
  }));
  const fecha = new Date().toISOString().slice(0, 10);
  const blob = await pdf(
    <CotizacionPDFDoc
      items={pdfItems}
      vendedorNombre={vendedorNombre}
      fecha={fecha}
      banco={vendedorInfo.banco ?? ""}
      cuenta={vendedorInfo.cuenta ?? ""}
    />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotizacion_${fecha}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadReciboPDF(
  items: CotizacionEnEspera[],
  vendedorNombre: string,
  vendedorInfo: VendedorInfo
) {
  const pdfItems = items.map((c) => ({
    descripcion: c.descripcion,
    cantidad: Number(c.cantidad),
    tiempo_min: (c.detalles as { tiempo_total?: number })?.tiempo_total ?? 0,
    costo_final: Number(c.costo_final),
  }));
  const fecha = new Date().toISOString().slice(0, 10);
  const blob = await pdf(
    <ReciboPDFDoc
      items={pdfItems}
      vendedorNombre={vendedorNombre}
      fecha={fecha}
      banco={vendedorInfo.banco ?? ""}
      cuenta={vendedorInfo.cuenta ?? ""}
    />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recibo_venta_${fecha}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
