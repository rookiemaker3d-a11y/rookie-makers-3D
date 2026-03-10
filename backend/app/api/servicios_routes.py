from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user
from app.models import Servicio

router = APIRouter(prefix="/servicios", tags=["servicios"])


@router.get("")
async def list_servicios(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    result = await db.execute(select(Servicio).order_by(Servicio.id))
    return [{"id": s.id, "nombre": s.nombre, "tarifa_fija": s.tarifa_fija, "tarifa_por_hora": s.tarifa_por_hora} for s in result.scalars().all()]
