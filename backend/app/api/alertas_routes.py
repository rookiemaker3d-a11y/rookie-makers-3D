from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.auth import require_admin, require_user
from app.models import AlertaProgramada
from app.schemas import AlertaCreate, AlertaUpdate
from app.email_service import send_email

router = APIRouter(prefix="/alertas", tags=["alertas"])


def _parse_iso_dt(v: str) -> datetime:
    try:
        dt = datetime.fromisoformat((v or "").replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="send_at inválido. Usa ISO 8601, ej: 2026-04-06T18:30:00-06:00")
    if dt.tzinfo is None:
        # si viene sin tz, asumimos UTC para no romper
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _clean_emails(items: list[str]) -> list[str]:
    out: list[str] = []
    for e in (items or []):
        s = (e or "").strip().lower()
        if not s or "@" not in s:
            continue
        if s not in out:
            out.append(s)
    return out


@router.get("", response_model=list[dict])
async def list_alertas(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(AlertaProgramada).order_by(desc(AlertaProgramada.id)).limit(200))
    rows = r.scalars().all()
    return [
        {
            "id": a.id,
            "titulo": a.titulo,
            "mensaje": a.mensaje,
            "to_emails": a.to_emails or [],
            "send_at": a.send_at.isoformat() if a.send_at else None,
            "status": a.status,
            "sent_at": a.sent_at.isoformat() if a.sent_at else None,
            "last_error": a.last_error,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "created_by_user_id": a.created_by_user_id,
        }
        for a in rows
    ]


@router.post("", response_model=dict)
async def create_alerta(
    body: AlertaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    _admin=Depends(require_admin),
):
    emails = _clean_emails(body.to_emails)
    if not emails:
        raise HTTPException(status_code=400, detail="Agrega al menos un correo válido en to_emails.")
    send_at = _parse_iso_dt(body.send_at)
    # Si viene en el pasado, se enviará en el siguiente tick del scheduler.
    a = AlertaProgramada(
        created_by_user_id=user.id,
        titulo=(body.titulo or "").strip() or "Alerta",
        mensaje=(body.mensaje or "").strip() or "",
        to_emails=emails,
        send_at=send_at,
        status="pendiente",
    )
    db.add(a)
    await db.flush()
    await db.commit()
    await db.refresh(a)
    return {"ok": True, "id": a.id}


@router.patch("/{alerta_id}", response_model=dict)
async def update_alerta(
    alerta_id: int,
    body: AlertaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(AlertaProgramada).where(AlertaProgramada.id == alerta_id))
    a = r.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if body.titulo is not None:
        a.titulo = (body.titulo or "").strip() or a.titulo
    if body.mensaje is not None:
        a.mensaje = (body.mensaje or "").strip()
    if body.to_emails is not None:
        emails = _clean_emails(body.to_emails)
        if not emails:
            raise HTTPException(status_code=400, detail="to_emails vacío o inválido")
        a.to_emails = emails
    if body.send_at is not None:
        a.send_at = _parse_iso_dt(body.send_at)
    if body.status is not None:
        st = (body.status or "").strip().lower()
        if st in ("cancelado", "cancelar"):
            a.status = "cancelado"
        elif st in ("pendiente", "enviado", "error"):
            a.status = st
    await db.commit()
    await db.refresh(a)
    return {"ok": True}


@router.post("/{alerta_id}/enviar-ahora", response_model=dict)
async def enviar_ahora(
    alerta_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(AlertaProgramada).where(AlertaProgramada.id == alerta_id))
    a = r.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if a.status == "cancelado":
        raise HTTPException(status_code=400, detail="Alerta cancelada")
    ok_all = True
    for to in (a.to_emails or []):
        ok = send_email(to, a.titulo, a.mensaje, None)
        ok_all = ok_all and ok
    a.sent_at = datetime.now(timezone.utc)
    a.status = "enviado" if ok_all else "error"
    a.last_error = None if ok_all else "Algún correo falló (SMTP no configurado o error)."
    await db.commit()
    return {"ok": ok_all}

