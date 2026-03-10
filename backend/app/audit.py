"""Registro de auditoría para eventos de seguridad (informe ciberseguridad)."""
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


async def log_audit(
    db: AsyncSession,
    event_type: str,
    *,
    user_id: int | None = None,
    ip: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Registra un evento en audit_log. No hace commit (lo hace quien llama)."""
    entry = AuditLog(
        event_type=event_type,
        user_id=user_id,
        ip=ip,
        details=details or {},
    )
    db.add(entry)
