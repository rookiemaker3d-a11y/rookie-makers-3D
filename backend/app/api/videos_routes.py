from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.auth import require_user, require_admin, get_vendedor_from_user
from app.models import VideoPromocional

router = APIRouter(prefix="/videos-promocionales", tags=["videos"])


class VideoCreate(BaseModel):
    titulo: str
    url: str
    red: str = ""


class VideoUpdate(BaseModel):
    titulo: str | None = None
    url: str | None = None
    red: str | None = None
    orden: int | None = None
    estado: str | None = None  # "aprobado" para aprobar solicitud


@router.get("/public")
async def list_public(db: AsyncSession = Depends(get_db)):
    """Solo videos aprobados para la página pública (estado aprobado o null por compatibilidad)."""
    from sqlalchemy import or_
    r = await db.execute(
        select(VideoPromocional)
        .where(or_(VideoPromocional.estado == "aprobado", VideoPromocional.estado == None))
        .order_by(VideoPromocional.orden, VideoPromocional.id)
    )
    return [{"id": v.id, "titulo": v.titulo, "url": v.url, "red": v.red or ""} for v in r.scalars().all()]


@router.get("")
async def list_all(db: AsyncSession = Depends(get_db), user=Depends(require_user), vendedor=Depends(get_vendedor_from_user)):
    """Admin ve todos (solicitud + aprobados); vendedor solo sus solicitudes y los aprobados."""
    r = await db.execute(select(VideoPromocional).order_by(VideoPromocional.orden, VideoPromocional.id))
    all_list = list(r.scalars().all())
    if user.role == "administrador":
        return all_list
    # Vendedor: ver aprobados + sus propias solicitudes (estado None = aprobado legacy)
    nombre_v = vendedor.nombre if vendedor else ""
    return [v for v in all_list if (v.estado == "aprobado" or v.estado is None) or (v.solicitante == nombre_v)]


@router.post("")
async def create(
    body: VideoCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    vendedor=Depends(get_vendedor_from_user),
):
    """Admin: crea directo como aprobado. Vendedor: crea como solicitud (solicitante = su nombre)."""
    if user.role == "administrador":
        v = VideoPromocional(titulo=body.titulo, url=body.url, red=body.red or "", estado="aprobado")
    else:
        nombre = vendedor.nombre if vendedor else user.email or ""
        v = VideoPromocional(titulo=body.titulo, url=body.url, red=body.red or "", estado="solicitud", solicitante=nombre)
    db.add(v)
    await db.flush()
    await db.refresh(v)
    return v


@router.put("/{video_id}")
async def update(
    video_id: int,
    body: VideoUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_user),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(VideoPromocional).where(VideoPromocional.id == video_id))
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    if body.titulo is not None:
        v.titulo = body.titulo
    if body.url is not None:
        v.url = body.url
    if body.red is not None:
        v.red = body.red
    if body.orden is not None:
        v.orden = body.orden
    if body.estado is not None:
        v.estado = body.estado  # admin aprueba con estado="aprobado"
    await db.commit()
    await db.refresh(v)
    return v


@router.delete("/{video_id}")
async def delete(video_id: int, db: AsyncSession = Depends(get_db), _user=Depends(require_user), _admin=Depends(require_admin)):
    r = await db.execute(select(VideoPromocional).where(VideoPromocional.id == video_id))
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    await db.delete(v)
    await db.commit()
    return {"ok": True}
