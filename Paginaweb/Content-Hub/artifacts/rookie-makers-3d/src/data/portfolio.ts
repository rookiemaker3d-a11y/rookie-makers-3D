/** Fotos reales en public/portfolio/<slug>/00.png … (sincronizadas desde /imagenes del repo). */

const P = (slug: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/portfolio/${slug}/${String(i).padStart(2, "0")}.png`);

export type PortfolioCategory = {
  id: string;
  label: string;
  tag: string;
  span: string;
  images: string[];
};

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    id: "funko-explorador",
    label: "Funko explorador",
    tag: "Coleccionables",
    span: "col-span-1 row-span-1",
    images: P("funko-explorador", 7),
  },
  {
    id: "ingenieria-inversa",
    label: "Ingeniería inversa",
    tag: "Escaneo y modelado",
    span: "col-span-1 md:col-span-2 row-span-1",
    images: P("ingenieria-inversa", 6),
  },
  {
    id: "kuromi",
    label: "Figura Kuromi",
    tag: "Resina / detalle",
    span: "col-span-1 row-span-2",
    images: P("kuromi", 3),
  },
  {
    id: "molde-galletas",
    label: "Molde para galletas",
    tag: "PETG alimenticio",
    span: "col-span-1 row-span-1",
    images: P("molde-galletas", 4),
  },
  {
    id: "organizador-escritorio",
    label: "Organizador de escritorio",
    tag: "Oficina",
    span: "col-span-1 md:col-span-2 row-span-1",
    images: P("organizador-escritorio", 4),
  },
  {
    id: "soporte-ajustable",
    label: "Soporte 3D ajustable",
    tag: "Funcional",
    span: "col-span-1 row-span-1",
    images: P("soporte-ajustable", 5),
  },
  {
    id: "soporte-laptop",
    label: "Soporte de laptop",
    tag: "PLA / PETG",
    span: "col-span-1 row-span-1",
    images: P("soporte-laptop", 5),
  },
  {
    id: "funko-futbolista",
    label: "Funko futbolista",
    tag: "Coleccionables",
    span: "col-span-1 row-span-1",
    images: P("funko-futbolista", 7),
  },
  {
    id: "funko-guitarrista",
    label: "Funko guitarrista",
    tag: "Coleccionables",
    span: "col-span-1 row-span-1",
    images: P("funko-guitarrista", 4),
  },
  {
    id: "letrero-neon",
    label: "Letrero neón",
    tag: "Decoración LED",
    span: "col-span-1 md:col-span-2 row-span-1",
    images: P("letrero-neon", 6),
  },
];

/** Todas las fotos (para mosaico bajo la sección de videos / redes). */
export const ALL_PORTFOLIO_IMAGES: { src: string; alt: string }[] = PORTFOLIO_CATEGORIES.flatMap(
  (c) => c.images.map((src) => ({ src, alt: c.label })),
);
