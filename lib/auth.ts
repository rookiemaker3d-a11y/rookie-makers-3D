import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type UserRole = "administrador" | "vendedor";

export interface UserProfile {
  role: UserRole;
  vendedorId: string | null;
  vendedorNombre: string | null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Una sola llamada para layout: evita doble fetch de perfil */
export const getDashboardAuth = cache(async (): Promise<{ admin: boolean; vendedorNombre: string | null }> => {
  const profile = await getUserProfile();
  return {
    admin: profile?.role === "administrador",
    vendedorNombre: profile?.vendedorNombre ?? null,
  };
});

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("users_roles")
    .select("role, vendedor_id, vendedores(nombre)")
    .eq("user_id", user.id)
    .single();

  if (!row) return null;

  const raw = row as { role: UserRole; vendedor_id: string | null; vendedores?: { nombre: string } | { nombre: string }[] };
  const v = raw.vendedores;
  const vendedorNombre = Array.isArray(v) ? v[0]?.nombre : v?.nombre ?? null;

  return {
    role: raw.role,
    vendedorId: raw.vendedor_id ?? null,
    vendedorNombre,
  };
}

export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role ?? null;
}

export async function getVendedorId(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.vendedorId ?? null;
}

export async function getVendedorNombre(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.vendedorNombre ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "administrador";
}
