#!/usr/bin/env python3
"""
Convierte la presentacion-de-ventas en un UNICO archivo HTML portable
incrustando todas las imagenes PNG como base64.
Tambien actualiza los onclick del lightbox para usar el src del <img> clickeado.
"""
import os
import re
import base64
from pathlib import Path

SRC_DIR = Path("C:/Users/norbe/Desktop/rokie/presentacion-de-ventas")
OUTPUT = Path("C:/Users/norbe/Desktop/rokie/Presentacion-de-Ventas-Rookie-Makers-3D.html")
HTML_FILE = SRC_DIR / "index.html"

# 1. leer HTML
with open(HTML_FILE, "r", encoding="utf-8") as f:
    html = f.read()

# 2. encontrar todos los nombres de imagen .png referenciados
#    tanto en src="..." como en onclick="openLightbox('...',...)"
img_names = set()
for m in re.finditer(r"src=\"([^\"]+\.png)\"", html):
    img_names.add(m.group(1))
for m in re.finditer(r"openLightbox\('([^']+\.png)'", html):
    img_names.add(m.group(1))

print(f"Imagenes encontradas: {len(img_names)}")

# 3. convertir cada imagen a base64 y reemplazar
replacements = {}
for name in img_names:
    img_path = SRC_DIR / name
    if not img_path.exists():
        print(f"  AVISO: no existe {name}")
        continue
    with open(img_path, "rb") as fimg:
        b64 = base64.b64encode(fimg.read()).decode("ascii")
    replacements[name] = f"data:image/png;base64,{b64}"
    size_kb = img_path.stat().st_size / 1024
    print(f"  {name} -> {size_kb:.1f} KB  (base64 {len(replacements[name])/1024:.1f} KB)")

# 4. reemplazar onclick para que usen this.querySelector('img').src
#    antes: onclick="openLightbox('inicio.png','Landing...')"
#    despues: onclick="openLightbox(this.querySelector('img').src,'Landing...')"
html = re.sub(
    r'onclick="openLightbox\(\'([^\']+\.png)\',',
    r'onclick="openLightbox(this.querySelector(\'img\').src,',
    html
)
html = re.sub(
    r'onclick="openLightbox\("([^"]+\.png)",',
    r'onclick="openLightbox(this.querySelector(\'img\').src,',
    html
)

# 5. reemplazar los src de las etiquetas <img>
#    Nota: debemos evitar reemplazar el src del lightbox (lbImg)
#    Los src en el HTML son de la forma src="nombre.png"
for name, b64 in replacements.items():
    html = html.replace(f'src="{name}"', f'src="{b64}"')

# 6. cambiar el titulo a algo mas comercial
html = html.replace(
    "<title>Rookie Makers 3D — ERP | Presentación Comercial</title>",
    "<title>Rookie Makers 3D — ERP | Presentación de Ventas</title>"
)

# 7. guardar
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(html)

final_mb = OUTPUT.stat().st_size / 1024 / 1024
print(f"\nArchivo generado: {OUTPUT}")
print(f"Tamanio final: {final_mb:.2f} MB")
print("Listo. Solo abre el HTML con Chrome/Edge y Ctrl+P para PDF.")
