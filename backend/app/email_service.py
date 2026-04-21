"""Envío de correo por Gmail SMTP. Configura SMTP_* en .env o variables de entorno."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings

# Máximo recordatorios por cotización (cada 30 min = 24 en 12 h)
MAX_REMINDERS = 24


def _smtp_configured():
    s = get_settings()
    return bool(getattr(s, "smtp_user", None) and getattr(s, "smtp_password", None))


def send_email(to_email: str, subject: str, body_text: str, body_html: str | None = None) -> bool:
    """Envía un correo. to_email debe ser una dirección válida. Devuelve True si se envió."""
    if not to_email or "@" not in str(to_email):
        return False
    s = get_settings()
    user = getattr(s, "smtp_user", None)
    password = getattr(s, "smtp_password", None)
    host = getattr(s, "smtp_host", "smtp.gmail.com")
    port = int(getattr(s, "smtp_port", "587"))
    from_addr = getattr(s, "email_from", None) or user
    if not user or not password:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to_email
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_addr, [to_email], msg.as_string())
        return True
    except Exception:
        return False


def send_password_changed_notification(to_email: str) -> bool:
    """Envía correo informando que la contraseña fue cambiada (verificación por Gmail)."""
    subject = "Contraseña actualizada - Rookie Makers 3D"
    text = "Hola,\n\nTu contraseña de la app Rookie Makers 3D fue cambiada correctamente.\n\nSi no fuiste tú, contacta al administrador.\n\nSaludos,\nRookie Makers 3D"
    html = """
    <p>Hola,</p>
    <p>Tu contraseña de la app <strong>Rookie Makers 3D</strong> fue cambiada correctamente.</p>
    <p>Si no fuiste tú, contacta al administrador.</p>
    <p>Saludos,<br/>Rookie Makers 3D</p>
    """
    return send_email(to_email, subject, text, html)


def send_suscripcion_pago_reminder(
    user_email: str,
    admin_email: str,
    dias_restantes: int | None,
    vence_iso: str | None,
    app_url: str,
) -> bool:
    """Aviso: renovar suscripción / pago pendiente. Envía al usuario y al admin."""
    subj_user = "Recordatorio: suscripción / pago - Rookie Makers 3D"
    dias_txt = f"Quedan aprox. {dias_restantes} día(s)." if dias_restantes is not None else "Revisa tu plan en la app."
    vence_txt = f"Vencimiento: {vence_iso}." if vence_iso else ""
    body_u = (
        f"Hola,\n\n{dias_txt} {vence_txt}\n\n"
        f"Entra a la app para coordinar el pago o ver tu estado:\n{app_url}\n\nRookie Makers 3D"
    )
    ok_u = send_email(user_email, subj_user, body_u, None)
    subj_a = f"[Admin] Pago / suscripción: {user_email}"
    body_a = (
        f"El usuario {user_email} tiene aviso de suscripción/pago.\n\n{dias_txt} {vence_txt}\n\n"
        f"Panel: {app_url}\n"
    )
    ok_a = send_email(admin_email, subj_a, body_a, None) if admin_email and admin_email != user_email else True
    return ok_u and ok_a


def send_cotizacion_lista_notification(to_email: str, descripcion: str, total: float, app_url: str) -> bool:
    """Notificación: tu cotización está lista."""
    subject = "Tu cotización está lista - Rookie Makers 3D"
    text = f"Hola,\n\nTu cotización está lista.\n\nDescripción: {descripcion}\nTotal: ${total:.2f} MXN\n\nEntra a la app para ver el detalle y gastos de empaque/envío:\n{app_url}\n\nSaludos,\nRookie Makers 3D"
    html = f"""
    <p>Hola,</p>
    <p>Tu cotización está lista.</p>
    <p><strong>Descripción:</strong> {descripcion}<br/>
    <strong>Total:</strong> ${total:.2f} MXN</p>
    <p><a href="{app_url}">Entrar a la app</a> para ver el detalle y gastos de empaque/envío.</p>
    <p>Saludos,<br/>Rookie Makers 3D</p>
    """
    return send_email(to_email, subject, text, html)
