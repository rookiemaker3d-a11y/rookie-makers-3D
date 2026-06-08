/**
 * Catálogo de productos mostrados en la landing pública.
 *
 * El backend en /api/catalogo/productos es la fuente de la verdad: Norberto
 * edita precios, descripciones e imágenes desde el ERP y la landing los refleja
 * al instante. Este archivo solo guarda un fallback (array vacío por default)
 * para los primeros milisegundos de carga o si el endpoint falla.
 */
import { landingApiUrl } from "@/lib/publicLandingApi";

export interface ProductoComprable {
  id: number | string;            // numérico si viene del backend, slug si es fallback
  nombre: string;
  descripcion: string;
  precio: number | null;          // null = "precio a convenir" (modal pide al cliente)
  imagen: string;
  categoria: string;
}

/** Catálogo hardcoded (fallback). Vacío por default; Norberto puede meter items manualmente si quiere. */
export const PRODUCTOS_COMPRABLES_FALLBACK: ProductoComprable[] = [];

/** Carga el catálogo desde el backend. Si falla, devuelve el fallback hardcoded. */
export async function fetchProductosCatalogo(): Promise<ProductoComprable[]> {
  try {
    const res = await fetch(landingApiUrl("/api/catalogo/productos"), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Array<{
      id: number;
      nombre: string;
      descripcion: string | null;
      precio: number;
      imagen_url: string | null;
      categoria: string | null;
    }>;
    return data
      .filter((p) => p.nombre)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion || "",
        // precio 0 → "a convenir"
        precio: p.precio > 0 ? p.precio : null,
        imagen: p.imagen_url || "",
        categoria: p.categoria || "",
      }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[catalogo] no se pudo cargar /api/catalogo/productos, usando fallback:", err);
    return PRODUCTOS_COMPRABLES_FALLBACK;
  }
}
