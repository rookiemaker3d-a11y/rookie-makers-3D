from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_admin
from app.models import PaginaPublicaConfig
from app.schemas import PaginaPublicaConfigUpdate

router = APIRouter(prefix="/pagina-publica", tags=["pagina-publica"])

CLAVE = "estilos"


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
