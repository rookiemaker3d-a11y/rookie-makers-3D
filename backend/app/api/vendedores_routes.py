from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_admin, get_password_hash
from app.models import Vendedor, User
from app.schemas import VendedorCreate, VendedorResponse, VendedorUpdate

router = APIRouter(prefix="/vendedores", tags=["vendedores"])


@router.get("", response_model=list[VendedorResponse])
async def list_vendedores(_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Solo administrador puede ver la lista de vendedores."""
    result = await db.execute(select(Vendedor).order_by(Vendedor.id))
    vendedores = result.scalars().all()
    if not vendedores:
        return []
    ids = [v.id for v in vendedores]
    users = (await db.execute(select(User).where(User.vendedor_id.in_(ids)))).scalars().all()
    user_by_v = {u.vendedor_id: u.id for u in users}
    return [
        VendedorResponse(
            id=v.id,
            nombre=v.nombre,
            correo=v.correo,
            telefono=v.telefono,
            banco=v.banco,
            cuenta=v.cuenta,
            user_id=user_by_v.get(v.id),
        )
        for v in vendedores
    ]


@router.patch("/{vendedor_id}", response_model=VendedorResponse)
async def update_vendedor(
    vendedor_id: int,
    body: VendedorUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_admin),
):
    """Solo administrador puede editar datos de vendedor (nombre, correo, teléfono, banco, cuenta)."""
    result = await db.execute(select(Vendedor).where(Vendedor.id == vendedor_id))
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(v, key, value)
    await db.commit()
    await db.refresh(v)
    user_id = None
    u = (await db.execute(select(User).where(User.vendedor_id == v.id))).scalar_one_or_none()
    if u:
        user_id = u.id
    return VendedorResponse(
        id=v.id, nombre=v.nombre, correo=v.correo, telefono=v.telefono, banco=v.banco, cuenta=v.cuenta, user_id=user_id
    )
