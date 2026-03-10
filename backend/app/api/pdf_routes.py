import os
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user
from app.models import Vendedor
from app.schemas import GenerateQuotePDFRequest
from app.services.pdf_service import build_quote_pdf

router = APIRouter(prefix="/pdf", tags=["pdf"])

# Ruta del logo (opcional). Puedes configurarla por env o usar la del config original.
LOGO_PATH = os.environ.get("LOGO_PATH") or os.path.join(os.path.dirname(__file__), "..", "..", "..", "logo.png")


@router.post("/cotizacion")
async def generate_quote_pdf(
    body: GenerateQuotePDFRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
):
    """Genera PDF de cotización o recibo y lo devuelve para descarga en el navegador."""
    items = [item.model_dump() for item in body.items]
    for it in items:
        if "detalles" not in it or not it["detalles"]:
            it["detalles"] = {"tiempo_total": it.get("tiempo_total", 0)}
    vendedor_banco = ""
    vendedor_cuenta = ""
    res = await db.execute(select(Vendedor).where(Vendedor.nombre == body.vendedor_nombre))
    v = res.scalar_one_or_none()
    if v:
        vendedor_banco = v.banco or ""
        vendedor_cuenta = v.cuenta or ""
    pdf_bytes = build_quote_pdf(
        items=items,
        vendedor_nombre=body.vendedor_nombre,
        vendedor_banco=vendedor_banco,
        vendedor_cuenta=vendedor_cuenta,
        tipo=body.tipo,
        logo_path=LOGO_PATH if os.path.isfile(LOGO_PATH) else None,
    )
    filename = "cotizacion.pdf" if body.tipo == "cotizacion" else "recibo_venta.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
