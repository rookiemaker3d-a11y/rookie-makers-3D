from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import Producto, Vendedor
from app.schemas import ProductoCreate, ProductoResponse

router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("", response_model=list[ProductoResponse])
async def list_productos(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    result = await db.execute(select(Producto).order_by(Producto.id.desc()))
    return result.scalars().all()


@router.post("", response_model=ProductoResponse)
async def create_producto(
    body: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    nombre_vendedor = body.vendedor or (vendedor.nombre if vendedor else "Importado")
    p = Producto(
        descripcion=body.descripcion,
        costo_base=body.costo_base,
        costo_final=body.costo_final,
        cantidad=body.cantidad,
        vendedor=nombre_vendedor,
        detalles=body.detalles or {},
    )
    db.add(p)
    await db.flush()
    await db.refresh(p)
    return p


@router.delete("/{producto_id}")
async def delete_producto(
    producto_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    result = await db.execute(select(Producto).where(Producto.id == producto_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.delete(p)
    return {"ok": True}
