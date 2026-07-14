"""Endpoints PÚBLICOS para órdenes de compra desde la landing (www.rookiemakers3d.com).

Flujo:
1. Cliente hace click en "Comprar" en un producto
2. Llena el modal (nombre, mensaje opcional, precio si el producto no tiene)
3. Se hace POST a /api/compras
4. El backend guarda la orden en BD
5. El backend manda email automático a norbertomoro4@gmail.com y rookiemaker3d@gmail.com
6. Se devuelve al frontend el link wa.me/5214721488913?text=... pre-armado
"""
from urllib.parse import quote
import html
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import OrdenCompra
from app.schemas import OrdenCompraCreate, OrdenCompraResponse
from app.email_service import send_email

router = APIRouter(prefix="/compras", tags=["compras"])

WHATSAPP_NUM = "5214721488913"
# Destinatarios del email de notificación. Se mandan en CCO/BCC para que Norberto
# reciba la alerta y la cuenta Gmail siga siendo la misma (límite SMTP).
EMAIL_DESTINATARIOS = [
    "norbertomoro4@gmail.com",
    "rookiemaker3d@gmail.com",
]


def _armar_whatsapp_url(producto: str, precio: float, nombre: str) -> str:
    """Arma un link wa.me/5214721488913?text=... con el mensaje pre-armado."""
    precio_fmt = f"${precio:,.2f} MXN"
    texto = (
        f"Hola Rookie Makers 3D 👋\n"
        f"Vi en su web el producto \"{producto}\" "
        f"({precio_fmt}) y me interesa.\n"
        f"Mi nombre es {nombre}."
    )
    return f"https://wa.me/{WHATSAPP_NUM}?text={quote(texto)}"


def _armar_email_orden(orden: OrdenCompra) -> tuple[str, str, str]:
    """Arma el asunto, cuerpo texto plano y cuerpo HTML del email de notificación."""
    precio_fmt = f"${orden.precio_unitario:,.2f} MXN"
    nota_precio = ""
    if orden.precio_ingresado_por_cliente:
        nota_precio = (
            "<p style='color:#b45309;background:#fef3c7;padding:8px;border-radius:4px;'>"
            "<strong>Nota:</strong> el cliente ingresó este precio porque el producto no tenía precio público definido."
            "</p>"
        )
    asunto = f"🛒 Nueva orden de compra #{orden.id} - {orden.producto_descripcion}"
    # Escapar campos controlados por el cliente para evitar inyección HTML/phishing en el email.
    prod_esc = html.escape(orden.producto_descripcion or "")
    nombre_esc = html.escape(orden.cliente_nombre or "")
    mensaje_html = html.escape(orden.cliente_mensaje) if orden.cliente_mensaje else "<em>(sin mensaje)</em>"
    texto = (
        f"Nueva orden de compra desde la landing\n\n"
        f"ID: #{orden.id}\n"
        f"Producto: {orden.producto_descripcion}\n"
        f"Precio: {precio_fmt}\n"
        f"{'Precio ingresado por el cliente (no tenía precio público).' if orden.precio_ingresado_por_cliente else ''}\n"
        f"Cliente: {orden.cliente_nombre}\n"
        f"Mensaje: {orden.cliente_mensaje or '(sin mensaje)'}\n"
        f"IP: {orden.ip or 'N/A'}\n"
        f"Fecha: {orden.created_at.isoformat() if orden.created_at else 'N/A'}\n"
    )
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">🛒 Nueva orden de compra</h2>
      <p>Has recibido una nueva solicitud de compra desde <strong>www.rookiemakers3d.com</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;width:35%;">ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">#{orden.id}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Producto</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">{prod_esc}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Precio</td>
            <td style="padding:8px;border:1px solid #e5e7eb;"><strong>{precio_fmt}</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Cliente</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">{nombre_esc}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Mensaje</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">{mensaje_html}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Fecha</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">{orden.created_at.isoformat() if orden.created_at else 'N/A'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">IP</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">{orden.ip or 'N/A'}</td></tr>
      </table>
      {nota_precio}
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Esta orden fue creada desde la landing pública. Contacta al cliente por WhatsApp o email para cerrar la venta.</p>
    </div>
    """
    return asunto, texto, html


@router.post("", response_model=OrdenCompraResponse, status_code=201)
async def crear_orden_compra(
    body: OrdenCompraCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Crea una orden de compra desde la landing. PÚBLICO (sin auth).
    Guarda en BD + manda email a norbertomoro4@gmail.com y rookiemaker3d@gmail.com.
    """
    ip = request.client.host if request.client else None
    orden = OrdenCompra(
        producto_id=body.producto_id,
        producto_catalogo_id=body.producto_catalogo_id,
        producto_descripcion=body.producto_descripcion,
        precio_unitario=float(body.precio_unitario or 0),
        precio_ingresado_por_cliente=bool(body.precio_ingresado_por_cliente),
        cliente_nombre=body.cliente_nombre.strip(),
        cliente_mensaje=(body.cliente_mensaje or "").strip() or None,
        user_agent=(body.user_agent or "")[:500] if body.user_agent else None,
        ip=ip,
    )
    db.add(orden)
    await db.commit()
    await db.refresh(orden)

    # Armar link wa.me pre-armado para devolver al frontend
    whatsapp_url = _armar_whatsapp_url(
        orden.producto_descripcion, orden.precio_unitario, orden.cliente_nombre
    )

    # Mandar email de notificación (a ambos destinatarios). No bloquea si falla.
    try:
        asunto, texto, html = _armar_email_orden(orden)
        for to_email in EMAIL_DESTINATARIOS:
            send_email(to_email, asunto, texto, html)
    except Exception as e:
        # Log pero no fallar la orden (la compra ya quedó registrada)
        print(f"[compras] No se pudo notificar por email: {e}")

    return OrdenCompraResponse(
        id=orden.id,
        producto_descripcion=orden.producto_descripcion,
        precio_unitario=orden.precio_unitario,
        cliente_nombre=orden.cliente_nombre,
        estado=orden.estado,
        created_at=orden.created_at,
        whatsapp_url=whatsapp_url,
    )
