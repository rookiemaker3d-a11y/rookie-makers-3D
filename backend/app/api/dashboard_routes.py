from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, require_admin
from app.models import Producto
from app.schemas import DashboardTotals

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/totals", response_model=DashboardTotals)
async def get_totals(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    """Consolida datos de productos: Total Costo, Total Venta, Ganancia Neta (product_list_window.py)."""
    result = await db.execute(select(Producto))
    products = result.scalars().all()
    total_costo = 0.0
    total_venta = 0.0
    for p in products:
        costo_produccion = p.costo_base or 0
        costo_envio = (p.detalles or {}).get("costo_envio", 0)
        total_costo += costo_produccion
        total_venta += p.costo_final or 0
    ganancia_neta = total_venta - total_costo
    return DashboardTotals(
        total_costo=round(total_costo, 2),
        total_venta=round(total_venta, 2),
        ganancia_neta=round(ganancia_neta, 2),
        cantidad_productos=len(products),
    )
