"""Endpoints para el catálogo público de productos de la landing.

- GET /api/catalogo/productos         (PÚBLICO, solo productos activos)
- GET /api/catalogo/admin/productos   (admin, ve todos)
- POST /api/catalogo/admin/productos  (admin, crea)
- PUT /api/catalogo/admin/productos/{id}  (admin, edita)
- DELETE /api/catalogo/admin/productos/{id}  (admin, elimina)
- POST /api/catalogo/admin/seed       (admin, carga productos iniciales desde el portfolio)

Los productos con precio=0 se muestran en la landing con la etiqueta
"Precio a convenir" y el modal pide al cliente que proponga uno.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import require_admin
from app.models import ProductoCatalogo
from app.schemas import (
    ProductoCatalogoCreate,
    ProductoCatalogoUpdate,
    ProductoCatalogoResponse,
)

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


# -------------------- ENDPOINTS PÚBLICOS --------------------

@router.get("/productos", response_model=list[ProductoCatalogoResponse])
async def list_productos_publicos(db: AsyncSession = Depends(get_db)):
    """Lista los productos activos del catálogo. Sin autenticación. Orden: orden ASC, id ASC."""
    res = await db.execute(
        select(ProductoCatalogo)
        .where(ProductoCatalogo.activo == True)  # noqa: E712
        .order_by(ProductoCatalogo.orden.asc(), ProductoCatalogo.id.asc())
    )
    return res.scalars().all()


# -------------------- ENDPOINTS ADMIN --------------------

@router.get("/admin/productos", response_model=list[ProductoCatalogoResponse])
async def list_productos_admin(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Lista TODOS los productos (activos e inactivos). Solo administradores."""
    res = await db.execute(
        select(ProductoCatalogo)
        .order_by(ProductoCatalogo.orden.asc(), ProductoCatalogo.id.asc())
    )
    return res.scalars().all()


@router.post("/admin/productos", response_model=ProductoCatalogoResponse, status_code=201)
async def crear_producto(
    body: ProductoCatalogoCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Crea un producto en el catálogo."""
    # Validar slug único
    existe = await db.execute(
        select(ProductoCatalogo).where(ProductoCatalogo.slug == body.slug)
    )
    if existe.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Ya existe un producto con slug '{body.slug}'")

    nuevo = ProductoCatalogo(**body.model_dump())
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return nuevo


@router.put("/admin/productos/{producto_id}", response_model=ProductoCatalogoResponse)
async def editar_producto(
    producto_id: int,
    body: ProductoCatalogoUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Edita un producto del catálogo. Solo se actualizan los campos enviados."""
    res = await db.execute(
        select(ProductoCatalogo).where(ProductoCatalogo.id == producto_id)
    )
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    data = body.model_dump(exclude_unset=True)

    # Validar slug único si lo está cambiando
    if "slug" in data and data["slug"] != p.slug:
        existe = await db.execute(
            select(ProductoCatalogo).where(ProductoCatalogo.slug == data["slug"])
        )
        if existe.scalar_one_or_none():
            raise HTTPException(
                status_code=400, detail=f"Ya existe otro producto con slug '{data['slug']}'"
            )

    for campo, valor in data.items():
        setattr(p, campo, valor)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/admin/productos/{producto_id}", status_code=204)
async def eliminar_producto(
    producto_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Elimina un producto del catálogo."""
    res = await db.execute(
        select(ProductoCatalogo).where(ProductoCatalogo.id == producto_id)
    )
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.delete(p)
    await db.commit()
    return None


# -------------------- SEED INICIAL --------------------

# Slugs pre-cargados con los productos del portfolio actual.
# Precio = 0 para que Norberto los ajuste desde el ERP.
SEED_PRODUCTOS = [
    {"slug": "funko-futbolista", "nombre": "Funko Futbolista", "categoria": "Coleccionables", "imagen_url": "/portfolio/funko-futbolista/00.png", "orden": 1},
    {"slug": "funko-guitarrista", "nombre": "Funko Guitarrista", "categoria": "Coleccionables", "imagen_url": "/portfolio/funko-guitarrista/00.png", "orden": 2},
    {"slug": "funko-explorador", "nombre": "Funko Explorador", "categoria": "Coleccionables", "imagen_url": "/portfolio/funko-explorador/00.png", "orden": 3},
    {"slug": "kuromi", "nombre": "Kuromi", "categoria": "Coleccionables", "imagen_url": "/portfolio/kuromi/00.png", "orden": 4},
    {"slug": "molde-galletas", "nombre": "Molde para Galletas", "categoria": "Cocina", "imagen_url": "/portfolio/molde-galletas/00.png", "orden": 5},
    {"slug": "letrero-neon", "nombre": "Letrero Neón (incluye tira LED y eliminador)", "categoria": "Decoración", "imagen_url": "/portfolio/letrero-neon/00.png", "orden": 6},
    {"slug": "soporte-laptop", "nombre": "Soporte para Laptop", "categoria": "Oficina", "imagen_url": "/portfolio/soporte-laptop/00.png", "orden": 7},
    {"slug": "soporte-ajustable", "nombre": "Soporte Ajustable", "categoria": "Oficina", "imagen_url": "/portfolio/soporte-ajustable/00.png", "orden": 8},
    {"slug": "organizador-escritorio", "nombre": "Organizador de Escritorio", "categoria": "Oficina", "imagen_url": "/portfolio/organizador-escritorio/00.png", "orden": 9},
    {"slug": "ingenieria-inversa", "nombre": "Ingeniería Inversa (cotizar)", "categoria": "Servicios", "imagen_url": "/portfolio/ingenieria-inversa/00.png", "orden": 10},
]


@router.post("/admin/seed", response_model=dict)
async def seed_catalogo(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Carga los productos iniciales del portfolio. No sobrescribe los existentes.

    Útil para arrancar el catálogo la primera vez. Si corres esto dos veces,
    los productos con el mismo slug NO se duplican.
    """
    creados = 0
    saltados = 0
    for data in SEED_PRODUCTOS:
        existe = await db.execute(
            select(ProductoCatalogo).where(ProductoCatalogo.slug == data["slug"])
        )
        if existe.scalar_one_or_none():
            saltados += 1
            continue
        nuevo = ProductoCatalogo(
            **data,
            precio=0,  # Norberto lo ajusta desde el ERP
            descripcion=None,
            activo=True,
        )
        db.add(nuevo)
        creados += 1
    await db.commit()
    return {"creados": creados, "saltados": saltados, "total": len(SEED_PRODUCTOS)}
