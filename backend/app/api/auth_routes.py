from datetime import date
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import get_password_hash, create_access_token, verify_password, require_user, require_admin, get_current_user, get_vendedor_from_user
from app.models import User, Vendedor
from app.schemas import LoginRequest, Token, UserResponse, VendedorCreate, VendedorResponse, UserPasswordUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

# Bloqueo de cuenta tras 5 intentos fallidos (informe ciberseguridad 1.2 / Fase 1)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
_failed_logins: dict[str, list[float]] = {}  # email -> timestamps


def _clean_failed(email: str) -> None:
    now = time.monotonic()
    window = LOCKOUT_MINUTES * 60
    if email not in _failed_logins:
        return
    _failed_logins[email] = [t for t in _failed_logins[email] if now - t < window]
    if not _failed_logins[email]:
        _failed_logins.pop(email, None)


def is_account_locked(email: str) -> bool:
    _clean_failed(email)
    attempts = _failed_logins.get(email, [])
    return len(attempts) >= MAX_FAILED_ATTEMPTS


def record_failed_login(email: str) -> None:
    now = time.monotonic()
    if email not in _failed_logins:
        _failed_logins[email] = []
    _failed_logins[email].append(now)
    _clean_failed(email)


def clear_failed_logins(email: str) -> None:
    _failed_logins.pop(email, None)


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    email = (data.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if is_account_locked(email):
        raise HTTPException(
            status_code=429,
            detail=f"Cuenta bloqueada por demasiados intentos fallidos. Intente de nuevo en {LOCKOUT_MINUTES} minutos.",
        )
    result = await db.execute(
        select(User).where(func.lower(User.email) == email, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password or "", user.password_hash):
        record_failed_login(email)
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    clear_failed_logins(email)
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


@router.patch("/users/{user_id}/password")
async def set_user_password(
    user_id: int,
    body: UserPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo administrador puede cambiar la contraseña de cualquier usuario."""
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not (body.new_password and len(body.new_password) >= 6):
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    u.password_hash = get_password_hash(body.new_password)
    await db.commit()
    return {"detail": "Contraseña actualizada"}
