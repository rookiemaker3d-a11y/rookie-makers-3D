from fastapi import APIRouter, Depends, UploadFile, HTTPException, Form
from fastapi.responses import Response

from app.auth import require_user
from app.services.image_to_stl import image_to_stl

router = APIRouter(prefix="/stl", tags=["stl"])


@router.post("/from-image")
async def stl_from_image(
    file: UploadFile,
    height_mm: float = Form(10.0),
    max_size_mm: float = Form(100.0),
    invert: str = Form("true"),
    _user=Depends(require_user),
):
    """Sube una imagen (PNG/JPG) y devuelve un STL generado por extrusión del contorno."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Debes subir una imagen (PNG, JPG, etc.)")
    content = await file.read()
    invert_bool = str(invert).lower() in ("1", "true", "yes")
    try:
        stl_content = image_to_stl(
            content,
            height_mm=height_mm,
            max_size_mm=max_size_mm,
            invert=invert_bool,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    name = (file.filename or "imagen").rsplit(".", 1)[0] + ".stl"
    return Response(
        content=stl_content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )
