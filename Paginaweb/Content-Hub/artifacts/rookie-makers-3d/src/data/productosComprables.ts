/**
 * Catálogo de productos comprables desde la landing pública (www.rookiemakers3d.com).
 *
 * Norberto llena este array a mano con los productos que quiera publicar.
 * - precio: si es null, el modal pregunta el precio al cliente y Norberto decide si acepta.
 * - imagen: ruta pública (de public/ o /portfolio/...) o import de src/...
 * - categoria: agrupación visual (ej: "Llaveros", "Hogar", "Coleccionables")
 *
 * Para agregar un producto, copia este formato:
 * {
 *   id: 'mi-producto',
 *   nombre: 'Mi producto increíble',
 *   precio: 250,  // o null si el cliente debe proponer precio
 *   descripcion: 'Una pieza impresa en PLA de alta calidad...',
 *   imagen: '/portfolio/mi-categoria/00.png',
 *   categoria: 'Hogar',
 * }
 */
export interface ProductoComprable {
  id: string;
  nombre: string;
  precio: number | null;  // MXN; null = el cliente debe proponer precio
  descripcion: string;
  imagen: string;
  categoria: string;
}

export const PRODUCTOS_COMPRABLES: ProductoComprable[] = [
  // Ejemplo (descomentar y ajustar cuando Norberto quiera):
  // {
  //   id: "llavero-pla-personalizado",
  //   nombre: "Llavero PLA personalizado",
  //   precio: 89,
  //   descripcion: "Llavero 3D en PLA, ideal para personalizar con tu nombre o logo. Varios colores disponibles.",
  //   imagen: "/portfolio/llaveros/00.png",
  //   categoria: "Llaveros",
  // },
];
