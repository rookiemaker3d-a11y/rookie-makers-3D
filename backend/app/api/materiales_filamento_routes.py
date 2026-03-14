from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user
from app.models import MaterialFilamento
from app.schemas import MaterialFilamentoResponse, MaterialFilamentoUpdate

router = APIRouter(prefix="/materiales-filamento", tags=["materiales-filamento"])


@router.get("", response_model=list[MaterialFilamentoResponse])
async def list_materiales(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    """Lista todos los filamentos/materiales con su costo por kg. Visible para cualquier usuario autenticado."""
    result = await db.execute(
        select(MaterialFilamento).where(MaterialFilamento.activo == True).order_by(MaterialFilamento.orden, MaterialFilamento.id)
    )
    return result.scalars().all()


@router.patch("/{material_id}", response_model=MaterialFilamentoResponse)
async def update_material(
    material_id: int,
    body: MaterialFilamentoUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Actualiza costo por kg (y opcionalmente nombre/activo) de un material."""
    result = await db.execute(select(MaterialFilamento).where(MaterialFilamento.id == material_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m
