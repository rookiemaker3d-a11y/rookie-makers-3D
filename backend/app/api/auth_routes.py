from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import get_password_hash, create_access_token, verify_password, require_user, require_admin, get_current_user, get_vendedor_from_user
from app.models import User, Vendedor
from app.schemas import LoginRequest, Token, UserResponse, VendedorCreate, VendedorResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = (data.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    result = await db.execute(
        select(User).where(func.lower(User.email) == email, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password or "", user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = create_access_token(data={"sub": str(user.id)})
    vendedor_nombre = None
    if user.vendedor_id:
        res = await db.execute(select(Vendedor).where(Vendedor.id == user.vendedor_id))
        v = res.scalar_one_or_none()
        if v:
            vendedor_nombre = v.nombre
    return Token(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            vendedor_id=user.vendedor_id,
            vendedor_nombre=vendedor_nombre,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    vendedor_nombre = None
    if user.vendedor_id:
        res = await db.execute(select(Vendedor).where(Vendedor.id == user.vendedor_id))
        v = res.scalar_one_or_none()
        if v:
            vendedor_nombre = v.nombre
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        vendedor_id=user.vendedor_id,
        vendedor_nombre=vendedor_nombre,
    )
