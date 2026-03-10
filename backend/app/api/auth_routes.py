from datetime import date
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import get_password_hash, create_access_token, create_mfa_pending_token, decode_mfa_pending_token, verify_password, require_user, require_admin, get_current_user, get_vendedor_from_user, validate_password
from app.models import User, Vendedor
from app.schemas import LoginRequest, Token, UserResponse, VendedorCreate, VendedorResponse, UserPasswordUpdate
from app.audit import log_audit
from app.config import get_settings

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


def _client_ip(request: Request) -> str:
    """IP del cliente (considerando proxy X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    email = (data.email or "").strip().lower()
    ip = _client_ip(request)
    if not email:
        await log_audit(db, "login_failed", ip=ip, details={"reason": "email_empty"})
        await db.commit()
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if is_account_locked(email):
        await log_audit(db, "login_failed", ip=ip, details={"email": email, "reason": "account_locked"})
        await db.commit()
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
        await log_audit(db, "login_failed", ip=ip, details={"email": email, "reason": "invalid_credentials"})
        await db.commit()
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    clear_failed_logins(email)
    await log_audit(db, "login_success", user_id=user.id, ip=ip, details={"email": email})
    # Si tiene MFA activado, devolver temp token para segundo factor
    if getattr(user, "mfa_enabled", False) and getattr(user, "mfa_secret", None):
        temp_token = create_mfa_pending_token(user.id)
        return {
            "mfa_required": True,
            "temp_token": temp_token,
            "email": user.email,
        }
    token = create_access_token(data={"sub": str(user.id)})
    vendedor_nombre = None
    if user.vendedor_id:
        res = await db.execute(select(Vendedor).where(Vendedor.id == user.vendedor_id))
        v = res.scalar_one_or_none()
        if v:
            vendedor_nombre = v.nombre
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "vendedor_id": user.vendedor_id,
            "vendedor_nombre": vendedor_nombre,
        },
    }


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
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo administrador puede cambiar la contraseña de cualquier usuario. Política: mín 12 caracteres, mayúscula, minúscula, número, carácter especial."""
    ok, msg = validate_password(body.new_password or "")
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.password_hash = get_password_hash(body.new_password)
    await log_audit(
        db, "password_changed",
        user_id=_admin.id,
        ip=_client_ip(request),
        details={"target_user_id": user_id, "target_email": u.email},
    )
    await db.commit()
    return {"detail": "Contraseña actualizada"}


@router.get("/audit-log")
async def list_audit_log(
    limit: int = 100,
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Solo administrador. Lista últimos eventos de auditoría (login, cambios de contraseña)."""
    from sqlalchemy import select, desc
    from app.models import AuditLog
    q = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(min(limit, 500))
    if event_type:
        q = q.where(AuditLog.event_type == event_type)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "event_type": r.event_type,
            "user_id": r.user_id,
            "ip": r.ip,
            "details": r.details or {},
        }
        for r in rows
    ]


# ----- MFA TOTP (informe ciberseguridad) -----
def _get_mfa_secret_for_user(user: User) -> str | None:
    return getattr(user, "mfa_secret", None) or (user.mfa_secret if hasattr(user, "mfa_secret") else None)


@router.post("/mfa/verify-login")
async def mfa_verify_login(
    body: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Segundo paso del login cuando el usuario tiene MFA: temp_token + código TOTP."""
    import pyotp
    temp_token = body.get("temp_token") or body.get("tempToken")
    code = (body.get("code") or "").strip().replace(" ", "")
    if not temp_token or not code:
        raise HTTPException(status_code=400, detail="Faltan temp_token y código")
    user_id = decode_mfa_pending_token(temp_token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Sesión MFA expirada. Vuelva a iniciar sesión.")
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    secret = _get_mfa_secret_for_user(user)
    if not secret:
        raise HTTPException(status_code=400, detail="MFA no configurado para esta cuenta")
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        await log_audit(db, "login_failed", user_id=user.id, ip=_client_ip(request), details={"reason": "mfa_invalid_code"})
        await db.commit()
        raise HTTPException(status_code=401, detail="Código incorrecto o expirado")
    await log_audit(db, "login_success", user_id=user.id, ip=_client_ip(request), details={"email": user.email, "mfa": True})
    token = create_access_token(data={"sub": str(user.id)})
    vendedor_nombre = None
    if user.vendedor_id:
        res = await db.execute(select(Vendedor).where(Vendedor.id == user.vendedor_id))
        v = res.scalar_one_or_none()
        if v:
            vendedor_nombre = v.nombre
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role, "vendedor_id": user.vendedor_id, "vendedor_nombre": vendedor_nombre},
    }


@router.get("/mfa/status")
async def mfa_status(user: User = Depends(require_user)):
    """Indica si el usuario tiene MFA activado."""
    return {"mfa_enabled": bool(getattr(user, "mfa_enabled", False))}


@router.post("/mfa/setup")
async def mfa_setup(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    """Genera secreto TOTP y URI para escanear con app de autenticación. No activa MFA hasta confirmar."""
    import pyotp
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    user.mfa_enabled = False  # se activa al confirmar con un código
    await db.commit()
    totp = pyotp.TOTP(secret)
    settings = get_settings()
    app_name = getattr(settings, "app_name", "Rookie Makers 3D ERP")
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name=app_name)
    return {"secret": secret, "provisioning_uri": provisioning_uri, "message": "Escanea el QR con tu app (Google Authenticator, Authy, etc.) y luego confirma con POST /api/auth/mfa/confirm"}


@router.post("/mfa/confirm")
async def mfa_confirm(body: dict, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    """Confirma activación de MFA con un código TOTP generado por la app."""
    import pyotp
    code = (body.get("code") or "").strip().replace(" ", "")
    if not code:
        raise HTTPException(status_code=400, detail="Falta el código")
    secret = _get_mfa_secret_for_user(user)
    if not secret:
        raise HTTPException(status_code=400, detail="Primero llama a POST /api/auth/mfa/setup")
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto o expirado")
    user.mfa_enabled = True
    await db.commit()
    return {"detail": "MFA activado correctamente"}


@router.post("/mfa/disable")
async def mfa_disable(body: dict, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    """Desactiva MFA. Requiere código TOTP actual para confirmar."""
    import pyotp
    code = (body.get("code") or "").strip().replace(" ", "")
    secret = _get_mfa_secret_for_user(user)
    if not secret:
        return {"detail": "MFA no estaba activado"}
    if not code:
        raise HTTPException(status_code=400, detail="Indica el código TOTP actual para desactivar MFA")
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=401, detail="Código incorrecto")
    user.mfa_secret = None
    user.mfa_enabled = False
    await db.commit()
    return {"detail": "MFA desactivado"}
