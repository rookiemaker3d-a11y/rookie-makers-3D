from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import CotizacionEnEspera, Producto, Vendedor, ArchivoCotizacion, InventarioFilamento, InventarioItem
from app.schemas import CotizacionEnEsperaCreate, CotizacionEnEsperaResponse
from app.config import get_settings
from app.email_service import send_cotizacion_lista_notification
from pydantic import BaseModel


class AutorizarVentaRequest(BaseModel):
    ids: list[int]
    catalogo: str | None = None


class CotizacionUpdate(BaseModel):
    detalles: dict | None = None
    fecha: str | None = None
    costo_base: float | None = None
    costo_final: float | None = None


router = APIRouter(prefix="/cotizaciones-en-espera", tags=["cotizaciones"])


def _can_access_cotizacion(user, vendedor, c: CotizacionEnEspera) -> bool:
    if user.role == "administrador":
        return True
    if user.role == "vendedor" and vendedor and c.vendedor == vendedor.nombre:
        return True
    if user.role == "vendedor_ventas" and c.vendedor == user.email:
        return True
    return False


@router.get("", response_model=list[CotizacionEnEsperaResponse])
async def list_cotizaciones(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Admin ve todas; vendedor (diseñador) solo las suyas; vendedor_ventas solo las suyas (por email)."""
    q = select(CotizacionEnEspera).order_by(CotizacionEnEspera.id.desc())
    if user.role == "vendedor" and vendedor:
        q = q.where(CotizacionEnEspera.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(CotizacionEnEspera.vendedor == user.email)
    result = await db.execute(q)
    items = result.scalars().all()
    # Quiénes tienen archivo adjunto
    ids_with_file = set()
    if items:
        qa = select(ArchivoCotizacion.cotizacion_id).where(
            ArchivoCotizacion.cotizacion_id.in_([c.id for c in items])
        ).distinct()
        ra = await db.execute(qa)
        ids_with_file = {r[0] for r in ra.fetchall()}
    return [
        CotizacionEnEsperaResponse.model_validate(c).model_copy(update={"has_archivo": c.id in ids_with_file})
        for c in items
    ]


@router.get("/{cotizacion_id}", response_model=CotizacionEnEsperaResponse)
async def get_cotizacion(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Obtiene una cotización por ID. Mismos permisos que el listado."""
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if not _can_access_cotizacion(user, vendedor, c):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cotización")
    archivo_row = await db.execute(
        select(ArchivoCotizacion.id).where(ArchivoCotizacion.cotizacion_id == cotizacion_id).limit(1)
    )
    tiene_archivo = archivo_row.scalar_one_or_none() is not None
    return CotizacionEnEsperaResponse.model_validate(c).model_copy(update={"has_archivo": tiene_archivo})


@router.post("/{cotizacion_id}/archivo")
async def upload_archivo(
    cotizacion_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Sube o reemplaza el archivo adjunto de una cotización. Un archivo por cotización."""
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if not _can_access_cotizacion(user, vendedor, c):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cotización")
    content = await file.read()
    nombre_original = (file.filename or "archivo").strip() or "archivo"
    content_type = (file.content_type or "application/octet-stream").strip() or "application/octet-stream"
    await db.execute(delete(ArchivoCotizacion).where(ArchivoCotizacion.cotizacion_id == cotizacion_id))
    archivo = ArchivoCotizacion(
        cotizacion_id=cotizacion_id,
        nombre_original=nombre_original,
        content_type=content_type,
        content=content,
    )
    db.add(archivo)
    await db.commit()
    return {"ok": True, "cotizacion_id": cotizacion_id}


@router.get("/{cotizacion_id}/archivo")
async def download_archivo(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Descarga el archivo adjunto de una cotización."""
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if not _can_access_cotizacion(user, vendedor, c):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cotización")
    ra = await db.execute(
        select(ArchivoCotizacion).where(ArchivoCotizacion.cotizacion_id == cotizacion_id).limit(1)
    )
    archivo = ra.scalar_one_or_none()
    if not archivo:
        raise HTTPException(status_code=404, detail="No hay archivo adjunto")
    return Response(
        content=archivo.content,
        media_type=archivo.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{archivo.nombre_original}"',
        },
    )


@router.post("", response_model=CotizacionEnEsperaResponse)
async def create_cotizacion(
    body: CotizacionEnEsperaCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    d = body.detalles or {}
    vendedor_nombre = None
    if user.role == "administrador" and isinstance(d, dict):
        vend_email = (d.get("vendedor_email") or "").strip()
        vend_nombre = (d.get("vendedor_nombre") or "").strip()
        vendedor_nombre = vend_email or vend_nombre
    if not vendedor_nombre:
        vendedor_nombre = vendedor.nombre if vendedor else None
    if not vendedor_nombre:
        vendedor_nombre = user.email or user.nombre or str(user.id)
    c = CotizacionEnEspera(
        vendedor=vendedor_nombre,
        descripcion=body.descripcion,
        cantidad=body.cantidad,
        costo_base=body.costo_base,
        costo_final=body.costo_final,
        fecha=body.fecha or date.today().isoformat(),
        detalles=body.detalles,
    )
    db.add(c)
    await db.flush()
    await db.commit()
    await db.refresh(c)
    return c



async def _descontar_inventario(db: AsyncSession, detalles: dict, vendedor_nombre: str) -> list[str]:
    """Descuenta materiales extra y filamento del inventario al autorizar una venta.
    Retorna una lista de advertencias (stock insuficiente, item no encontrado, etc.).
    """
    warnings: list[str] = []
    if not isinstance(detalles, dict):
        return warnings

    # --- 1. Buscar vendedor por nombre para obtener su ID ---
    vendedor_id: int | None = None
    vend_result = await db.execute(select(Vendedor).where(Vendedor.nombre == vendedor_nombre))
    vend = vend_result.scalar_one_or_none()
    if vend:
        vendedor_id = vend.id

    # --- 2. Descontar materiales extra (InventarioItem) ---
    materiales_extra = detalles.get("materiales_extra")
    if isinstance(materiales_extra, list):
        for m in materiales_extra:
            if not isinstance(m, dict):
                continue
            inv_id = m.get("inventario_id")
            cantidad = float(m.get("cantidad") or 0)
            nombre = m.get("nombre") or "Material"
            if not inv_id or cantidad <= 0:
                continue
            item_result = await db.execute(select(InventarioItem).where(InventarioItem.id == int(inv_id)))
            item = item_result.scalar_one_or_none()
            if not item:
                warnings.append(f"Material extra '{nombre}' (ID {inv_id}) no encontrado en inventario.")
                continue
            stock_actual = float(item.cantidad or 0)
            if stock_actual < cantidad:
                warnings.append(
                    f"Stock insuficiente para '{nombre}': hay {stock_actual} {item.unidad or 'pza'}, "
                    f"se requieren {cantidad}. Se descontó lo disponible y quedó en 0."
                )
                item.cantidad = 0
            else:
                item.cantidad = round(stock_actual - cantidad, 2)

    # --- 3. Descontar filamento (InventarioFilamento) ---
    # Extraer consumos de filamento: cotización simple o líneas de producto
    consumos_filamento: list[tuple[str, float]] = []  # [(tipo, gramos), ...]

    lineas = detalles.get("lineas")
    if isinstance(lineas, list) and len(lineas) > 0:
        for ln in lineas:
            if not isinstance(ln, dict):
                continue
            tipo = (ln.get("tipo_material") or "").strip()
            gramos = float(ln.get("gramos_estimados") or 0)
            if tipo and gramos > 0:
                consumos_filamento.append((tipo, gramos))
    else:
        # Cotización simple
        tipo = (detalles.get("tipo_material") or "").strip()
        gramos = float(detalles.get("gramos") or 0)
        if tipo and gramos > 0:
            consumos_filamento.append((tipo, gramos))

    for tipo, gramos in consumos_filamento:
        # Buscar filamento del vendedor o del grupo compartido
        q = (
            select(InventarioFilamento)
            .where(
                InventarioFilamento.activo == True,
                InventarioFilamento.tipo.ilike(tipo),
            )
            .order_by(InventarioFilamento.cantidad_gramos.desc())
        )
        if vendedor_id:
            # Si conocemos al vendedor, priorizar sus filamentos; si no, usar grupo compartido
            q = q.where(InventarioFilamento.vendedor_id == vendedor_id)
        else:
            # Fallback: grupo compartido (Norberto + Daniel)
            q = q.where(InventarioFilamento.vendedor_id.in_([1, 3]))

        result = await db.execute(q)
        filamento = result.scalar_one_or_none()
        if not filamento:
            warnings.append(f"No hay filamento '{tipo}' en inventario para descontar {gramos} g.")
            continue
        stock_actual = float(filamento.cantidad_gramos or 0)
        if stock_actual < gramos:
            warnings.append(
                f"Stock insuficiente de filamento '{tipo}' ({filamento.nombre}): "
                f"hay {stock_actual} g, se requieren {gramos} g. Se descontó lo disponible y quedó en 0."
            )
            filamento.cantidad_gramos = 0
        else:
            filamento.cantidad_gramos = round(stock_actual - gramos, 2)

    return warnings


@router.post("/autorizar-venta")
async def autorizar_venta(
    body: AutorizarVentaRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Mueve las cotizaciones seleccionadas a productos (autorizar venta).
    Descuenta automáticamente materiales extra e InventarioFilamento.
    """
    ids = body.ids
    catalogo = (body.catalogo or "").strip().lower() or "general"
    all_warnings: list[str] = []
    for cid in ids:
        result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cid))
        c = result.scalar_one_or_none()
        if c:
            d = c.detalles or {}
            lineas = d.get("lineas") if isinstance(d, dict) else None
            modo = (d.get("modoProductos") or "unico") if isinstance(d, dict) else "unico"
            kit_nombre = (d.get("kitNombre") or "").strip() if isinstance(d, dict) else ""
            detalles_producto = {**d, "catalogo": catalogo}

            # Descuento automático de inventario
            warnings = await _descontar_inventario(db, d, c.vendedor or "")
            all_warnings.extend(warnings)

            # Si la cotización trae múltiples partidas (Nueva cotización), decidir si se autoriza como kit o por partida
            if isinstance(lineas, list) and len(lineas) > 0:
                if modo == "kit":
                    nombre = kit_nombre or c.descripcion
                    p = Producto(
                        descripcion=f"KIT: {nombre}",
                        costo_base=c.costo_base,
                        costo_final=c.costo_final,
                        cantidad=1,
                        vendedor=c.vendedor,
                        detalles={**detalles_producto, "tipo_producto": "kit"},
                    )
                    db.add(p)
                else:
                    # Un producto por partida
                    for l in lineas:
                        if not isinstance(l, dict):
                            continue
                        nombre_prod = (l.get("nombre_producto") or c.descripcion or "Producto").strip()
                        cant = float(l.get("cantidad") or 1)
                        costo_base_total = float(l.get("costo_base_total") or l.get("costo_final") or 0)
                        costo_final = float(l.get("costo_final") or 0)
                        p = Producto(
                            descripcion=nombre_prod,
                            costo_base=costo_base_total,
                            costo_final=costo_final,
                            cantidad=cant,
                            vendedor=c.vendedor,
                            detalles={**detalles_producto, "tipo_producto": "unico", "linea": l},
                        )
                        db.add(p)
                await db.delete(c)
            else:
                # Cotización simple (una sola pieza)
                p = Producto(
                    descripcion=c.descripcion,
                    costo_base=c.costo_base,
                    costo_final=c.costo_final,
                    cantidad=c.cantidad,
                    vendedor=c.vendedor,
                    detalles=detalles_producto,
                )
                db.add(p)
                await db.delete(c)
    await db.commit()
    return {"ok": True, "count": len(ids), "warnings": all_warnings or None}


@router.patch("/{cotizacion_id}", response_model=CotizacionEnEsperaResponse)
async def update_cotizacion(
    cotizacion_id: int,
    body: CotizacionUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Actualiza detalles (estado del pipeline, estado_cotizacion_vendedor, etc.), fecha o costos."""
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if body.detalles is not None:
        c.detalles = {**(c.detalles or {}), **body.detalles}
    if body.fecha is not None:
        c.fecha = body.fecha
    if body.costo_base is not None:
        c.costo_base = body.costo_base
    if body.costo_final is not None:
        c.costo_final = body.costo_final
    await db.commit()
    await db.refresh(c)
    # Enviar correo al vendedor cuando se marca como cotizado (vendedor_ventas = email en c.vendedor)
    detalles_final = c.detalles or {}
    if detalles_final.get("estado_cotizacion_vendedor") == "cotizado":
        to_email = (c.vendedor or "").strip()
        if to_email and "@" in to_email:
            try:
                settings = get_settings()
                app_url = (getattr(settings, "app_base_url", None) or "").strip() or "http://localhost:5173"
                send_cotizacion_lista_notification(to_email, c.descripcion or "Cotización", float(c.costo_final or 0), app_url)
                detalles_final["last_email_sent_at"] = datetime.now(timezone.utc).isoformat()
                detalles_final["reminder_count"] = detalles_final.get("reminder_count", 0)
                c.detalles = detalles_final
                await db.commit()
                await db.refresh(c)
            except Exception:
                pass
    return c


@router.post("/marcar-vistas")
async def marcar_cotizaciones_vistas(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
):
    """Vendedor de ventas: marca todas sus cotizaciones 'cotizado' como vistas. Deja de enviar recordatorios por correo."""
    if user.role != "vendedor_ventas":
        return {"ok": True, "marked": 0}
    result = await db.execute(
        select(CotizacionEnEspera).where(CotizacionEnEspera.vendedor == user.email)
    )
    items = result.scalars().all()
    marked = 0
    for c in items:
        d = c.detalles or {}
        if d.get("estado_cotizacion_vendedor") == "cotizado" and not d.get("visto_por_vendedor"):
            d["visto_por_vendedor"] = True
            c.detalles = d
            marked += 1
    await db.commit()
    return {"ok": True, "marked": marked}


@router.delete("/{cotizacion_id}")
async def delete_cotizacion(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    result = await db.execute(select(CotizacionEnEspera).where(CotizacionEnEspera.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    await db.delete(c)
    await db.commit()
    return {"ok": True}
