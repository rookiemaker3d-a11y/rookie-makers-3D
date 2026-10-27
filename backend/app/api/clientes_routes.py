from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, require_admin
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteResponse])
async def list_clientes(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    result = await db.execute(select(Cliente).order_by(Cliente.id.desc()))
    return result.scalars().all()


@router.post("", response_model=ClienteResponse)
async def create_cliente(
    body: ClienteCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    nombre = (body.nombre or "").strip()
    telefono = (body.telefono or "").strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    if not telefono:
        raise HTTPException(status_code=400, detail="El teléfono es obligatorio")
    correo = (body.correo or "").strip() or "N/A"
    direccion = (body.direccion or "").strip() or "N/A"
    c = Cliente(
        nombre=nombre,
        correo=correo,
        telefono=telefono,
        direccion=direccion,
    )
    db.add(c)
    await db.flush()
    await db.refresh(c)
    return c
