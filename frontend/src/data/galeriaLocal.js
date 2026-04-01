/**
 * Fotos servidas desde /public/imagenes/<carpeta>/...
 * Nombres de carpeta coinciden con tu carpeta `imagenes/` en el repo.
 */
export const GALERIA_TRABAJOS = [
  {
    titulo: 'Funko explorador',
    carpeta: 'funko explorador',
    imagenes: [
      'Screenshot 2026-03-31 161933.png',
      'Screenshot 2026-03-31 161941.png',
      'Screenshot 2026-03-31 162005.png',
      'Screenshot 2026-03-31 162017.png',
      'Screenshot 2026-03-31 162023.png',
      'Screenshot 2026-03-31 162033.png',
      'Screenshot 2026-03-31 162118.png',
    ],
  },
  {
    titulo: 'Funko futbolista',
    carpeta: 'funko futbolista',
    imagenes: [
      'Screenshot 2026-03-25 181844.png',
      'Screenshot 2026-03-25 181909.png',
      'Screenshot 2026-03-25 184257.png',
      'Screenshot 2026-03-25 190546.png',
      'Screenshot 2026-03-25 190605.png',
      'Screenshot 2026-03-25 190626.png',
      'Screenshot 2026-03-25 200952.png',
    ],
  },
  {
    titulo: 'Funko guitarrista',
    carpeta: 'funko guitarrista',
    imagenes: [
      'Screenshot 2026-03-31 161213.png',
      'Screenshot 2026-03-31 161221.png',
      'Screenshot 2026-03-31 161231.png',
      'Screenshot 2026-03-31 161246.png',
    ],
  },
  {
    titulo: 'IG inversa',
    carpeta: 'ig inversa 1',
    imagenes: [
      'Screenshot 2026-03-31 161831.png',
      'Screenshot 2026-03-31 161837.png',
      'Screenshot 2026-03-31 162057.png',
      'Screenshot 2026-03-31 162102.png',
      'Screenshot 2026-03-31 162612.png',
      'Screenshot 2026-03-31 162619.png',
    ],
  },
  {
    titulo: 'Kuromi',
    carpeta: 'kuromi',
    imagenes: [
      'Screenshot 2026-03-31 161147.png',
      'Screenshot 2026-03-31 161157.png',
      'Screenshot 2026-03-31 161206.png',
    ],
  },
  {
    titulo: 'Letrero neón',
    carpeta: 'letrero neon',
    imagenes: [
      'Screenshot 2026-03-31 161843.png',
      'Screenshot 2026-03-31 161849.png',
      'Screenshot 2026-03-31 161854.png',
      'Screenshot 2026-03-31 161903.png',
      'Screenshot 2026-03-31 161911.png',
      'Screenshot 2026-03-31 161919.png',
    ],
  },
  {
    titulo: 'Molde para galletas',
    carpeta: 'Molde para galletas',
    imagenes: [
      'Screenshot 2026-03-31 161116.png',
      'Screenshot 2026-03-31 161125.png',
      'Screenshot 2026-03-31 161133.png',
      'Screenshot 2026-03-31 161140.png',
    ],
  },
  {
    titulo: 'Organizador de escritorio',
    carpeta: 'Organizador de escritorio',
    imagenes: [
      'Screenshot 2026-03-31 161259.png',
      'Screenshot 2026-03-31 161304.png',
      'Screenshot 2026-03-31 161313.png',
      'Screenshot 2026-03-31 161335.png',
    ],
  },
  {
    titulo: 'Soporte 3D ajustable',
    carpeta: 'Soporte 3d ajustable',
    imagenes: [
      'Screenshot 2026-03-31 160541.png',
      'Screenshot 2026-03-31 160549.png',
      'Screenshot 2026-03-31 160556.png',
      'Screenshot 2026-03-31 160603.png',
      'Screenshot 2026-03-31 160628.png',
    ],
  },
  {
    titulo: 'Soporte de laptop',
    carpeta: 'Soporte de laptop',
    imagenes: [
      'Screenshot 2026-03-31 161342.png',
      'Screenshot 2026-03-31 161758.png',
      'Screenshot 2026-03-31 161804.png',
      'Screenshot 2026-03-31 161810.png',
      'Screenshot 2026-03-31 161822.png',
    ],
  },
]

export function urlGaleriaTrabajo(carpeta, archivo) {
  return `/imagenes/${encodeURIComponent(carpeta)}/${encodeURIComponent(archivo)}`
}
