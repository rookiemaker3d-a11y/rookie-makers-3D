from __future__ import annotations

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.database import get_db
from app.auth import require_admin
from app.config import get_settings
from app.models import User, PlanSuscripcion, PagoSuscripcion

router = APIRouter(prefix="/suscripciones", tags=["suscripciones"])


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _add_days(dt: datetime, days: int) -> datetime:
    return dt + __import__("datetime").timedelta(days=days)


@router.get("/planes", response_model=list[dict])
async def list_planes(db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    r = await db.execute(select(PlanSuscripcion))
    rows = r.scalars().all()
    return [
        {
            "id": p.id,
            "role": p.role,
            "precio_mxn": float(p.precio_mxn or 0),
            "periodo_dias": int(p.periodo_dias or 30),
            "activo": bool(p.activo),
        }
        for p in rows
    ]


@router.put("/planes", response_model=dict)
async def upsert_planes(body: dict, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    """Body: { planes: [{role, precio_mxn, periodo_dias, activo}] }"""
    planes = body.get("planes") or []
    if not isinstance(planes, list) or not planes:
        raise HTTPException(status_code=400, detail="Body inválido. Usa { planes: [...] }")
    for row in planes:
        if not isinstance(row, dict):
            continue
        role = (row.get("role") or "").strip()
        if not role:
            continue
        r = await db.execute(select(PlanSuscripcion).where(PlanSuscripcion.role == role))
        p = r.scalar_one_or_none()
        if not p:
            p = PlanSuscripcion(role=role)
            db.add(p)
        if row.get("precio_mxn") is not None:
            p.precio_mxn = float(row.get("precio_mxn") or 0)
        if row.get("periodo_dias") is not None:
            p.periodo_dias = int(row.get("periodo_dias") or 30)
        if row.get("activo") is not None:
            p.activo = bool(row.get("activo"))
    await db.commit()
    return {"ok": True}


@router.post("/solicitar-pago", response_model=dict)
async def solicitar_pago(body: dict, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    """
    Crea un link de pago (Mercado Pago preference) y guarda PagoSuscripcion.
    Body: { user_id, plan_role, months }
    """
    settings = get_settings()
    token = (settings.mp_access_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Mercado Pago no configurado (MP_ACCESS_TOKEN).")

    user_id = int(body.get("user_id") or 0)
    plan_role = (body.get("plan_role") or "").strip()
    months = int(body.get("months") or 1)
    months = max(1, min(months, 24))

    ru = await db.execute(select(User).where(User.id == user_id))
    u = ru.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    rp = await db.execute(select(PlanSuscripcion).where(PlanSuscripcion.role == plan_role, PlanSuscripcion.activo == True))
    plan = rp.scalars().first()
    if not plan:
        raise HTTPException(status_code=400, detail="Plan no encontrado o inactivo para ese rol")

    amount = float(plan.precio_mxn or 0) * months
    if amount <= 0:
        raise HTTPException(status_code=400, detail="El plan tiene precio 0; ajusta el precio primero.")

    pago = PagoSuscripcion(
        user_id=u.id,
        plan_role=plan_role,
        provider="mercadopago",
        status="link_creado",
        amount=amount,
        currency="MXN",
        months=months,
        extra_data={"plan_periodo_dias": int(plan.periodo_dias or 30)},
    )
    db.add(pago)
    await db.flush()
    await db.commit()
    await db.refresh(pago)

    # Crear preference
    back_urls = {}
    if (settings.mp_success_url or "").strip():
        back_urls["success"] = settings.mp_success_url.strip()
    if (settings.mp_failure_url or "").strip():
        back_urls["failure"] = settings.mp_failure_url.strip()
    if (settings.mp_pending_url or "").strip():
        back_urls["pending"] = settings.mp_pending_url.strip()

    pref = {
        "items": [
            {
                "title": f"Suscripción {plan_role} ({months} mes(es))",
                "quantity": 1,
                "currency_id": "MXN",
                "unit_price": round(amount, 2),
            }
        ],
        "external_reference": str(pago.id),
        "metadata": {"pago_id": pago.id, "user_id": u.id, "plan_role": plan_role, "months": months},
        "notification_url": "",  # se configura via webhook en MP; lo dejamos vacío aquí
    }
    if back_urls:
        pref["back_urls"] = back_urls
        pref["auto_return"] = "approved"

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://api.mercadopago.com/checkout/preferences",
            headers={"Authorization": f"Bearer {token}"},
            json=pref,
        )
    if r.status_code >= 400:
        pago.status = "error"
        pago.extra_data = {**(pago.extra_data or {}), "mp_error": r.text[:1000]}
        await db.commit()
        raise HTTPException(status_code=502, detail="Error creando link de Mercado Pago")

    data = r.json()
    pago.payment_url = data.get("init_point") or data.get("sandbox_init_point")
    pago.extra_data = {**(pago.extra_data or {}), "mp_preference_id": data.get("id")}
    await db.commit()
    return {"ok": True, "pago_id": pago.id, "payment_url": pago.payment_url}


@router.post("/solicitar-pago-horas", response_model=dict)
async def solicitar_pago_horas(body: dict, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    """
    Link Mercado Pago para vender tiempo (horas). Body: user_id, horas, precio_por_hora_mxn, valid_days (opcional).
    Al aprobar el pago, el webhook suma horas y opcionalmente fija horas_paquete_expira_at.
    """
    settings = get_settings()
    token = (settings.mp_access_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Mercado Pago no configurado (MP_ACCESS_TOKEN).")

    user_id = int(body.get("user_id") or 0)
    horas = float(body.get("horas") or 0)
    pxh = float(body.get("precio_por_hora_mxn") or 0)
    valid_days = int(body.get("valid_days") or 0)
    horas = max(0.5, min(horas, 500.0))
    if pxh <= 0:
        raise HTTPException(status_code=400, detail="precio_por_hora_mxn debe ser > 0")

    ru = await db.execute(select(User).where(User.id == user_id))
    u = ru.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    amount = round(horas * pxh, 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido")

    extra = {
        "kind": "hours_pack",
        "horas": horas,
        "pack_valid_days": valid_days,
        "precio_por_hora_mxn": pxh,
        "plan_periodo_dias": 30,
    }
    pago = PagoSuscripcion(
        user_id=u.id,
        plan_role="horas",
        provider="mercadopago",
        status="link_creado",
        amount=amount,
        currency="MXN",
        months=max(1, int(round(horas))),
        extra_data=extra,
    )
    db.add(pago)
    await db.flush()
    await db.commit()
    await db.refresh(pago)

    back_urls = {}
    if (settings.mp_success_url or "").strip():
        back_urls["success"] = settings.mp_success_url.strip()
    if (settings.mp_failure_url or "").strip():
        back_urls["failure"] = settings.mp_failure_url.strip()
    if (settings.mp_pending_url or "").strip():
        back_urls["pending"] = settings.mp_pending_url.strip()

    vd_txt = f" (válidas {valid_days} días)" if valid_days > 0 else ""
    pref = {
        "items": [
            {
                "title": f"Paquete {horas} h uso plataforma{vd_txt}",
                "quantity": 1,
                "currency_id": "MXN",
                "unit_price": amount,
            }
        ],
        "external_reference": str(pago.id),
        "metadata": {
            "pago_id": pago.id,
            "user_id": u.id,
            "kind": "hours_pack",
            "horas": horas,
        },
        "notification_url": "",
    }
    if back_urls:
        pref["back_urls"] = back_urls
        pref["auto_return"] = "approved"

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://api.mercadopago.com/checkout/preferences",
            headers={"Authorization": f"Bearer {token}"},
            json=pref,
        )
    if r.status_code >= 400:
        pago.status = "error"
        pago.extra_data = {**(pago.extra_data or {}), "mp_error": r.text[:1000]}
        await db.commit()
        raise HTTPException(status_code=502, detail="Error creando link de Mercado Pago")

    data = r.json()
    pago.payment_url = data.get("init_point") or data.get("sandbox_init_point")
    pago.extra_data = {**(pago.extra_data or {}), "mp_preference_id": data.get("id")}
    await db.commit()
    return {"ok": True, "pago_id": pago.id, "payment_url": pago.payment_url}


async def _apply_subscription(db: AsyncSession, u: User, plan_role: str, months: int, periodo_dias: int):
    now = _now_utc()
    base = u.subscription_expires_at
    if base and isinstance(base, datetime):
        if base.tzinfo is None:
            base = base.replace(tzinfo=timezone.utc)
    if not base or base < now:
        base = now
    new_exp = base + timedelta(days=int(periodo_dias or 30) * int(months or 1))
    u.subscription_plan_role = plan_role
    u.subscription_expires_at = new_exp
    u.is_active = True


@router.post("/webhook/mercadopago", response_model=dict)
async def mp_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook Mercado Pago. Estrategia: leer payload, detectar payment_id, consultar a MP con access token.
    Si el pago está approved, aplicar suscripción al usuario.
    """
    settings = get_settings()
    token = (settings.mp_access_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="MP_ACCESS_TOKEN no configurado")

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    # MP puede mandar: { type, data: { id } } o query args
    payment_id = None
    if isinstance(payload, dict):
        data = payload.get("data") or {}
        if isinstance(data, dict) and data.get("id"):
            payment_id = str(data.get("id"))
        if not payment_id and payload.get("id"):
            payment_id = str(payload.get("id"))
    if not payment_id:
        # aceptar sin acción (MP reintenta)
        return {"ok": True, "ignored": True}

    # Consultar payment a MP para estado + external_reference/metadata
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"https://api.mercadopago.com/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    if r.status_code >= 400:
        return {"ok": False, "error": "mp_fetch_failed", "status_code": r.status_code}
    mp = r.json() if isinstance(r.json(), dict) else {}
    status = (mp.get("status") or "").lower()
    ext_ref = str(mp.get("external_reference") or "").strip()
    metadata = mp.get("metadata") or {}

    pago_id = None
    if ext_ref.isdigit():
        pago_id = int(ext_ref)
    elif isinstance(metadata, dict) and str(metadata.get("pago_id") or "").isdigit():
        pago_id = int(metadata.get("pago_id"))
    if not pago_id:
        return {"ok": True, "ignored": True}

    rp = await db.execute(select(PagoSuscripcion).where(PagoSuscripcion.id == pago_id))
    pago = rp.scalar_one_or_none()
    if not pago:
        return {"ok": True, "ignored": True}

    # Idempotencia
    pago.provider_payment_id = payment_id
    pago.extra_data = {**(pago.extra_data or {}), "mp_status": status, "mp_raw": mp}

    if status == "approved":
        pago.status = "aprobado"
        pago.paid_at = _now_utc()
        ru = await db.execute(select(User).where(User.id == pago.user_id))
        u = ru.scalar_one_or_none()
        if u:
            ed = pago.extra_data or {}
            if ed.get("kind") == "hours_pack":
                horas_add = float(ed.get("horas") or 0)
                if horas_add <= 0:
                    horas_add = float(pago.months or 0)
                u.horas_saldo = float(getattr(u, "horas_saldo", 0) or 0) + horas_add
                vd = int(ed.get("pack_valid_days") or 0)
                if vd > 0:
                    u.horas_paquete_expira_at = _now_utc() + timedelta(days=vd)
                u.is_active = True
            else:
                periodo = int(ed.get("plan_periodo_dias") or 30)
                await _apply_subscription(db, u, pago.plan_role, int(pago.months or 1), periodo)
        await db.commit()
        return {"ok": True, "pago_id": pago.id, "status": "approved"}

    if status in ("rejected", "cancelled", "refunded", "charged_back"):
        pago.status = "rechazado"
        await db.commit()
        return {"ok": True, "pago_id": pago.id, "status": status}

    # pending/in_process
    pago.status = "pendiente"
    await db.commit()
    return {"ok": True, "pago_id": pago.id, "status": status}

