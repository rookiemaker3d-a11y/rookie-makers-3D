from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, require_admin, get_vendedor_from_user
from app.models import Producto, User
from app.schemas import DashboardTotals

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/totals", response_model=DashboardTotals)
async def get_totals(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Admin ve todo; vendedor (diseñador) solo sus productos; vendedor_ventas solo los suyos (por email)."""
    q = select(Producto)
    if user.role == "vendedor" and vendedor:
        q = q.where(Producto.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(Producto.vendedor == user.email)
    result = await db.execute(q)
    products = result.scalars().all()
    total_costo = 0.0
    total_venta = 0.0
    for p in products:
        total_costo += p.costo_base or 0
        total_venta += p.costo_final or 0
    ganancia_neta = total_venta - total_costo
    return DashboardTotals(
        total_costo=round(total_costo, 2),
        total_venta=round(total_venta, 2),
        ganancia_neta=round(ganancia_neta, 2),
        cantidad_productos=len(products),
    )
