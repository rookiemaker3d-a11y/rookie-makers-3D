from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user, require_admin
from app.models import Producto, Vendedor
from app.schemas import ProductoCreate, ProductoResponse

router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("", response_model=list[ProductoResponse])
async def list_productos(
    for_analysis: bool = False,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Lista productos. Si for_analysis=true y es vendedor, solo los suyos (para Análisis). Si no, todos (para listado y cotizaciones)."""
    q = select(Producto).order_by(Producto.id.desc())
    if for_analysis and user.role == "vendedor" and vendedor:
        q = q.where(Producto.vendedor == vendedor.nombre)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProductoResponse)
async def create_producto(
    body: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
    vendedor=Depends(get_vendedor_from_user),
):
    """Solo administrador puede importar/crear productos."""
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
    _admin=Depends(require_admin),
):
    """Solo administrador puede eliminar productos."""
    result = await db.execute(select(Producto).where(Producto.id == producto_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.delete(p)
    return {"ok": True}
