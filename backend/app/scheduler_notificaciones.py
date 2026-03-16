"""Recordatorios por correo cada 30 min hasta que el vendedor entre a la app."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import AsyncSessionLocal
from app.models import CotizacionEnEspera
from app.config import get_settings
from app.email_service import send_cotizacion_lista_notification, MAX_REMINDERS

INTERVAL_MINUTES = 30


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


def start_scheduler():
    """Arranca el scheduler que ejecuta recordatorios cada 30 min."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_enviar_recordatorios, "interval", minutes=INTERVAL_MINUTES, id="recordatorios_cotizacion")
    scheduler.start()
    return scheduler
