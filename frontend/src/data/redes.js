// Enlaces reales de redes sociales de Rookie Makers 3D
export const REDES = {
  facebook: 'https://www.facebook.com/rookiemakers3d',
  tiktok: 'https://www.tiktok.com/@rookiemakers3d',
  instagram: 'https://www.instagram.com/rookiemakers3d',
}

// Videos: fallback si la API no responde; los reales se cargan desde el backend (admin los sube)
export const VIDEOS = [
  { id: 1, titulo: 'Proyecto en impresión 3D', url: 'https://www.tiktok.com/@rookiemakers3d', red: 'TikTok', embed: null },
  { id: 2, titulo: 'Reel destacado', url: 'https://www.instagram.com/rookiemakers3d/reels/', red: 'Instagram', embed: null },
  { id: 3, titulo: 'Videos en Facebook', url: 'https://www.facebook.com/rookiemakers3d/videos', red: 'Facebook', embed: null },
]

// Proyectos destacados (al menos 5) — enlaces a perfiles y publicaciones reales
export const PROYECTOS = [
  {
    id: 1,
    titulo: 'Organizadores 3D',
    descripcion: 'Organizadores personalizados para escritorio y taller.',
    imagen: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=300&fit=crop',
    enlace: 'https://www.instagram.com/rookiemakers3d',
    red: 'Instagram',
  },
  {
    id: 2,
    titulo: 'Piezas y prototipos',
    descripcion: 'Diseño e impresión de piezas únicas y prototipos.',
    imagen: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
    enlace: 'https://www.tiktok.com/@rookiemakers3d',
    red: 'TikTok',
  },
  {
    id: 3,
    titulo: 'Proyectos comunitarios',
    descripcion: 'Proyectos compartidos con la comunidad en Facebook.',
    imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    enlace: 'https://www.facebook.com/rookiemakers3d',
    red: 'Facebook',
  },
  {
    id: 4,
    titulo: 'Figuras y decoración',
    descripcion: 'Figuras decorativas y piezas personalizadas en 3D.',
    imagen: 'https://images.unsplash.com/photo-1565276910390-8fb0e9390f8c?w=400&h=300&fit=crop',
    enlace: 'https://www.instagram.com/rookiemakers3d',
    red: 'Instagram',
  },
  {
    id: 5,
    titulo: 'Repuestos y funcionales',
    descripcion: 'Repuestos y piezas funcionales para uso cotidiano.',
    imagen: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop',
    enlace: 'https://www.facebook.com/rookiemakers3d',
    red: 'Facebook',
  },
]
