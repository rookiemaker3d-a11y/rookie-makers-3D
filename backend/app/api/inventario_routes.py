from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import InventarioItem
from app.models import User
from app.schemas import InventarioItemCreate, InventarioItemResponse, InventarioItemUpdate

router = APIRouter(prefix="/inventario", tags=["inventario"])


@router.get("", response_model=list[InventarioItemResponse])
async def list_inventario(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Admin ve todo; vendedor solo lo que él subió (vendedor_id = su id)."""
    q = select(InventarioItem).order_by(InventarioItem.id.desc())
    if user.role == "vendedor" and vendedor:
        q = q.where(InventarioItem.vendedor_id == vendedor.id)
    result = await db.execute(q)
    items = result.scalars().all()
    return [
        InventarioItemResponse(
            id=i.id,
            nombre=i.nombre,
            descripcion=i.descripcion,
            cantidad=i.cantidad,
            unidad=i.unidad or "pza",
            vendedor_id=i.vendedor_id,
            created_at=i.created_at.isoformat() if i.created_at else None,
        )
        for i in items
    ]


@router.post("", response_model=InventarioItemResponse)
async def create_item(
    body: InventarioItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Vendedor sube a su inventario; admin puede subir (queda sin vendedor_id)."""
    vendedor_id = vendedor.id if (user.role == "vendedor" and vendedor) else None
    item = InventarioItem(
        nombre=body.nombre,
        descripcion=body.descripcion,
        cantidad=body.cantidad,
        unidad=body.unidad or "pza",
        vendedor_id=vendedor_id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return InventarioItemResponse(
        id=item.id,
        nombre=item.nombre,
        descripcion=item.descripcion,
        cantidad=item.cantidad,
        unidad=item.unidad or "pza",
        vendedor_id=item.vendedor_id,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.patch("/{item_id}", response_model=InventarioItemResponse)
async def update_item(
    item_id: int,
    body: InventarioItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Vendedor solo puede editar los suyos; admin puede editar cualquiera."""
    result = await db.execute(select(InventarioItem).where(InventarioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    if user.role == "vendedor" and (not vendedor or item.vendedor_id != vendedor.id):
        raise HTTPException(status_code=403, detail="Solo puedes editar tu propio inventario")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return InventarioItemResponse(
        id=item.id,
        nombre=item.nombre,
        descripcion=item.descripcion,
        cantidad=item.cantidad,
        unidad=item.unidad or "pza",
        vendedor_id=item.vendedor_id,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Vendedor solo puede eliminar los suyos; admin cualquiera."""
    result = await db.execute(select(InventarioItem).where(InventarioItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    if user.role == "vendedor" and (not vendedor or item.vendedor_id != vendedor.id):
        raise HTTPException(status_code=403, detail="Solo puedes eliminar tu propio inventario")
    await db.delete(item)
    await db.commit()
    return {"ok": True}
