#!/usr/bin/env python3
"""Reconstruye index.html (rutas relativas) y HTML autocontenido con imagenes embebidas."""
from __future__ import annotations

import base64
import re
from pathlib import Path

DIR = Path(__file__).resolve().parent
STANDALONE = DIR / "Presentacion-de-Ventas-Rookie-Makers-3D.html"
INDEX = DIR / "index.html"

IMAGE_ORDER = [
    "inicio.png",
    "inicio2.png",
    "incio-03.png",
    "inicio-04.png",
    "incio-05.png",
    "inicio-06.png",
    "inicio-07.png",
    "inicio-08.png",
    "inicio-40.png",
    "dasboard.png",
    "cotizacion-1.png",
    "cotzacion 2.png",
    "cotizacion-3.png",
    "cotizacion-4.png",
    "cotizacion-5.png",
    "cotizacion-6.png",
    "cotizacion-7.png",
    "cotizacion-8.png",
    "cotizacion-9.png",
    "cotizacion en espera.png",
    "productos.png",
    "inventario.png",
    "inventario-2.png",
    "inventario-3.png",
    "inentario-4.png",
    "clientes.png",
    "disenadores perfiles.png",
    "suscripcion.png",
    "suscripcion-2.png",
    "configuracion.png",
    "configuracion-2.png",
    "alertas gneerales.png",
    "seguridad.png",
    "videos promocionales.png",
    "costos claculadora publica.png",
    "programacion de pagina web.png",
    "editor de galeria web.png",
    "analisis y reportes.png",
    "analisis y reportes-2.png",
    "analisis y reportes-3.png",
]

DATA_URI_RE = re.compile(r'src="data:image/png;base64,[^"]+"')

SCROLL_CSS = """
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
      z-index: 300;
      transition: width .1s linear;
      box-shadow: 0 0 12px rgba(96, 165, 250, 0.45);
    }
"""

SCROLL_JS = """
  const scrollProgress = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress && h > 0) {
      scrollProgress.style.width = (window.scrollY / h * 100) + '%';
    }
  }, { passive: true });
"""


def inject_scroll_bar(html: str) -> str:
    if "scroll-progress" not in html:
        html = html.replace("</style>", SCROLL_CSS + "\n  </style>", 1)
        html = html.replace(
            "<body>",
            '<body>\n\n<div class="scroll-progress" id="scrollProgress"></' + 'div>',
            1,
        )
    if "scrollProgress" not in html or "window.addEventListener('scroll'" not in html:
        html = html.replace(
            "const reveals = document.querySelectorAll",
            SCROLL_JS + "\n  const reveals = document.querySelectorAll",
            1,
        )
    return html


def strip_base64_to_index(html: str) -> str:
    idx = 0

    def repl(_: re.Match[str]) -> str:
        nonlocal idx
        if idx >= len(IMAGE_ORDER):
            raise RuntimeError(f"Mas imagenes en HTML que en IMAGE_ORDER ({len(IMAGE_ORDER)})")
        name = IMAGE_ORDER[idx]
        idx += 1
        return f'src="{name}"'

    out = DATA_URI_RE.sub(repl, html)
  # Normalizar lightbox para rutas relativas
    out = out.replace(
        "openLightbox(this.querySelector(\\'img\\').src,",
        "openLightbox(this.querySelector('img').src,",
    )
    return out


def embed_images(html: str) -> str:
    for name in IMAGE_ORDER:
        path = DIR / name
        if not path.is_file():
            print(f"  AVISO: falta {name}")
            continue
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        uri = f"data:image/png;base64,{data}"
        html = html.replace(f'src="{name}"', f'src="{uri}"', 1)
        print(f"  + {name}")
    return html


def main() -> None:
    if not INDEX.is_file():
        raise SystemExit(f"No existe {INDEX}")

    print("Leyendo index.html...")
    index_html = inject_scroll_bar(INDEX.read_text(encoding="utf-8"))

    print("Generando HTML autocontenido (imagenes dentro del archivo)...")
    standalone = embed_images(index_html)
    STANDALONE.write_text(standalone, encoding="utf-8", newline="\n")
    mb = STANDALONE.stat().st_size / (1024 * 1024)
    print(f"  -> {STANDALONE} ({mb:.2f} MB)")
    print("\nListo. Envia SOLO este archivo .html — no hacen falta las carpetas PNG.")


if __name__ == "__main__":
    main()
