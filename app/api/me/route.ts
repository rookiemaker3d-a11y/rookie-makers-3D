import { NextResponse } from "next/server";
import { getDashboardAuth } from "@/lib/auth";

export async function GET() {
  try {
    const { admin, vendedorNombre } = await getDashboardAuth();
    return NextResponse.json({ admin, vendedorNombre });
  } catch {
    return NextResponse.json({ admin: false, vendedorNombre: null });
  }
}
