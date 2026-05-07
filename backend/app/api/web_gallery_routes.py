from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc

from app.database import get_db
from app.auth import require_admin
from app.models import WebGalleryCategory, WebGalleryImage


router = APIRouter(prefix="/web-gallery", tags=["web-gallery"])


def _gallery_root() -> str:
    here = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    root = os.path.join(here, "web-assets", "gallery")
    os.makedirs(root, exist_ok=True)
    return root


def _safe_name(name: str) -> str:
    base = (name or "archivo").strip()
    base = base.replace("\\", "/").split("/")[-1]
    base = re.sub(r"[^a-zA-Z0-9._-]+", "-", base).strip("-") or "archivo"
    return base[:120]


# ─── Público: listar galería completa (para landing page) ─────────────────
@router.get("", response_model=list[dict])
async def list_gallery_public(db: AsyncSession = Depends(get_db)):
    """Devuelve todas las categorías activas con sus imágenes activas ordenadas."""
    result = await db.execute(
        select(WebGalleryCategory)
        .where(WebGalleryCategory.activo == True)
        .order_by(asc(WebGalleryCategory.orden), asc(WebGalleryCategory.id))
    )
    categorias = result.scalars().all()
    out = []
    for cat in categorias:
        rimg = await db.execute(
            select(WebGalleryImage)
            .where(
                WebGalleryImage.categoria_id == cat.id,
                WebGalleryImage.activo == True,
            )
            .order_by(asc(WebGalleryImage.orden), asc(WebGalleryImage.id))
        )
        imagenes = rimg.scalars().all()
        out.append(
            {
                "id": cat.id,
                "slug": cat.slug,
                "label": cat.label,
                "tag": cat.tag,
                "span": cat.span,
                "images": [
                    {
                        "id": img.id,
                        "src": f"/web-assets/gallery/{img.stored_name}",
                        "alt": img.nombre_original,
                    }
                    for img in imagenes
                ],
            }
        )
    return out


# ─── Admin: CRUD categorías ────────────────────────────────────────────────
class CategoryCreateBody:
    pass


@router.post("/categories", response_model=dict)
async def create_category(
    slug: str,
    label: str,
    tag: str,
    span: Optional[str] = "col-span-1 row-span-1",
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    slug_clean = re.sub(r"[^a-z0-9-]+", "-", (slug or "").lower().strip()).strip("-") or "categoria"
    existing = await db.execute(select(WebGalleryCategory).where(WebGalleryCategory.slug == slug_clean))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug ya existe")
    cat = WebGalleryCategory(
        slug=slug_clean,
        label=label.strip(),
        tag=tag.strip(),
        span=(span or "col-span-1 row-span-1").strip(),
    )
    db.add(cat)
    await db.flush()
    await db.commit()
    await db.refresh(cat)
    return {"ok": True, "id": cat.id, "slug": slug_clean}


@router.get("/categories/{category_id}/images", response_model=list[dict])
async def list_images_by_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(WebGalleryCategory).where(WebGalleryCategory.id == category_id))
    cat = r.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    rimg = await db.execute(
        select(WebGalleryImage)
        .where(WebGalleryImage.categoria_id == category_id)
        .order_by(asc(WebGalleryImage.orden), asc(WebGalleryImage.id))
    )
    imgs = rimg.scalars().all()
    return [
        {
            "id": img.id,
            "src": f"/web-assets/gallery/{img.stored_name}",
            "alt": img.nombre_original,
            "size": img.size,
        }
        for img in imgs
    ]


@router.get("/categories", response_model=list[dict])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = await db.execute(
        select(WebGalleryCategory).order_by(asc(WebGalleryCategory.orden), asc(WebGalleryCategory.id))
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "slug": r.slug,
            "label": r.label,
            "tag": r.tag,
            "span": r.span,
            "orden": r.orden,
            "activo": r.activo,
            "imagenes_count": 0,  # se llena abajo si se quiere
        }
        for r in rows
    ]


@router.patch("/categories/{category_id}", response_model=dict)
async def update_category(
    category_id: int,
    label: Optional[str] = None,
    tag: Optional[str] = None,
    span: Optional[str] = None,
    orden: Optional[int] = None,
    activo: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(WebGalleryCategory).where(WebGalleryCategory.id == category_id))
    cat = r.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if label is not None:
        cat.label = label.strip()
    if tag is not None:
        cat.tag = tag.strip()
    if span is not None:
        cat.span = span.strip()
    if orden is not None:
        cat.orden = int(orden)
    if activo is not None:
        cat.activo = bool(activo)
    await db.commit()
    await db.refresh(cat)
    return {"ok": True}


@router.delete("/categories/{category_id}", response_model=dict)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    # Borrar imágenes del disco primero
    rimg = await db.execute(
        select(WebGalleryImage).where(WebGalleryImage.categoria_id == category_id)
    )
    imgs = rimg.scalars().all()
    root = _gallery_root()
    for img in imgs:
        rel = (img.stored_name or "").replace("\\", "/")
        if rel and ".." not in rel and "/" not in rel:
            try:
                os.remove(os.path.join(root, rel))
            except Exception:
                pass
    # Borrar registro (cascade borra imágenes en BD)
    r = await db.execute(select(WebGalleryCategory).where(WebGalleryCategory.id == category_id))
    cat = r.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    await db.delete(cat)
    await db.commit()
    return {"ok": True}


# ─── Admin: imágenes ───────────────────────────────────────────────────────
@router.post("/categories/{category_id}/images", response_model=dict)
async def upload_image(
    category_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    if not file:
        raise HTTPException(status_code=400, detail="Falta archivo")

    # Verificar categoría
    r = await db.execute(select(WebGalleryCategory).where(WebGalleryCategory.id == category_id))
    cat = r.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    root = _gallery_root()
    safe = _safe_name(file.filename or "archivo")
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    stored = f"{cat.slug}-{ts}-{safe}"
    out_path = os.path.join(root, stored)

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Máx 25MB por archivo")

    with open(out_path, "wb") as f:
        f.write(content)

    # Calcular siguiente orden dentro de la categoría
    rord = await db.execute(
        select(WebGalleryImage).where(WebGalleryImage.categoria_id == category_id)
    )
    existing = rord.scalars().all()
    next_ord = max([i.orden for i in existing] + [0]) + 1

    img = WebGalleryImage(
        categoria_id=category_id,
        nombre_original=file.filename or safe,
        stored_name=stored,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        orden=next_ord,
    )
    db.add(img)
    await db.flush()
    await db.commit()
    await db.refresh(img)
    return {
        "ok": True,
        "id": img.id,
        "src": f"/web-assets/gallery/{stored}",
        "alt": img.nombre_original,
    }


@router.delete("/images/{image_id}", response_model=dict)
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    r = await db.execute(select(WebGalleryImage).where(WebGalleryImage.id == image_id))
    img = r.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    # Borrar archivo
    root = _gallery_root()
    rel = (img.stored_name or "").replace("\\", "/")
    if rel and ".." not in rel and "/" not in rel:
        try:
            os.remove(os.path.join(root, rel))
        except Exception:
            pass

    await db.delete(img)
    await db.commit()
    return {"ok": True}
