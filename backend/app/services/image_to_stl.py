"""
Genera un STL a partir de una imagen: extrae la silueta (contorno) y la extruye en Z.
Útil para logos o formas 2D que quieras imprimir en 3D (ej. base con relieve).
"""
import io
import cv2
import numpy as np


def _normalize_contour(pts: np.ndarray, max_size_mm: float = 100.0) -> np.ndarray:
    """Escala el contorno para que quepa en max_size_mm (mayor dimensión)."""
    pts = np.array(pts, dtype=np.float64)
    if len(pts) < 3:
        return pts
    min_x, min_y = pts.min(axis=0)
    max_x, max_y = pts.max(axis=0)
    w, h = max_x - min_x, max_y - min_y
    if w < 1e-6 and h < 1e-6:
        return pts
    scale = max_size_mm / max(w, h)
    cx, cy = (min_x + max_x) / 2, (min_y + max_y) / 2
    pts[:, 0] = (pts[:, 0] - cx) * scale
    pts[:, 1] = (pts[:, 1] - cy) * scale
    return pts


def _write_stl_ascii(triangles: list[tuple], out: io.StringIO) -> None:
    """Escribe triángulos en formato STL ASCII."""
    out.write("solid imagen_extrusion\n")
    for (a, b, c) in triangles:
        v = np.array([a, b, c], dtype=np.float64)
        n = np.cross(v[1] - v[0], v[2] - v[0])
        norm = np.linalg.norm(n)
        if norm < 1e-10:
            n = np.array([0, 0, 1.0])
        else:
            n = n / norm
        out.write(f"  facet normal {n[0]:.6e} {n[1]:.6e} {n[2]:.6e}\n")
        out.write("    outer loop\n")
        for p in v:
            out.write(f"      vertex {p[0]:.6e} {p[1]:.6e} {p[2]:.6e}\n")
        out.write("    endloop\n  endfacet\n")
    out.write("endsolid imagen_extrusion\n")


def image_to_stl(
    image_bytes: bytes,
    height_mm: float = 10.0,
    max_size_mm: float = 100.0,
    invert: bool = True,
    simplify_epsilon: float = 2.0,
) -> str:
    """
    Convierte una imagen a STL por extrusión del contorno principal.
    - image_bytes: contenido de la imagen (PNG, JPG, etc.)
    - height_mm: altura de extrusión en mm
    - max_size_mm: tamaño máximo de la pieza (mm)
    - invert: si True, la silueta es lo oscuro; si False, lo claro
    - simplify_epsilon: simplificación del contorno (menor = más detalle)
    Returns: contenido STL en formato ASCII.
    """
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen")
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if invert:
        thresh = 255 - thresh
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No se encontró ningún contorno en la imagen")
    cnt = max(contours, key=cv2.contourArea)
    if cv2.contourArea(cnt) < 100:
        raise ValueError("El contorno encontrado es demasiado pequeño")
    approx = cv2.approxPolyDP(cnt, simplify_epsilon, True)
    pts = approx.reshape(-1, 2).astype(np.float64)
    pts = _normalize_contour(pts, max_size_mm)
    n_pts = len(pts)
    if n_pts < 3:
        raise ValueError("Contorno con muy pocos puntos")
    z0, z1 = 0.0, float(height_mm)
    triangles = []

    def add_tri(a, b, c):
        triangles.append((tuple(a), tuple(b), tuple(c)))

    for i in range(n_pts):
        j = (i + 1) % n_pts
        p0, p1 = pts[i], pts[j]
        a_bot = (p0[0], p0[1], z0)
        b_bot = (p1[0], p1[1], z0)
        a_top = (p0[0], p0[1], z1)
        b_top = (p1[0], p1[1], z1)
        add_tri(a_bot, b_bot, a_top)
        add_tri(b_bot, b_top, a_top)
    center_bot = (float(pts[:, 0].mean()), float(pts[:, 1].mean()), z0)
    center_top = (center_bot[0], center_bot[1], z1)
    for i in range(n_pts):
        j = (i + 1) % n_pts
        add_tri(center_bot, (pts[i][0], pts[i][1], z0), (pts[j][0], pts[j][1], z0))
        add_tri(center_top, (pts[j][0], pts[j][1], z1), (pts[i][0], pts[i][1], z1))
    buf = io.StringIO()
    _write_stl_ascii(triangles, buf)
    return buf.getvalue()
