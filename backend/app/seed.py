"""
Script para crear la BD, tablas y datos iniciales.
Norberto (norbertomoro4@gmail.com) es el único administrador de la empresa.
Ejecutar desde la raíz del backend: python -m app.seed
Si EJECUTAR-SEED.bat pone DATABASE_URL, se usa esa URL (para producción).
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, init_db, AsyncSessionLocal
from app.models import User, Vendedor, Servicio, MaterialFilamento
from app.auth import get_password_hash

def _get_engine_and_session():
    url = os.environ.get("DATABASE_URL", "").strip()
    if url and "postgresql" in url:
        if not url.startswith("postgresql+asyncpg"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        engine = create_async_engine(url, echo=False, connect_args={"ssl": True})
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        return engine, session_factory
    return None, None

VENDEDORES_INICIALES = [
    {"nombre": "Daniel Moreno Rodriguez", "correo": "rookiemaker3d@gmail.com", "telefono": "479-100-09-52", "banco": "BBVA BANCOMER", "cuenta": "1575249892"},
    {"nombre": "Emanuel Fidel Ramirez Alamillo", "correo": "rookiemakersd@gmail.com", "telefono": "477-595-85-27", "banco": "Nu", "cuenta": "638180000157451360"},
    {"nombre": "Norberto Charbel Moreno Rodriguez", "correo": "norbertomoro4@gmail.com", "telefono": "472-148-89-13", "banco": "Mercado Pago", "cuenta": "W722969010092073360"},
]
SERVICIOS_INICIALES = [
    {"nombre": "Mantenimiento e Implementación", "tarifa_fija": 250, "tarifa_por_hora": 50},
    {"nombre": "Desarrollo de proyectos", "tarifa_fija": 250, "tarifa_por_hora": 50},
]

MATERIALES_FILAMENTO = [
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


async def run():
    engine, session_factory = _get_engine_and_session()
    if engine is not None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with session_factory() as db:
            await _run_seed(db)
    else:
        await init_db()
        async with AsyncSessionLocal() as db:
            await _run_seed(db)

async def _run_seed(db):
        r = await db.execute(select(Vendedor))
        if r.scalars().first() is None:
            for v in VENDEDORES_INICIALES:
                db.add(Vendedor(**v))
            await db.commit()
        vendedores = (await db.execute(select(Vendedor))).scalars().all()

        r = await db.execute(select(Servicio))
        if r.scalars().first() is None:
            for s in SERVICIOS_INICIALES:
                db.add(Servicio(**s))
            await db.commit()

        r = await db.execute(select(MaterialFilamento))
        if r.scalars().first() is None:
            for mat in MATERIALES_FILAMENTO:
                db.add(MaterialFilamento(**mat))
            await db.commit()

        r = await db.execute(select(User).where(User.email == "norbertomoro4@gmail.com"))
        u = r.scalar_one_or_none()
        if u is None:
            db.add(User(
                email="norbertomoro4@gmail.com",
                password_hash=get_password_hash("admin123"),
                role="administrador",
                vendedor_id=None,
                is_active=True,
            ))
            await db.commit()
        else:
            u.role = "administrador"
            u.vendedor_id = None
            u.password_hash = get_password_hash("admin123")
            u.is_active = True
            await db.commit()

        # Norberto es el único admin: quitar rol administrador a cualquier otro usuario
        all_users = (await db.execute(select(User))).scalars().all()
        for user in all_users:
            if user.email != "norbertomoro4@gmail.com" and user.role == "administrador":
                user.role = "vendedor"
        await db.commit()

        for v in vendedores:
            if v.correo == "norbertomoro4@gmail.com":
                continue
            r = await db.execute(select(User).where(User.email == v.correo))
            existing = r.scalar_one_or_none()
            if existing is None:
                db.add(User(email=v.correo, password_hash=get_password_hash("vendedor123"), role="vendedor", vendedor_id=v.id, is_active=True))
            else:
                existing.password_hash = get_password_hash("vendedor123")
                existing.vendedor_id = v.id
                existing.is_active = True
        await db.commit()

        print("Seed completado. Único admin: norbertomoro4@gmail.com / admin123")
        print("Vendedores: correo del vendedor / vendedor123")


if __name__ == "__main__":
    asyncio.run(run())
