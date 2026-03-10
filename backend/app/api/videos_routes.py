from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.auth import require_user, require_admin
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


@router.get("/public")
async def list_public(db: AsyncSession = Depends(get_db)):
    """Lista de videos para la página pública (sin login)."""
    r = await db.execute(select(VideoPromocional).order_by(VideoPromocional.orden, VideoPromocional.id))
    return [{"id": v.id, "titulo": v.titulo, "url": v.url, "red": v.red or ""} for v in r.scalars().all()]


@router.get("")
async def list_all(db: AsyncSession = Depends(get_db), _user=Depends(require_user)):
    r = await db.execute(select(VideoPromocional).order_by(VideoPromocional.orden, VideoPromocional.id))
    return list(r.scalars().all())


@router.post("")
async def create(body: VideoCreate, db: AsyncSession = Depends(get_db), _user=Depends(require_user), _admin=Depends(require_admin)):
    v = VideoPromocional(titulo=body.titulo, url=body.url, red=body.red or "")
    db.add(v)
    await db.flush()
    await db.refresh(v)
    return v


@router.put("/{video_id}")
async def update(video_id: int, body: VideoUpdate, db: AsyncSession = Depends(get_db), _user=Depends(require_user), _admin=Depends(require_admin)):
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
    await db.refresh(v)
    return v


@router.delete("/{video_id}")
async def delete(video_id: int, db: AsyncSession = Depends(get_db), _user=Depends(require_user), _admin=Depends(require_admin)):
    r = await db.execute(select(VideoPromocional).where(VideoPromocional.id == video_id))
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    await db.delete(v)
    return {"ok": True}
