import { NextResponse } from "next/server";
import { fetchKPIs, fetchUltimosPedidos, fetchAlertas, fetchMaquinas } from "@/lib/services/erp.service";

export async function GET() {
  try {
    const [kpis, ultimos, alertas, maquinasResult] = await Promise.all([
      fetchKPIs(),
      fetchUltimosPedidos(5),
      fetchAlertas(),
      fetchMaquinas().catch(() => []),
    ]);
    const maquinas = Array.isArray(maquinasResult) ? maquinasResult : [];
    const usoMaquinas = maquinas.length
      ? (maquinas.filter((m: { estado: string }) => m.estado === "ocupada" || m.estado === "pausada").length / maquinas.length) * 100
      : 0;
    return NextResponse.json({
      kpis,
      ultimosPedidos: ultimos,
      alertas,
      usoMaquinas: Math.round(usoMaquinas),
      totalMaquinas: maquinas.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        kpis: { pedidosActivos: 0, ingresosMes: 0, maquinasActivas: 0, piezasHoy: 0, totalMaquinas: 0 },
        ultimosPedidos: [],
        alertas: { stockBajo: [], retrasados: [] },
        usoMaquinas: 0,
        totalMaquinas: 0,
      },
      { status: 200 }
    );
  }
}
