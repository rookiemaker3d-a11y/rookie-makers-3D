"""Endpoints ligeros para el asistente del ERP (sin exponer costos cruzados)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import require_user
from app.models import MaterialFilamento, InventarioFilamento, CotizacionEnEspera

router = APIRouter(prefix="/asistente", tags=["asistente"])

# Mismo criterio que inventario-filamento compartido (Norberto + Daniel)
SHARED_VENDEDOR_IDS = [1, 3]
UMBRAL_GRAMOS_BAJO = 250


@router.get("/materiales-resumen")
async def materiales_resumen(db: AsyncSession = Depends(get_db), user=Depends(require_user)):
    """
    Tipos de material (catálogo) y colores en inventario de filamento (sin gramos ni costos).
    """
    r_mats = await db.execute(
        select(MaterialFilamento.nombre).where(MaterialFilamento.activo == True).order_by(MaterialFilamento.orden)
    )
    tipos = [row[0] for row in r_mats.all() if row[0]]

    q_inv = select(InventarioFilamento.tipo, InventarioFilamento.color_nombre).where(
        InventarioFilamento.activo == True,
        InventarioFilamento.vendedor_id.in_(SHARED_VENDEDOR_IDS),
    )
    r_inv = await db.execute(q_inv)
    por_tipo: dict[str, set[str]] = {}
    for tipo, color in r_inv.all():
        t = (tipo or "PLA").strip() or "PLA"
        c = (color or "").strip()
        if not c:
            continue
        por_tipo.setdefault(t, set()).add(c)

    return {
        "tipos_material": tipos,
        "colores_por_tipo": {k: sorted(v) for k, v in sorted(por_tipo.items())},
        "nota_privacidad": "No se muestran costos ni gramos de otros usuarios. Para costo por kg usa Inventario → Costos de filamentos (según tu rol).",
    }


@router.get("/buscar")
async def buscar(
    q: str = Query("", min_length=1),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
):
    """Busca cotizaciones recientes por folio o descripción (filtrado en memoria, portable)."""
    needle = q.strip().lower()
    stmt = select(CotizacionEnEspera).order_by(CotizacionEnEspera.id.desc()).limit(120)
    r = await db.execute(stmt)
    rows = r.scalars().all()
    out = []
    for c in rows:
        det = c.detalles or {}
        folio = str(det.get("folio") or "")
        desc = c.descripcion or ""
        proyecto = str(det.get("proyecto") or "")
        blob = f"{desc} {folio} {proyecto}".lower()
        if needle not in blob:
            continue
        out.append(
            {
                "id": c.id,
                "descripcion": c.descripcion,
                "folio": det.get("folio"),
                "estado": det.get("estado", "espera"),
                "total": float(c.costo_final or 0),
                "proyecto": det.get("proyecto"),
            }
        )
        if len(out) >= 12:
            break
    return {"resultados": out, "ayuda": "Abre «Cotizaciones espera» en el menú para ver el detalle. Ruta: /cotizaciones-espera"}


@router.post("/notificar-filamento-bajo")
async def notificar_filamento_bajo(db: AsyncSession = Depends(get_db), user=Depends(require_user)):
    """Solo admin: envía correo con bobinas bajo umbral (requiere SMTP configurado)."""
    if user.role != "administrador":
        return {"ok": False, "mensaje": "Solo administrador puede enviar alertas."}

    from app.email_service import send_email

    q = select(InventarioFilamento).where(
        InventarioFilamento.activo == True,
        InventarioFilamento.vendedor_id.in_(SHARED_VENDEDOR_IDS),
        InventarioFilamento.cantidad_gramos < UMBRAL_GRAMOS_BAJO,
    )
    r = await db.execute(q)
    items = r.scalars().all()
    if not items:
        return {"ok": True, "mensaje": "No hay bobinas por debajo del umbral.", "enviado": False}

    lines = [f"- {i.nombre} ({i.tipo or 'PLA'}) {i.color_nombre or ''}: {i.cantidad_gramos or 0} g" for i in items]
    body = "Filamento bajo umbral ({} g):\n\n{}\n\nRevisa Inventario → Filamento en la app.".format(
        UMBRAL_GRAMOS_BAJO, "\n".join(lines)
    )
    ok = send_email(user.email, "[Rookie] Filamento bajo stock", body, None)
    return {"ok": ok, "mensaje": "Correo enviado." if ok else "SMTP no configurado o error al enviar.", "items": len(items)}
