"""Recordatorios por correo cada 30 min hasta que el vendedor entre a la app."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import AsyncSessionLocal
from app.models import CotizacionEnEspera, AlertaProgramada, User, AppSetting
from app.config import get_settings
from app.email_service import send_cotizacion_lista_notification, MAX_REMINDERS
from app.email_service import send_email
from app.email_service import send_suscripcion_pago_reminder

INTERVAL_MINUTES = 30
ALERTAS_INTERVAL_SECONDS = 30
SUSCRIPCIONES_INTERVAL_MINUTES = 10


async def _enviar_recordatorios():
    """Envía un recordatorio por correo a vendedores con cotización lista que no han entrado a la app."""
    settings = get_settings()
    if not getattr(settings, "smtp_user", None) or not getattr(settings, "smtp_password", None):
        return
    app_url = (getattr(settings, "app_base_url", None) or "").strip() or "http://localhost:5173"
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=INTERVAL_MINUTES)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(CotizacionEnEspera))
        items = result.scalars().all()
        for c in items:
            d = c.detalles or {}
            if d.get("estado_cotizacion_vendedor") != "cotizado" or d.get("visto_por_vendedor"):
                continue
            if d.get("reminder_count", 0) >= MAX_REMINDERS:
                continue
            last_str = d.get("last_email_sent_at")
            if last_str:
                try:
                    last = datetime.fromisoformat(last_str.replace("Z", "+00:00"))
                    if last.tzinfo is None:
                        last = last.replace(tzinfo=timezone.utc)
                    if last > cutoff:
                        continue
                except Exception:
                    pass
            to_email = (c.vendedor or "").strip()
            if not to_email or "@" not in to_email:
                continue
            send_cotizacion_lista_notification(
                to_email, c.descripcion or "Cotización", float(c.costo_final or 0), app_url
            )
            d["last_email_sent_at"] = now.isoformat()
            d["reminder_count"] = d.get("reminder_count", 0) + 1
            c.detalles = d
        await db.commit()


async def _enviar_alertas_programadas():
    """Envía alertas programadas (admin) cuando llega su hora."""
    settings = get_settings()
    if not getattr(settings, "smtp_user", None) or not getattr(settings, "smtp_password", None):
        return
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        r = await db.execute(
            select(AlertaProgramada).where(
                AlertaProgramada.status == "pendiente",
                AlertaProgramada.send_at <= now,
            )
        )
        rows = r.scalars().all()
        for a in rows:
            ok_all = True
            for to in (a.to_emails or []):
                ok = send_email(to, a.titulo, a.mensaje, None)
                ok_all = ok_all and ok
            a.sent_at = now
            a.status = "enviado" if ok_all else "error"
            a.last_error = None if ok_all else "Algún correo falló (SMTP o dirección inválida)."
        await db.commit()


async def _cerrar_perfiles_expirados():
    """Cierra perfiles cuyo subscription_expires_at ya venció (excepto admin)."""
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User))
        users = r.scalars().all()
        changed = 0
        for u in users:
            if getattr(u, "role", "") == "administrador":
                continue
            exp = getattr(u, "subscription_expires_at", None)
            if not exp:
                continue
            if isinstance(exp, datetime) and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp and exp < now and u.is_active:
                u.is_active = False
                changed += 1
        if changed:
            await db.commit()


async def _alertas_automaticas_suscripcion_on(db) -> bool:
    try:
        r = await db.execute(select(AppSetting).where(AppSetting.key == "alertas_automaticas_suscripcion"))
        row = r.scalar_one_or_none()
        if not row or row.value_json is None:
            return True
        return bool((row.value_json or {}).get("enabled", True))
    except Exception:
        return True


async def _expirar_paquetes_horas():
    """Si venció horas_paquete_expira_at, pone saldo de horas en 0 (modelo tipo ciber)."""
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User))
        changed = False
        for u in r.scalars().all():
            exp = getattr(u, "horas_paquete_expira_at", None)
            if not exp:
                continue
            if isinstance(exp, datetime) and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now and float(getattr(u, "horas_saldo", 0) or 0) > 0:
                u.horas_saldo = 0.0
                u.horas_paquete_expira_at = None
                changed = True
        if changed:
            await db.commit()


async def _recordatorios_suscripcion_pago():
    """Correo a usuario + admin cuando la suscripción vence en ≤7 días o ya venció (máx. cada ~6 días por usuario)."""
    settings = get_settings()
    if not getattr(settings, "smtp_user", None) or not getattr(settings, "smtp_password", None):
        return
    now = datetime.now(timezone.utc)
    admin_em = (getattr(settings, "admin_notify_email", None) or "").strip() or (settings.smtp_user or "").strip()
    app_url = (getattr(settings, "app_base_url", None) or "").strip() or "http://localhost:5173"
    async with AsyncSessionLocal() as db:
        if not await _alertas_automaticas_suscripcion_on(db):
            return
        r = await db.execute(select(User))
        users = r.scalars().all()
        for u in users:
            if getattr(u, "role", "") == "administrador":
                continue
            if getattr(u, "recibir_alertas_suscripcion", True) is False:
                continue
            exp = getattr(u, "subscription_expires_at", None)
            if not exp:
                continue
            if isinstance(exp, datetime) and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            dias = int((exp - now).total_seconds() // 86400)
            if dias > 7:
                continue
            last = getattr(u, "subscription_reminder_sent_at", None)
            if last:
                if isinstance(last, datetime) and last.tzinfo is None:
                    last = last.replace(tzinfo=timezone.utc)
                if (now - last).total_seconds() < 6 * 86400:
                    continue
            ok = send_suscripcion_pago_reminder(
                u.email, admin_em, dias, exp.isoformat(), app_url
            )
            if ok:
                u.subscription_reminder_sent_at = now
        await db.commit()


def start_scheduler():
    """Arranca el scheduler que ejecuta recordatorios cada 30 min."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_enviar_recordatorios, "interval", minutes=INTERVAL_MINUTES, id="recordatorios_cotizacion")
    scheduler.add_job(_enviar_alertas_programadas, "interval", seconds=ALERTAS_INTERVAL_SECONDS, id="alertas_programadas")
    scheduler.add_job(_cerrar_perfiles_expirados, "interval", minutes=SUSCRIPCIONES_INTERVAL_MINUTES, id="cerrar_perfiles_expirados")
    scheduler.add_job(_recordatorios_suscripcion_pago, "interval", hours=24, id="recordatorios_suscripcion_pago")
    scheduler.add_job(_expirar_paquetes_horas, "interval", hours=1, id="expirar_paquetes_horas")
    scheduler.start()
    return scheduler
