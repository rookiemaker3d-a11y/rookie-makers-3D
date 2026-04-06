from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.auth import require_admin
from app.models import PaginaPublicaConfig


router = APIRouter(prefix="/web-assets", tags=["web-assets"])

CLAVE_ASSETS = "web_assets"


def _assets_root() -> str:
    # Persistente: montar volumen en backend/web-assets
    here = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    root = os.path.join(here, "web-assets")
    os.makedirs(root, exist_ok=True)
    return root


def _safe_name(name: str) -> str:
    base = (name or "archivo").strip()
    base = base.replace("\\", "/").split("/")[-1]
    base = re.sub(r"[^a-zA-Z0-9._-]+", "-", base).strip("-") or "archivo"
    return base[:120]


async def _get_index(db: AsyncSession) -> dict:
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE_ASSETS))
    row = r.scalar_one_or_none()
    if not row:
        row = PaginaPublicaConfig(clave=CLAVE_ASSETS, valor={"items": []})
        db.add(row)
        await db.flush()
        await db.commit()
        await db.refresh(row)
    return row.valor or {"items": []}


async def _save_index(db: AsyncSession, data: dict) -> None:
    r = await db.execute(select(PaginaPublicaConfig).where(PaginaPublicaConfig.clave == CLAVE_ASSETS))
    row = r.scalar_one_or_none()
    if not row:
        row = PaginaPublicaConfig(clave=CLAVE_ASSETS, valor={})
        db.add(row)
        await db.flush()
    row.valor = data
    await db.commit()


@router.get("/list", response_model=list[dict])
async def list_assets(db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    data = await _get_index(db)
    items = data.get("items") if isinstance(data, dict) else []
    if not isinstance(items, list):
        return []
    # newest first
    return sorted(items, key=lambda x: (x or {}).get("id", 0), reverse=True)


@router.post("/upload", response_model=dict)
async def upload_asset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    if not file:
        raise HTTPException(status_code=400, detail="Falta archivo")
    root = _assets_root()
    safe = _safe_name(file.filename or "archivo")
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    stored = f"{ts}-{safe}"
    out_path = os.path.join(root, stored)
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Máx 25MB por archivo")
    with open(out_path, "wb") as f:
        f.write(content)

    data = await _get_index(db)
    items = data.get("items") if isinstance(data, dict) else None
    if not isinstance(items, list):
        items = []
        data = {"items": items}
    next_id = max([int(i.get("id") or 0) for i in items] + [0]) + 1
    items.append(
        {
            "id": next_id,
            "original_name": file.filename or safe,
            "path": stored,
            "content_type": file.content_type or "application/octet-stream",
            "size": len(content),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    await _save_index(db, data)
    return {"ok": True, "id": next_id, "path": stored}


@router.delete("/{asset_id}", response_model=dict)
async def delete_asset(asset_id: int, db: AsyncSession = Depends(get_db), _admin=Depends(require_admin)):
    data = await _get_index(db)
    items = data.get("items") if isinstance(data, dict) else []
    if not isinstance(items, list):
        items = []
        data = {"items": items}
    keep = []
    removed = None
    for it in items:
        if int((it or {}).get("id") or 0) == int(asset_id):
            removed = it
        else:
            keep.append(it)
    if not removed:
        raise HTTPException(status_code=404, detail="No encontrado")
    data["items"] = keep
    await _save_index(db, data)
    # borrar archivo
    root = _assets_root()
    rel = (removed.get("path") or "").replace("\\", "/")
    if rel and ".." not in rel and "/" not in rel:
        try:
            os.remove(os.path.join(root, rel))
        except Exception:
            pass
    return {"ok": True}

