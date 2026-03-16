"""
Inventario de filamentos: stock por vendedor con nombre, color (auto desde foto), gramos, foto.
Norberto + Daniel comparten el mismo listado; Fidel ve solo el suyo.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import InventarioFilamento, Vendedor
from app.schemas import (
    InventarioFilamentoCreate,
    InventarioFilamentoUpdate,
    InventarioFilamentoResponse,
    ConsumirFilamentoBody,
)

router = APIRouter(prefix="/inventario-filamento", tags=["inventario-filamento"])

# IDs de vendedores que comparten inventario de filamento (Daniel=1, Norberto=3). Fidel=2 aparte.
SHARED_VENDEDOR_IDS = [1, 3]


@router.get("/public", response_model=list[InventarioFilamentoResponse])
async def list_filamentos_public(db: AsyncSession = Depends(get_db)):
    """Listado público para la página web: solo filamentos del grupo compartido (Norberto+Daniel), sin auth."""
    q = (
        select(InventarioFilamento)
        .where(InventarioFilamento.activo == True, InventarioFilamento.vendedor_id.in_(SHARED_VENDEDOR_IDS))
        .order_by(InventarioFilamento.tipo, InventarioFilamento.nombre)
    )
    result = await db.execute(q)
    items = result.scalars().all()
    return [
        InventarioFilamentoResponse(
            id=i.id,
            vendedor_id=i.vendedor_id,
            nombre=i.nombre,
            tipo=i.tipo or "PLA",
            color_hex=i.color_hex,
            color_nombre=i.color_nombre,
            cantidad_gramos=i.cantidad_gramos or 0,
            foto_url=i.foto_url,
            activo=i.activo,
            created_at=i.created_at.isoformat() if i.created_at else None,
        )
        for i in items
    ]


def _can_see_shared(user_role: str, vendedor_id: int | None) -> bool:
    if user_role == "administrador":
        return True
    return vendedor_id is not None and vendedor_id in SHARED_VENDEDOR_IDS


@router.get("", response_model=list[InventarioFilamentoResponse])
async def list_filamentos(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Norberto y Daniel ven los de ambos; Fidel solo los suyos."""
    q = select(InventarioFilamento).where(InventarioFilamento.activo == True).order_by(InventarioFilamento.id.desc())
    if _can_see_shared(user.role, vendedor.id if vendedor else None):
        q = q.where(InventarioFilamento.vendedor_id.in_(SHARED_VENDEDOR_IDS))
    else:
        if not vendedor:
            return []
        q = q.where(InventarioFilamento.vendedor_id == vendedor.id)
    result = await db.execute(q)
    items = result.scalars().all()
    return [
        InventarioFilamentoResponse(
            id=i.id,
            vendedor_id=i.vendedor_id,
            nombre=i.nombre,
            tipo=i.tipo or "PLA",
            color_hex=i.color_hex,
            color_nombre=i.color_nombre,
            cantidad_gramos=i.cantidad_gramos or 0,
            foto_url=i.foto_url,
            activo=i.activo,
            created_at=i.created_at.isoformat() if i.created_at else None,
        )
        for i in items
    ]


@router.post("", response_model=InventarioFilamentoResponse)
async def create_filamento(
    body: InventarioFilamentoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Vendedores crean con su id; admin crea en el grupo compartido (vendedor_id=1)."""
    vendedor_id = vendedor.id if vendedor else (SHARED_VENDEDOR_IDS[0] if user.role == "administrador" else None)
    if vendedor_id is None:
        raise HTTPException(status_code=403, detail="Solo vendedores o administrador pueden agregar filamentos")
    item = InventarioFilamento(
        vendedor_id=vendedor_id,
        nombre=body.nombre,
        tipo=body.tipo or "PLA",
        color_hex=body.color_hex,
        color_nombre=body.color_nombre,
        cantidad_gramos=body.cantidad_gramos or 0,
        foto_url=body.foto_url,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return InventarioFilamentoResponse(
        id=item.id,
        vendedor_id=item.vendedor_id,
        nombre=item.nombre,
        tipo=item.tipo or "PLA",
        color_hex=item.color_hex,
        color_nombre=item.color_nombre,
        cantidad_gramos=item.cantidad_gramos or 0,
        foto_url=item.foto_url,
        activo=item.activo,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.patch("/{item_id}", response_model=InventarioFilamentoResponse)
async def update_filamento(
    item_id: int,
    body: InventarioFilamentoUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Editar: dueño o cualquiera del grupo compartido (o admin)."""
    result = await db.execute(select(InventarioFilamento).where(InventarioFilamento.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    can_edit_shared = _can_see_shared(user.role, vendedor.id if vendedor else None)
    if not can_edit_shared and (not vendedor or item.vendedor_id != vendedor.id):
        raise HTTPException(status_code=403, detail="No puedes editar este filamento")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return InventarioFilamentoResponse(
        id=item.id,
        vendedor_id=item.vendedor_id,
        nombre=item.nombre,
        tipo=item.tipo or "PLA",
        color_hex=item.color_hex,
        color_nombre=item.color_nombre,
        cantidad_gramos=item.cantidad_gramos or 0,
        foto_url=item.foto_url,
        activo=item.activo,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.patch("/{item_id}/consumir", response_model=InventarioFilamentoResponse)
async def consumir_filamento(
    item_id: int,
    body: ConsumirFilamentoBody,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Resta gramos del stock. Solo quien puede ver el filamento puede consumir."""
    result = await db.execute(select(InventarioFilamento).where(InventarioFilamento.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    can_edit = _can_see_shared(user.role, vendedor.id if vendedor else None) or (vendedor and item.vendedor_id == vendedor.id)
    if not can_edit:
        raise HTTPException(status_code=403, detail="No puedes consumir este filamento")
    gramos = body.gramos or 0
    if gramos <= 0:
        raise HTTPException(status_code=400, detail="Gramos debe ser mayor que 0")
    current = item.cantidad_gramos or 0
    if current < gramos:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente (tienes {current} g)")
    item.cantidad_gramos = round(current - gramos, 2)
    await db.commit()
    await db.refresh(item)
    return InventarioFilamentoResponse(
        id=item.id,
        vendedor_id=item.vendedor_id,
        nombre=item.nombre,
        tipo=item.tipo or "PLA",
        color_hex=item.color_hex,
        color_nombre=item.color_nombre,
        cantidad_gramos=item.cantidad_gramos,
        foto_url=item.foto_url,
        activo=item.activo,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.delete("/{item_id}")
async def delete_filamento(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Eliminar: dueño o grupo compartido o admin."""
    result = await db.execute(select(InventarioFilamento).where(InventarioFilamento.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    can_edit = _can_see_shared(user.role, vendedor.id if vendedor else None) or (vendedor and item.vendedor_id == vendedor.id)
    if not can_edit:
        raise HTTPException(status_code=403, detail="No puedes eliminar este filamento")
    await db.delete(item)
    await db.commit()
    return {"ok": True}
