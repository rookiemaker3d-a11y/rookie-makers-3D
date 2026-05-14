from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import Venta, Vendedor
from app.schemas import VentaCreate, VentaUpdate, VentaResponse, VentaResumenMes, VentaResumenVendedor

router = APIRouter(prefix="/ventas", tags=["ventas"])


@router.get("", response_model=list[VentaResponse])
async def list_ventas(
    desde: str | None = None,
    hasta: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Lista ventas. Admin ve todas; vendedor solo las suyas."""
    q = select(Venta).order_by(Venta.id.desc())
    if user.role == "vendedor" and vendedor:
        q = q.where(Venta.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(Venta.vendedor == user.email)
    if desde:
        q = q.where(Venta.fecha >= desde)
    if hasta:
        q = q.where(Venta.fecha <= hasta)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=VentaResponse)
async def create_venta(
    body: VentaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Crea una venta manualmente (desde cero o desde un producto autorizado)."""
    vendedor_nombre = vendedor.nombre if vendedor else (user.email or user.nombre or str(user.id))
    if user.role == "vendedor" and vendedor:
        vendedor_nombre = vendedor.nombre
    v = Venta(
        cliente_id=body.cliente_id,
        cliente_nombre=body.cliente_nombre,
        productos=[p.model_dump() for p in (body.productos or [])],
        total=body.total,
        ganancia_neta=body.ganancia_neta or 0,
        vendedor=vendedor_nombre,
        fecha=body.fecha or date.today().isoformat(),
        notas=body.notas,
    )
    db.add(v)
    await db.flush()
    await db.commit()
    await db.refresh(v)
    return v


@router.patch("/{venta_id}", response_model=VentaResponse)
async def update_venta(
    venta_id: int,
    body: VentaUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Actualiza una venta (solo admin o el vendedor propietario)."""
    result = await db.execute(select(Venta).where(Venta.id == venta_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if user.role != "administrador":
        if user.role == "vendedor" and vendedor and v.vendedor != vendedor.nombre:
            raise HTTPException(status_code=403, detail="No puedes editar esta venta")
        if user.role == "vendedor_ventas" and v.vendedor != user.email:
            raise HTTPException(status_code=403, detail="No puedes editar esta venta")
    if body.cliente_id is not None:
        v.cliente_id = body.cliente_id
    if body.cliente_nombre is not None:
        v.cliente_nombre = body.cliente_nombre
    if body.productos is not None:
        v.productos = [p.model_dump() for p in body.productos]
    if body.total is not None:
        v.total = body.total
    if body.ganancia_neta is not None:
        v.ganancia_neta = body.ganancia_neta
    if body.vendedor is not None:
        v.vendedor = body.vendedor
    if body.fecha is not None:
        v.fecha = body.fecha
    if body.notas is not None:
        v.notas = body.notas
    await db.flush()
    await db.commit()
    await db.refresh(v)
    return v


@router.delete("/{venta_id}")
async def delete_venta(
    venta_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Elimina una venta (solo admin o el vendedor propietario)."""
    result = await db.execute(select(Venta).where(Venta.id == venta_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if user.role != "administrador":
        if user.role == "vendedor" and vendedor and v.vendedor != vendedor.nombre:
            raise HTTPException(status_code=403, detail="No puedes eliminar esta venta")
        if user.role == "vendedor_ventas" and v.vendedor != user.email:
            raise HTTPException(status_code=403, detail="No puedes eliminar esta venta")
    await db.delete(v)
    await db.commit()
    return {"ok": True}


@router.get("/resumen/mes", response_model=list[VentaResumenMes])
async def resumen_por_mes(
    desde: str | None = None,
    hasta: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Resumen de ventas agrupado por mes (YYYY-MM)."""
    q = (
        select(
            func.strftime("%Y-%m", Venta.fecha).label("mes"),
            func.sum(Venta.total).label("total_ventas"),
            func.sum(Venta.ganancia_neta).label("total_ganancia"),
            func.count(Venta.id).label("cantidad"),
        )
        .group_by(func.strftime("%Y-%m", Venta.fecha))
        .order_by(func.strftime("%Y-%m", Venta.fecha).desc())
    )
    if user.role == "vendedor" and vendedor:
        q = q.where(Venta.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(Venta.vendedor == user.email)
    if desde:
        q = q.where(Venta.fecha >= desde)
    if hasta:
        q = q.where(Venta.fecha <= hasta)
    result = await db.execute(q)
    rows = result.fetchall()
    return [
        VentaResumenMes(
            mes=str(r.mes),
            total_ventas=float(r.total_ventas or 0),
            total_ganancia=float(r.total_ganancia or 0),
            cantidad=int(r.cantidad or 0),
        )
        for r in rows
    ]


@router.get("/resumen/vendedor", response_model=list[VentaResumenVendedor])
async def resumen_por_vendedor(
    desde: str | None = None,
    hasta: str | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
):
    """Resumen de ventas agrupado por vendedor. Solo admin."""
    if user.role != "administrador":
        raise HTTPException(status_code=403, detail="Solo administrador puede ver resumen por vendedor")
    q = (
        select(
            Venta.vendedor.label("vendedor"),
            func.sum(Venta.total).label("total_ventas"),
            func.sum(Venta.ganancia_neta).label("total_ganancia"),
            func.count(Venta.id).label("cantidad"),
        )
        .group_by(Venta.vendedor)
        .order_by(func.sum(Venta.total).desc())
    )
    if desde:
        q = q.where(Venta.fecha >= desde)
    if hasta:
        q = q.where(Venta.fecha <= hasta)
    result = await db.execute(q)
    rows = result.fetchall()
    return [
        VentaResumenVendedor(
            vendedor=str(r.vendedor),
            total_ventas=float(r.total_ventas or 0),
            total_ganancia=float(r.total_ganancia or 0),
            cantidad=int(r.cantidad or 0),
        )
        for r in rows
    ]
