from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models import User, Vendedor

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Política de contraseñas (informe ciberseguridad): mín 12 caracteres, complejidad
MIN_PASSWORD_LENGTH = 12
SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~"


def validate_password(password: str) -> tuple[bool, str]:
    """Valida política de contraseña. Retorna (ok, mensaje_error)."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
    if not any(c.isupper() for c in password):
        return False, "La contraseña debe incluir al menos una mayúscula"
    if not any(c.islower() for c in password):
        return False, "La contraseña debe incluir al menos una minúscula"
    if not any(c.isdigit() for c in password):
        return False, "La contraseña debe incluir al menos un número"
    if not any(c in SPECIAL_CHARS for c in password):
        return False, "La contraseña debe incluir al menos un carácter especial (!@#$%^&* etc.)"
    return True, ""


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_mfa_pending_token(user_id: int) -> str:
    """Token de un solo uso para completar login con MFA (válido 5 min)."""
    now = datetime.utcnow()
    expire = now + timedelta(minutes=5)
    return jwt.encode(
        {"sub": str(user_id), "type": "mfa_pending", "exp": expire, "iat": now},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_mfa_pending_token(token: str) -> Optional[int]:
    """Decodifica temp token MFA; retorna user_id o None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "mfa_pending":
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except JWTError:
        return None


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub) if isinstance(sub, str) else sub
    except JWTError:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None
    return user


async def require_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if user.role != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol administrador")
    return user


async def get_vendedor_from_user(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)) -> Optional[Vendedor]:
    if user.role != "vendedor" or user.vendedor_id is None:
        return None
    result = await db.execute(select(Vendedor).where(Vendedor.id == user.vendedor_id))
    return result.scalar_one_or_none()
