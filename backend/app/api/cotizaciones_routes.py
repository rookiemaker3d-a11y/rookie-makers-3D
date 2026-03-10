from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import CotizacionEnEspera, Producto, Vendedor
from app.schemas import CotizacionEnEsperaCreate, CotizacionEnEsperaResponse
from pydantic import BaseModel


class AutorizarVentaRequest(BaseModel):
    ids: list[int]


class CotizacionUpdate(BaseModel):
    detalles: dict | None = None
    fecha: str | None = None


router = APIRouter(prefix="/cotizaciones-en-espera", tags=["cotizaciones"])


@router.get("", response_model=list[CotizacionEnEsperaResponse])
async def list_cotizaciones(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Admin ve todas; vendedor solo las suyas."""
    q = select(CotizacionEnEspera).order_by(CotizacionEnEspera.id.desc())
    if user.role == "vendedor" and vendedor:
        q = q.where(CotizacionEnEspera.vendedor == vendedor.nombre)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CotizacionEnEsperaResponse)
async def create_cotizacion(
    body: CotizacionEnEsperaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    if not vendedor:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Solo vendedores pueden crear cotizaciones en espera")
    c = CotizacionEnEspera(
        vendedor=vendedor.nombre,
        descripcion=body.descripcion,
        cantidad=body.cantidad,
        costo_base=body.costo_base,
        costo_final=body.costo_final,
        fecha=body.fecha or date.today().isoformat(),
        detalles=body.detalles,
    )
    db.add(c)
    await db.flush()
    await db.refresh(c)
    return c


@router.post("/autorizar-venta")
async def autorizar_venta(
    body: AutorizarVentaRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Mueve las cotizaciones seleccionadas a productos (autorizar venta)."""
    ids = body.ids
    for cid in ids:
        result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cid))
        c = result.scalar_one_or_none()
        if c:
            p = Producto(
                descripcion=c.descripcion,
                costo_base=c.costo_base,
                costo_final=c.costo_final,
                cantidad=c.cantidad,
                vendedor=c.vendedor,
                detalles=c.detalles or {},
            )
            db.add(p)
            await db.delete(c)
    return {"ok": True, "count": len(ids)}


@router.patch("/{cotizacion_id}", response_model=CotizacionEnEsperaResponse)
async def update_cotizacion(
    cotizacion_id: int,
    body: CotizacionUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Actualiza detalles (estado del pipeline, etc.) o fecha."""
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if body.detalles is not None:
        c.detalles = {**(c.detalles or {}), **body.detalles}
    if body.fecha is not None:
        c.fecha = body.fecha
    await db.commit()
    await db.refresh(c)
    return c


@router.delete("/{cotizacion_id}")
async def delete_cotizacion(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    await db.delete(c)
    return {"ok": True}
