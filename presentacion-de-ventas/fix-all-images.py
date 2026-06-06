"""Asigna cada captura al PNG correcto segun el titulo del lightbox."""
import re
from pathlib import Path

INDEX = Path(__file__).parent / "index.html"

MAP = [
    ("Hero oscuro", "inicio.png"),
    ("Menú y navegación", "inicio2.png"),
    ("Servicios técnicos", "incio-03.png"),
    ("Smart Quote Calculator", "inicio-04.png"),
    ("Galería de proyectos", "incio-05.png"),
    ("Cotizador en línea", "inicio-06.png"),
    ("Comunidad Maker", "inicio-07.png"),
    ("Fotos de proyectos", "inicio-08.png"),
    ("Modo claro / Responsive", "inicio-40.png"),
    ("Dashboard con menú lateral", "dasboard.png"),
    ("Paso 1 — Selección de cliente", "cotizacion-1.png"),
    ("Paso 2 — Descripción del proyecto", "cotzacion 2.png"),
    ("Paso 3 — Costos de impresión", "cotizacion-3.png"),
    ("Paso 4 — Resumen y margen", "cotizacion-4.png"),
    ("Paso 5 — Vista previa de cotización", "cotizacion-5.png"),
    ("Paso 5 — Tabla de productos", "cotizacion-6.png"),
    ("Paso 6 — Generar PDF", "cotizacion-7.png"),
    ("Paso 6 — Vista previa del PDF", "cotizacion-8.png"),
    ("Paso 6 — Confirmar y registrar", "cotizacion-9.png"),
    ("Cotizaciones en espera", "cotizacion en espera.png"),
    ("Catálogo de productos", "productos.png"),
    ("Inventario de filamentos", "inventario.png"),
    ("Inventario de items", "inventario-2.png"),
    ("Agregar item", "inventario-3.png"),
    ("Detalle de inventario", "inentario-4.png"),
    ("Gestión de clientes", "clientes.png"),
    ("Diseñadores y perfiles", "disenadores perfiles.png"),
    ("Planes de suscripción", "suscripcion.png"),
    ("Admin de usuarios y cobros", "suscripcion-2.png"),
    ("Configuración personal", "configuracion.png"),
    ("Cambiar contraseña", "configuracion-2.png"),
    ("Alarmas y alertas", "alertas gneerales.png"),
    ("Panel de seguridad", "seguridad.png"),
    ("Videos promocionales", "videos promocionales.png"),
    ("Costos calculadora pública", "costos claculadora publica.png"),
    ("Editor web pública (JSON)", "programacion de pagina web.png"),
    ("Editor de galería web", "editor de galeria web.png"),
    ("Dashboard de análisis", "analisis y reportes.png"),
    ("Ingresos por periodo", "analisis y reportes-2.png"),
    ("Productos del periodo", "analisis y reportes-3.png"),
]


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    total = 0
    d = "div"
    for key, fname in MAP:
        pattern = re.compile(
            rf'(<{d} class="thumb" onclick="openLightbox\(this\.querySelector\(\'img\'\)\.src,'
            + rf"'[^']*{re.escape(key)}[^']*'\)\">"
            + rf'<img src=")[^"]+(" alt="[^"]*"></{d}>)'
        )
        html, n = pattern.subn(rf"\1{fname}\2", html)
        if n:
            print(f"  {n}x {fname}")
            total += n
    INDEX.write_text(html, encoding="utf-8", newline="\n")
    print(f"Total: {total} correcciones")


if __name__ == "__main__":
    main()
