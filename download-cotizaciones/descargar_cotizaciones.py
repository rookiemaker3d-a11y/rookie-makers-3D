#!/usr/bin/env python3
"""
Script para descargar cotizaciones y archivos adjuntos desde la API de Rookie
y guardarlos en una carpeta local. Ejecutar en tu PC con Python 3.

Uso:
  python descargar_cotizaciones.py
  python descargar_cotizaciones.py --api-url https://tu-api.onrender.com --email tu@email.com --carpeta C:\RookieMaker\Cotizaciones

Variables de entorno (opcionales):
  ROOKIE_API_URL   Base URL de la API (ej. https://rookie-makers-3d.onrender.com)
  ROOKIE_EMAIL     Correo del usuario
  ROOKIE_PASSWORD  Contraseña
  ROOKIE_CARPETA   Carpeta de destino (ej. C:\RookieMaker\Cotizaciones)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

def get_password(password_arg):
    if password_arg:
        return password_arg
    try:
        import getpass
        return getpass.getpass("Contraseña: ")
    except Exception:
        return input("Contraseña: ")

try:
    import requests
except ImportError:
    print("Instala dependencias: pip install -r requirements.txt")
    sys.exit(1)


def sanitize_filename(name: str) -> str:
    """Elimina caracteres no válidos para nombres de archivo."""
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip() or "archivo"


def main():
    parser = argparse.ArgumentParser(description="Descargar cotizaciones y archivos de la API Rookie")
    parser.add_argument("--api-url", default=os.environ.get("ROOKIE_API_URL"), help="URL base de la API")
    parser.add_argument("--email", default=os.environ.get("ROOKIE_EMAIL"), help="Correo del usuario")
    parser.add_argument("--password", default=os.environ.get("ROOKIE_PASSWORD"), help="Contraseña")
    parser.add_argument("--carpeta", default=os.environ.get("ROOKIE_CARPETA", "Cotizaciones"), help="Carpeta donde guardar archivos")
    parser.add_argument("--json", action="store_true", help="Guardar además un JSON con metadatos de las cotizaciones")
    args = parser.parse_args()

    api_url = (args.api_url or "").rstrip("/")
    if not api_url:
        print("Indica la URL de la API con --api-url o variable ROOKIE_API_URL")
        sys.exit(1)
    if not args.email:
        print("Indica --email o variable ROOKIE_EMAIL")
        sys.exit(1)
    password = get_password(args.password)
    if not password:
        print("Indica --password, variable ROOKIE_PASSWORD o escríbela cuando se solicite")
        sys.exit(1)

    session = requests.Session()
    session.headers["Content-Type"] = "application/json"

    # Login
    login_url = f"{api_url}/api/auth/login"
    try:
        r = session.post(login_url, json={"email": args.email.strip().lower(), "password": password})
    except requests.RequestException as e:
        print(f"Error de conexión: {e}")
        sys.exit(1)

    if r.status_code != 200:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        print(f"Error al iniciar sesión: {detail}")
        sys.exit(1)

    data = r.json()
    if data.get("mfa_required"):
        print("Esta cuenta usa MFA. Usa la aplicación web para iniciar sesión.")
        sys.exit(1)
    token = data.get("access_token")
    if not token:
        print("No se recibió token de acceso")
        sys.exit(1)

    session.headers["Authorization"] = f"Bearer {token}"

    # Listar cotizaciones
    list_url = f"{api_url}/api/cotizaciones-en-espera"
    try:
        r = session.get(list_url)
    except requests.RequestException as e:
        print(f"Error al listar cotizaciones: {e}")
        sys.exit(1)

    if r.status_code != 200:
        print(f"Error al listar cotizaciones: {r.status_code} {r.text[:200]}")
        sys.exit(1)

    cotizaciones = r.json()
    con_archivo = [c for c in cotizaciones if c.get("has_archivo")]

    carpeta = Path(args.carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)
    print(f"Carpeta de destino: {carpeta.absolute()}")
    print(f"Cotizaciones con archivo: {len(con_archivo)} de {len(cotizaciones)}")

    descargados = []
    for c in con_archivo:
        cid = c.get("id")
        if cid is None:
            continue
        archivo_url = f"{api_url}/api/cotizaciones-en-espera/{cid}/archivo"
        try:
            r = session.get(archivo_url)
        except requests.RequestException as e:
            print(f"  [{cid}] Error: {e}")
            continue
        if r.status_code != 200:
            print(f"  [{cid}] HTTP {r.status_code}")
            continue
        # Nombre del archivo desde Content-Disposition o por defecto
        cd = r.headers.get("Content-Disposition") or ""
        if 'filename="' in cd:
            nombre = cd.split('filename="', 1)[1].split('"', 1)[0]
        else:
            nombre = f"cotizacion_{cid}"
        nombre = sanitize_filename(nombre)
        # Si ya existe, añadir sufijo para no sobrescribir
        path = carpeta / f"{cid}_{nombre}"
        if path.exists():
            stem, suf = path.stem, path.suffix
            n = 1
            while path.exists():
                path = carpeta / f"{stem}_{n}{suf}"
                n += 1
        path.write_bytes(r.content)
        print(f"  Guardado: {path.name}")
        descargados.append({"id": cid, "archivo": path.name, "descripcion": c.get("descripcion", "")})

    if args.json:
        meta_path = carpeta / "cotizaciones_metadata.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "cotizaciones": cotizaciones,
                    "archivos_descargados": descargados,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )
        print(f"Metadatos guardados en: {meta_path}")

    print("Listo.")


if __name__ == "__main__":
    main()
