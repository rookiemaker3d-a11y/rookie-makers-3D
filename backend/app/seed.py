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
from app.models import User, Vendedor, Servicio, MaterialFilamento, InventarioFilamento
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
    {"nombre": "Emanuel Fidel Ramirez Alamillo", "correo": "emanuelalamillo@gmail.com", "telefono": "477-595-85-27", "banco": "Nu", "cuenta": "638180000157451360"},
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

# Filamentos de ejemplo para inventario (vendedor_id 1 = Daniel, compartido con Norberto)
FILAMENTOS_INVENTARIO = [
    {"vendedor_id": 1, "nombre": "PLA Negro", "tipo": "PLA", "color_hex": "#1a1a1a", "color_nombre": "Negro", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Blanco", "tipo": "PLA", "color_hex": "#f5f5f5", "color_nombre": "Blanco", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Gris", "tipo": "PLA", "color_hex": "#808080", "color_nombre": "Gris", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Amarillo", "tipo": "PLA", "color_hex": "#ffd700", "color_nombre": "Amarillo", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Rosa", "tipo": "PLA", "color_hex": "#ff69b4", "color_nombre": "Rosa", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Rojo", "tipo": "PLA", "color_hex": "#cc0000", "color_nombre": "Rojo", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PLA Mármol azul gris", "tipo": "PLA", "color_hex": "#708090", "color_nombre": "Mármol azul tipo gris", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PETG Negro", "tipo": "PETG", "color_hex": "#1a1a1a", "color_nombre": "Negro", "cantidad_gramos": 1000},
    {"vendedor_id": 1, "nombre": "PETG Blanco", "tipo": "PETG", "color_hex": "#f5f5f5", "color_nombre": "Blanco", "cantidad_gramos": 1000},
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

        r = await db.execute(select(InventarioFilamento))
        if r.scalars().first() is None:
            for f in FILAMENTOS_INVENTARIO:
                db.add(InventarioFilamento(**f))
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

        # Migración: Emanuel/Fidel cambió de correo
        OLD_FIDEL_EMAIL = "rookiemakersd@gmail.com"
        NEW_FIDEL_EMAIL = "emanuelalamillo@gmail.com"
        FIDEL_PASSWORD = "Fidel123!ctr"

        # Si existe un Vendedor con el correo viejo, migrarlo al nuevo
        r_old_v = await db.execute(select(Vendedor).where(Vendedor.correo == OLD_FIDEL_EMAIL))
        old_v = r_old_v.scalar_one_or_none()
        if old_v:
            old_v.correo = NEW_FIDEL_EMAIL
            await db.commit()

        # Si existe un User con el correo viejo, intentar migrarlo al nuevo o eliminar duplicado
        r_old_u = await db.execute(select(User).where(User.email == OLD_FIDEL_EMAIL))
        old_u = r_old_u.scalar_one_or_none()
        if old_u:
            r_new_u = await db.execute(select(User).where(User.email == NEW_FIDEL_EMAIL))
            new_u = r_new_u.scalar_one_or_none()
            if new_u:
                # Ya existe el nuevo; eliminar el viejo para evitar duplicados
                await db.delete(old_u)
                await db.commit()
            else:
                old_u.email = NEW_FIDEL_EMAIL
                await db.commit()

        vendedores = (await db.execute(select(Vendedor))).scalars().all()
        for v in vendedores:
            if v.correo == "norbertomoro4@gmail.com":
                continue
            r = await db.execute(select(User).where(User.email == v.correo))
            existing = r.scalar_one_or_none()
            if existing is None:
                pwd = FIDEL_PASSWORD if v.correo == NEW_FIDEL_EMAIL else "vendedor123"
                db.add(User(email=v.correo, password_hash=get_password_hash(pwd), role="vendedor", vendedor_id=v.id, is_active=True))
            else:
                pwd = FIDEL_PASSWORD if v.correo == NEW_FIDEL_EMAIL else "vendedor123"
                existing.password_hash = get_password_hash(pwd)
                existing.vendedor_id = v.id
                existing.is_active = True
        await db.commit()

        # Usuario de ejemplo con rol vendedor_ventas (solo ve Dashboard, Productos, Nueva cotización, Cotizaciones espera, Análisis)
        r_new = await db.execute(select(User).where(User.email == "andrehoundsome019@gmail.com"))
        if r_new.scalar_one_or_none() is None:
            # Migrar el antiguo correo de prueba al nuevo si existía
            r_old = await db.execute(select(User).where(User.email == "prueba@rookiemakers3d.com"))
            old_user = r_old.scalar_one_or_none()
            if old_user:
                old_user.email = "andrehoundsome019@gmail.com"
            else:
                db.add(User(
                    email="andrehoundsome019@gmail.com",
                    password_hash=get_password_hash("Prueba123!."),
                    role="vendedor_ventas",
                    vendedor_id=None,
                    is_active=True,
                ))
            await db.commit()
            print("Usuario de ejemplo (vendedor ventas): andrehoundsome019@gmail.com / Prueba123!.")

        print("Seed completado. Único admin: norbertomoro4@gmail.com / admin123")
        print("Vendedores (diseñadores): correo del vendedor / vendedor123")


if __name__ == "__main__":
    asyncio.run(run())
