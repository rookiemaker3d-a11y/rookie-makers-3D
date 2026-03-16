from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_admin, get_password_hash, validate_password
from app.models import Vendedor, User
from app.schemas import VendedorCreate, VendedorCreateWithUser, VendedorResponse, VendedorUpdate
from app.services.card_crypto import encrypt_card_number, card_last4

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
            clabe=getattr(v, "clabe", None),
            tarjeta_ultimos4=getattr(v, "tarjeta_ultimos4", None),
            user_id=user_by_v.get(v.id),
        )
        for v in vendedores
    ]


@router.post("", response_model=VendedorResponse, status_code=201)
async def create_vendedor(
    body: VendedorCreateWithUser,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_admin),
):
    """Solo administrador. Crea un nuevo diseñador/vendedor y opcionalmente un usuario para login."""
    correo = (body.correo or "").strip().lower()
    if not correo:
        raise HTTPException(status_code=400, detail="El correo es obligatorio")
    existing_v = await db.execute(select(Vendedor).where(Vendedor.correo == correo))
    if existing_v.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya existe un diseñador/vendedor con ese correo")
    if body.password:
        existing_u = await db.execute(select(User).where(User.email == correo))
        if existing_u.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo")
    password = (body.password or "").strip()
    if password:
        ok, msg = validate_password(password)
        if not ok:
            raise HTTPException(status_code=400, detail=msg)
    v = Vendedor(
        nombre=(body.nombre or "").strip(),
        correo=correo,
        telefono=(body.telefono or "").strip() or None,
        banco=(body.banco or "").strip() or None,
        cuenta=(body.cuenta or "").strip() or None,
        clabe=(body.clabe or "").strip() or None,
    )
    db.add(v)
    await db.flush()
    user_id = None
    if password:
        u = User(
            email=v.correo,
            password_hash=get_password_hash(password),
            role="vendedor",
            vendedor_id=v.id,
            is_active=True,
        )
        db.add(u)
        await db.flush()
        user_id = u.id
    await db.commit()
    await db.refresh(v)
    return VendedorResponse(
        id=v.id,
        nombre=v.nombre,
        correo=v.correo,
        telefono=v.telefono,
        banco=v.banco,
        cuenta=v.cuenta,
        clabe=getattr(v, "clabe", None),
        tarjeta_ultimos4=getattr(v, "tarjeta_ultimos4", None),
        user_id=user_id,
    )


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
    tarjeta_numero = data.pop("tarjeta_numero", None)
    for key, value in data.items():
        setattr(v, key, value)
    if tarjeta_numero:
        last4 = card_last4(tarjeta_numero)
        v.tarjeta_ultimos4 = last4
        v.tarjeta_enc = encrypt_card_number(tarjeta_numero)
    await db.commit()
    await db.refresh(v)
    user_id = None
    u = (await db.execute(select(User).where(User.vendedor_id == v.id))).scalar_one_or_none()
    if u:
        user_id = u.id
    return VendedorResponse(
        id=v.id,
        nombre=v.nombre,
        correo=v.correo,
        telefono=v.telefono,
        banco=v.banco,
        cuenta=v.cuenta,
        clabe=getattr(v, "clabe", None),
        tarjeta_ultimos4=getattr(v, "tarjeta_ultimos4", None),
        user_id=user_id,
    )
