from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, require_admin
from app.models import Vendedor
from app.schemas import VendedorCreate, VendedorResponse

router = APIRouter(prefix="/vendedores", tags=["vendedores"])


@router.get("", response_model=list[VendedorResponse])
async def list_vendedores(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    result = await db.execute(select(Vendedor).order_by(Vendedor.id))
    return result.scalars().all()
