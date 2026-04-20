from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user, require_admin
from app.models import Producto, Vendedor
from app.schemas import ProductoCreate, ProductoResponse, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("", response_model=list[ProductoResponse])
async def list_productos(
    for_analysis: bool = False,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Lista productos. Admin ve todos. Vendedor (diseñador) y vendedor_ventas solo los suyos."""
    q = select(Producto).order_by(Producto.id.desc())
    if user.role == "vendedor" and vendedor and for_analysis:
        q = q.where(Producto.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(Producto.vendedor == user.email)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProductoResponse)
async def create_producto(
    body: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """
    Crea un producto. Cualquier usuario autenticado puede crear productos.
    """
    if user.role == "administrador":
        nombre_vendedor = body.vendedor or (vendedor.nombre if vendedor else "Importado")
    elif vendedor:
        nombre_vendedor = vendedor.nombre
    else:
        nombre_vendedor = user.email or user.nombre or str(user.id)
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
    await db.commit()
    await db.refresh(p)
    return p


@router.patch("/{producto_id}", response_model=ProductoResponse)
async def update_producto(
    producto_id: int,
    body: ProductoUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Actualiza detalles y/o costos del producto (recalcular desde análisis)."""
    result = await db.execute(select(Producto).where(Producto.id == producto_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if body.detalles is not None:
        p.detalles = {**(p.detalles or {}), **body.detalles}
    if body.costo_base is not None:
        p.costo_base = body.costo_base
    if body.costo_final is not None:
        p.costo_final = body.costo_final
    await db.flush()
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/{producto_id}")
async def delete_producto(
    producto_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo administrador puede eliminar productos."""
    result = await db.execute(select(Producto).where(Producto.id == producto_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.delete(p)
    await db.commit()
    return {"ok": True}
