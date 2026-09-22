from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user, get_vendedor_from_user
from app.models import Servicio, CotizacionServicio, Venta, Producto

router = APIRouter(prefix="/servicios", tags=["servicios"])

MARCAS_IMPRESORA = [
    "Creality",
    "Ender (Creality)",
    "Bambu Lab",
    "Anycubic",
    "Prusa",
    "Elegoo",
    "Flashforge",
    "Artillery",
    "Sovol",
    "Ultimaker",
    "Voron",
    "Otra",
]

# Flujo igual que piezas: cotizando → espera confirmación → pagado → terminado (+ informe PDF)
ESTADOS_SERVICIO = [
    "cotizando",
    "espera_confirmacion",
    "pagado",
    "terminado",
]
ESTADO_ALIASES = {
    "borrador": "cotizando",
    "finalizada": "terminado",
    "finalizado": "terminado",
}


def _norm_estado(estado: str | None) -> str:
    e = (estado or "cotizando").strip().lower()
    e = ESTADO_ALIASES.get(e, e)
    if e not in ESTADOS_SERVICIO:
        return "cotizando"
    return e


CONCEPTOS_CATALOGO = [
    {"id": "S001", "concepto": "Mantenimiento", "descripcion": "Limpieza y lubricación", "precio": 300.0},
    {"id": "S002", "concepto": "Reparación", "descripcion": "Reparación de daños en impresión", "precio": 500.0},
    {"id": "S003", "concepto": "Diagnóstico", "descripcion": "Diagnóstico técnico", "precio": 200.0},
]


class MaterialItem(BaseModel):
    id: str | None = None
    nombre: str = ""
    descripcion: str | None = None
    cantidad: float = 1
    costo_unitario: float = 0
    subtotal: float | None = None


class ConceptoItem(BaseModel):
    id: str = ""
    concepto: str = ""
    descripcion: str = ""
    precio: float = 0
    cantidad: float = 1
    subtotal: float | None = None


class CotizacionServicioCreate(BaseModel):
    cliente_id: int | None = None
    cliente_nombre: str | None = None
    marca_impresora: str | None = None
    modelo_impresora: str | None = None
    descripcion: str | None = None
    trabajo_realizado: str | None = None
    costo_reparacion: float = 0
    conceptos: list[ConceptoItem] = Field(default_factory=list)
    materiales: list[MaterialItem] = Field(default_factory=list)
    porcentaje_ganancia: float = 30
    fecha: str | None = None
    estado: str | None = "cotizando"
    fotos: list[str] = Field(default_factory=list)


class CotizacionServicioUpdate(BaseModel):
    cliente_id: int | None = None
    cliente_nombre: str | None = None
    marca_impresora: str | None = None
    modelo_impresora: str | None = None
    descripcion: str | None = None
    trabajo_realizado: str | None = None
    costo_reparacion: float | None = None
    conceptos: list[ConceptoItem] | None = None
    materiales: list[MaterialItem] | None = None
    porcentaje_ganancia: float | None = None
    fecha: str | None = None
    estado: str | None = None
    fotos: list[str] | None = None


def _norm_conceptos(conceptos: list | None) -> list[dict]:
    out = []
    for c in conceptos or []:
        if hasattr(c, "model_dump"):
            c = c.model_dump()
        cid = (c.get("id") or "").strip().upper()
        cant = float(c.get("cantidad") or 1)
        precio = float(c.get("precio") or 0)
        sub = float(c.get("subtotal") if c.get("subtotal") is not None else cant * precio)
        out.append({
            "id": cid or "S—",
            "concepto": (c.get("concepto") or c.get("nombre") or "").strip() or "Servicio",
            "descripcion": (c.get("descripcion") or "").strip(),
            "precio": round(precio, 2),
            "cantidad": cant,
            "subtotal": round(sub, 2),
        })
    return out


def _calc_costos(
    costo_reparacion: float,
    materiales: list,
    porcentaje_ganancia: float,
    conceptos: list | None = None,
):
    conceptos_n = _norm_conceptos(conceptos)
    conceptos_total = sum(float(c["subtotal"]) for c in conceptos_n)
    # Si hay conceptos catalogados, ellos definen la mano de obra; si no, usa costo_reparacion legacy
    mano_obra = conceptos_total if conceptos_n else float(costo_reparacion or 0)

    mats = []
    mats_total = 0.0
    for m in materiales or []:
        if hasattr(m, "model_dump"):
            m = m.model_dump()
        cant = float(m.get("cantidad") or 1)
        cu = float(m.get("costo_unitario") or 0)
        sub = float(m.get("subtotal") if m.get("subtotal") is not None else cant * cu)
        mats.append({
            "id": (m.get("id") or "").strip() or None,
            "nombre": (m.get("nombre") or "").strip() or "Material",
            "descripcion": (m.get("descripcion") or "").strip() or None,
            "cantidad": cant,
            "costo_unitario": cu,
            "subtotal": round(sub, 2),
        })
        mats_total += sub
    base = round(mano_obra + mats_total, 2)
    pct = float(porcentaje_ganancia or 0)
    final = round(base * (1 + pct / 100.0), 2)
    return conceptos_n, mats, base, final, mano_obra


def _vendedor_nombre(user, vendedor) -> str:
    if user.role == "vendedor" and vendedor:
        return vendedor.nombre
    return (user.email or user.nombre or str(user.id))


def _to_dict(c: CotizacionServicio) -> dict:
    return {
        "id": c.id,
        "vendedor": c.vendedor,
        "cliente_id": c.cliente_id,
        "cliente_nombre": c.cliente_nombre,
        "marca_impresora": c.marca_impresora,
        "modelo_impresora": c.modelo_impresora,
        "descripcion": c.descripcion,
        "trabajo_realizado": c.trabajo_realizado,
        "costo_reparacion": c.costo_reparacion or 0,
        "conceptos": c.items or [],
        "materiales": c.materiales or [],
        "porcentaje_ganancia": c.porcentaje_ganancia or 0,
        "costo_base": c.costo_base or 0,
        "costo_final": c.costo_final or 0,
        "estado": _norm_estado(c.estado),
        "fecha": c.fecha,
        "venta_id": c.venta_id,
        "fotos": c.fotos or [],
        "items": c.items or [],
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "ganancia": round(float(c.costo_final or 0) - float(c.costo_base or 0), 2),
    }


@router.get("")
async def list_servicios(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    result = await db.execute(select(Servicio).order_by(Servicio.id))
    return [
        {"id": s.id, "nombre": s.nombre, "tarifa_fija": s.tarifa_fija, "tarifa_por_hora": s.tarifa_por_hora}
        for s in result.scalars().all()
    ]


@router.get("/conceptos")
async def list_conceptos_servicio(_user=Depends(require_user)):
    """Catálogo fijo: S001 Mantenimiento, S002 Reparación, S003 Diagnóstico."""
    return CONCEPTOS_CATALOGO


@router.get("/marcas-impresora")
async def marcas_impresora(_user=Depends(require_user)):
    return {"marcas": MARCAS_IMPRESORA}


@router.get("/cotizaciones")
async def list_cotizaciones_servicio(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    q = select(CotizacionServicio).order_by(CotizacionServicio.id.desc())
    if user.role == "vendedor" and vendedor:
        q = q.where(CotizacionServicio.vendedor == vendedor.nombre)
    elif user.role == "vendedor_ventas":
        q = q.where(CotizacionServicio.vendedor == user.email)
    result = await db.execute(q)
    return [_to_dict(c) for c in result.scalars().all()]


@router.get("/cotizaciones/{cotizacion_id}")
async def get_cotizacion_servicio(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    result = await db.execute(select(CotizacionServicio).where(CotizacionServicio.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización de servicio no encontrada")
    if user.role == "vendedor" and vendedor and c.vendedor != vendedor.nombre:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if user.role == "vendedor_ventas" and c.vendedor != user.email:
        raise HTTPException(status_code=403, detail="Sin acceso")
    return _to_dict(c)


@router.post("/cotizaciones")
async def create_cotizacion_servicio(
    body: CotizacionServicioCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    conceptos, mats, base, final, mano_obra = _calc_costos(
        body.costo_reparacion,
        body.materiales,
        body.porcentaje_ganancia,
        body.conceptos,
    )
    c = CotizacionServicio(
        vendedor=_vendedor_nombre(user, vendedor),
        cliente_id=body.cliente_id,
        cliente_nombre=body.cliente_nombre,
        marca_impresora=body.marca_impresora,
        modelo_impresora=body.modelo_impresora,
        descripcion=body.descripcion,
        trabajo_realizado=body.trabajo_realizado,
        costo_reparacion=mano_obra,
        materiales=mats,
        porcentaje_ganancia=body.porcentaje_ganancia or 0,
        costo_base=base,
        costo_final=final,
        estado=_norm_estado(body.estado or "cotizando"),
        fecha=(body.fecha or date.today().isoformat())[:10],
        fotos=(body.fotos or [])[:8],
        items=conceptos,
    )
    db.add(c)
    await db.flush()
    await db.commit()
    await db.refresh(c)
    return _to_dict(c)


@router.patch("/cotizaciones/{cotizacion_id}")
async def update_cotizacion_servicio(
    cotizacion_id: int,
    body: CotizacionServicioUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    result = await db.execute(select(CotizacionServicio).where(CotizacionServicio.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización de servicio no encontrada")
    if _norm_estado(c.estado) == "terminado" and user.role != "administrador":
        if body.estado is not None and _norm_estado(body.estado) != "terminado":
            raise HTTPException(status_code=400, detail="Servicio terminado; solo admin puede cambiar estado")
    if user.role == "vendedor" and vendedor and c.vendedor != vendedor.nombre:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if user.role == "vendedor_ventas" and c.vendedor != user.email:
        raise HTTPException(status_code=403, detail="Sin acceso")

    data = body.model_dump(exclude_unset=True)
    mats_in = data.pop("materiales", None)
    conceptos_in = data.pop("conceptos", None)
    if "estado" in data and data["estado"] is not None:
        data["estado"] = _norm_estado(data["estado"])
    if "fotos" in data and data["fotos"] is not None:
        data["fotos"] = list(data["fotos"])[:8]
    for k, v in data.items():
        setattr(c, k, v)
    costo_rep = c.costo_reparacion if body.costo_reparacion is None else body.costo_reparacion
    pct = c.porcentaje_ganancia if body.porcentaje_ganancia is None else body.porcentaje_ganancia
    mats_src = mats_in if mats_in is not None else (c.materiales or [])
    conceptos_src = conceptos_in if conceptos_in is not None else (c.items or [])
    conceptos, mats, base, final, mano_obra = _calc_costos(
        costo_rep or 0, mats_src, pct or 0, conceptos_src
    )
    c.items = conceptos
    c.materiales = mats
    c.costo_reparacion = mano_obra
    c.porcentaje_ganancia = pct or 0
    c.costo_base = base
    c.costo_final = final
    await db.commit()
    await db.refresh(c)
    return _to_dict(c)


@router.post("/cotizaciones/{cotizacion_id}/finalizar")
async def finalizar_cotizacion_servicio(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Cierra la cotización: crea Producto + Venta (contabilidad) y genera reporte."""
    result = await db.execute(select(CotizacionServicio).where(CotizacionServicio.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización de servicio no encontrada")
    if user.role == "vendedor" and vendedor and c.vendedor != vendedor.nombre:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if user.role == "vendedor_ventas" and c.vendedor != user.email:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if _norm_estado(c.estado) == "terminado" and c.venta_id:
        return {"ok": True, "already": True, **_to_dict(c)}

    conceptos, mats, base, final, mano_obra = _calc_costos(
        c.costo_reparacion or 0, c.materiales or [], c.porcentaje_ganancia or 0, c.items or []
    )
    c.items = conceptos
    c.materiales = mats
    c.costo_reparacion = mano_obra
    c.costo_base = base
    c.costo_final = final

    marca = (c.marca_impresora or "").strip()
    modelo = (c.modelo_impresora or "").strip()
    equipo = " ".join(x for x in [marca, modelo] if x) or "Impresora 3D"
    desc = (c.descripcion or f"Servicio / reparación — {equipo}").strip()

    reporte_lineas = [
        f"Equipo: {equipo}",
        f"Cliente: {c.cliente_nombre or '—'}",
        f"Descripción del servicio: {c.descripcion or '—'}",
        "Conceptos:",
    ]
    for co in conceptos:
        reporte_lineas.append(
            f"  - {co['id']} {co['concepto']}: {co['descripcion']} — "
            f"{co['cantidad']} × ${co['precio']:.2f} = ${co['subtotal']:.2f}"
        )
    if not conceptos:
        reporte_lineas.append(f"  Mano de obra: ${float(mano_obra):.2f}")
    reporte_lineas.append("Materiales:")
    for m in mats:
        reporte_lineas.append(
            f"  - {m['nombre']}: {m['cantidad']} × ${m['costo_unitario']:.2f} = ${m['subtotal']:.2f}"
        )
    reporte_lineas.extend([
        f"Costo base: ${base:.2f}",
        f"Margen: {float(c.porcentaje_ganancia or 0):.1f}%",
        f"Total a cobrar: ${final:.2f}",
        f"Trabajo realizado: {(c.trabajo_realizado or '—').strip()}",
    ])
    reporte = "\n".join(reporte_lineas)
    if not (c.trabajo_realizado or "").strip():
        c.trabajo_realizado = reporte
    else:
        c.trabajo_realizado = f"{c.trabajo_realizado.strip()}\n\n--- Resumen ---\n{reporte}"

    p = Producto(
        descripcion=desc,
        costo_base=base,
        costo_final=final,
        cantidad=1,
        vendedor=c.vendedor,
        detalles={
            "tipo": "servicio_reparacion",
            "marca_impresora": c.marca_impresora,
            "modelo_impresora": c.modelo_impresora,
            "conceptos": conceptos,
            "materiales": mats,
            "porcentaje_ganancia": c.porcentaje_ganancia,
            "cotizacion_servicio_id": c.id,
            "catalogo": "general",
        },
    )
    db.add(p)
    await db.flush()

    venta = Venta(
        cliente_id=c.cliente_id,
        cliente_nombre=c.cliente_nombre,
        productos=[{
            "descripcion": desc,
            "cantidad": 1,
            "costo_unitario": base,
            "precio_unitario": final,
            "subtotal": final,
        }],
        total=final,
        ganancia_neta=round(final - base, 2),
        vendedor=c.vendedor or _vendedor_nombre(user, vendedor),
        fecha=(c.fecha or date.today().isoformat())[:10],
        notas=f"Servicio/reparación #{c.id} — {equipo}",
    )
    db.add(venta)
    await db.flush()

    c.venta_id = venta.id
    c.estado = "terminado"
    await db.commit()
    await db.refresh(c)
    return {
        "ok": True,
        "reporte": reporte,
        "venta_id": venta.id,
        "producto_id": p.id,
        **_to_dict(c),
    }


@router.delete("/cotizaciones/{cotizacion_id}")
async def delete_cotizacion_servicio(
    cotizacion_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    result = await db.execute(select(CotizacionServicio).where(CotizacionServicio.id == cotizacion_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Cotización de servicio no encontrada")
    if _norm_estado(c.estado) == "terminado" and user.role != "administrador":
        raise HTTPException(status_code=400, detail="No se puede eliminar un servicio terminado")
    if user.role == "vendedor" and vendedor and c.vendedor != vendedor.nombre:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if user.role == "vendedor_ventas" and c.vendedor != user.email:
        raise HTTPException(status_code=403, detail="Sin acceso")
    await db.delete(c)
    await db.commit()
    return {"ok": True}
