from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_user
from app.models import MaterialFilamento
from app.schemas import MaterialFilamentoResponse, MaterialFilamentoUpdate

router = APIRouter(prefix="/materiales-filamento", tags=["materiales-filamento"])

DEFAULT_MATERIALES_FILAMENTO = [
    {"id_externo": "pla", "nombre": "PLA", "costo_por_kg": 500, "orden": 1},
    {"id_externo": "pla_plus", "nombre": "PLA+", "costo_por_kg": 550, "orden": 2},
    {"id_externo": "petg", "nombre": "PETG", "costo_por_kg": 600, "orden": 3},
    {"id_externo": "asa", "nombre": "ASA", "costo_por_kg": 700, "orden": 4},
    {"id_externo": "tpu", "nombre": "TPU", "costo_por_kg": 800, "orden": 5},
    {"id_externo": "nylon", "nombre": "Nylon", "costo_por_kg": 900, "orden": 6},
    {"id_externo": "resina", "nombre": "Resina", "costo_por_kg": 1200, "orden": 7},
    {"id_externo": "pla_madera", "nombre": "PLA Madera", "costo_por_kg": 550, "orden": 8},
    {"id_externo": "abs_cf", "nombre": "ABS-CF", "costo_por_kg": 1100, "orden": 9},
    {"id_externo": "otro", "nombre": "Otro", "costo_por_kg": 500, "orden": 10},
]


@router.get("", response_model=list[MaterialFilamentoResponse])
async def list_materiales(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    """Lista todos los filamentos/materiales con su costo por kg. Visible para cualquier usuario autenticado."""
    result = await db.execute(
        select(MaterialFilamento).where(MaterialFilamento.activo == True).order_by(MaterialFilamento.orden, MaterialFilamento.id)
    )
    rows = result.scalars().all()
    # UX: si la BD está vacía (común en deploys nuevos), auto-crea defaults para que
    # Inventario y el cotizador siempre tengan lista sin depender de correr el seed manual.
    if rows:
        return rows
    # Insert defaults (id_externo es unique; si hay carrera o ya existían, simplemente no fallar duro).
    try:
        for mat in DEFAULT_MATERIALES_FILAMENTO:
            db.add(MaterialFilamento(**mat))
        await db.commit()
    except Exception:
        await db.rollback()
    result2 = await db.execute(
        select(MaterialFilamento).where(MaterialFilamento.activo == True).order_by(MaterialFilamento.orden, MaterialFilamento.id)
    )
    return result2.scalars().all()


@router.patch("/{material_id}", response_model=MaterialFilamentoResponse)
async def update_material(
    material_id: int,
    body: MaterialFilamentoUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user),
):
    """Actualiza costo por kg (y opcionalmente nombre/activo) de un material."""
    result = await db.execute(select(MaterialFilamento).where(MaterialFilamento.id == material_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m
