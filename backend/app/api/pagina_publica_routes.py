from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from copy import deepcopy

from app.database import get_db
from app.auth import require_admin
from app.models import PaginaPublicaConfig
from app.schemas import PaginaPublicaConfigUpdate, LandingUpdate

router = APIRouter(prefix="/pagina-publica", tags=["pagina-publica"])

CLAVE = "estilos"
CLAVE_LANDING = "landing"

# Valores por defecto de la landing (alineados con rookie-makers-3d / Del Bit al Átomo)
DEFAULT_LANDING = {
    "theme": "cyan",
    "hero": {
        "tag": "Impresión 3D profesional",
        "titleLine1": "Del Bit",
        "titleLine2": "al Átomo",
        "titleAccent": "al Átomo",
        "tagline": "Precisión que transforma ideas en realidad",
        "description": "Diseño, prototipado y fabricación aditiva para empresas y creadores.",
        "ctaPrimary": "Solicitar cotización",
        "ctaSecondary": "Ver galería",
    },
    "stats": [
        {"value": "500+", "label": "Piezas entregadas"},
        {"value": "0.05", "label": "mm precisión"},
        {"value": "24/7", "label": "Producción"},
    ],
    "process": [
        {"number": "01", "title": "Diseño", "text": "Recibimos tu archivo o idea y lo preparamos para impresión."},
        {"number": "02", "title": "Fabricación", "text": "Impresión con materiales de calidad y control de parámetros."},
        {"number": "03", "title": "Entrega", "text": "Acabado y entrega en tiempo y forma."},
    ],
    "gallery": [
        {"label": "Prototipos", "name": "Prototipos industriales"},
        {"label": "Piezas", "name": "Piezas funcionales"},
        {"label": "Arte", "name": "Arte y decoración"},
    ],
    "cta": {
        "tag": "¿Listo para empezar?",
        "title": "Cuéntanos tu proyecto",
        "subtitle": "Cotización sin compromiso.",
        "buttonText": "Contactar",
        "buttonMailto": "mailto:contacto@ejemplo.com",
        "whatsappText": "https://wa.me/521234567890",
    },
    "footer": {
        "logoText": "Rookie Makers",
        "copyright": "© 2025 Rookie Makers. Todos los derechos reservados.",
        "links": [
            {"label": "Inicio", "href": "#"},
            {"label": "Servicios", "href": "#servicios"},
            {"label": "Contacto", "href": "#contacto"},
        ],
    },
    "nav": {
        "links": [
            {"label": "Inicio", "href": "#"},
            {"label": "Proceso", "href": "#proceso"},
            {"label": "Galería", "href": "#galeria"},
            {"label": "Contacto", "href": "#contacto"},
        ],
        "ctaText": "Cotizar",
    },
}


def _deep_merge(base: dict, update: dict) -> dict:
    """Merge update into base recursively; lists are replaced (no merge)."""
    result = deepcopy(base)
    for k, v in update.items():
        if k not in result:
            result[k] = deepcopy(v)
        elif isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = _deep_merge(result[k], v)
        else:
            result[k] = deepcopy(v)
    return result


@router.get("/config")
async def get_config(db: AsyncSession = Depends(get_db)):
    """Público: obtiene la config de estilos/categorías para la landing (sin auth)."""
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE))
    row = r.scalar_one_or_none()
    if not row or not row.valor:
        return {
            "fontSizeTitle": 32,
            "fontSizeSubtitle": 18,
            "backgroundColor": "",
            "categories": ["oficina", "escuela", "industrial", "hogar", "otros"],
        }
    return row.valor


@router.put("/config")
async def update_config(
    body: PaginaPublicaConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo admin: actualiza tamaños, fondo y categorías de la página pública."""
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE))
    row = r.scalar_one_or_none()
    data = body.model_dump(exclude_unset=True)
    if not data:
        return {"detail": "Sin cambios"}
    if not row:
        row = PaginaPublicaConfig(clave=CLAVE, valor={})
        db.add(row)
        await db.flush()
    current = row.valor or {}
    current.update(data)
    row.valor = current
    await db.commit()
    await db.refresh(row)
    return row.valor


@router.get("/landing")
async def get_landing(db: AsyncSession = Depends(get_db)):
    """Público: devuelve el contenido completo de la landing (theme + hero, stats, etc.) con valores por defecto si no existe."""
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE_LANDING))
    row = r.scalar_one_or_none()
    if not row or not row.valor:
        return deepcopy(DEFAULT_LANDING)
    merged = _deep_merge(DEFAULT_LANDING, row.valor)
    return merged


@router.put("/landing")
async def update_landing(
    body: LandingUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo admin: actualiza el contenido de la landing (merge con lo guardado)."""
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE_LANDING))
    row = r.scalar_one_or_none()
    data = body.model_dump(exclude_unset=True)
    if not data:
        return {"detail": "Sin cambios"}
    if not row:
        row = PaginaPublicaConfig(clave=CLAVE_LANDING, valor={})
        db.add(row)
        await db.flush()
    current = row.valor or {}
    current = _deep_merge(current, data)
    row.valor = current
    await db.commit()
    await db.refresh(row)
    merged = _deep_merge(DEFAULT_LANDING, row.valor)
    return merged
