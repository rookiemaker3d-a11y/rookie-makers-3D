"""
Script para crear la BD, tablas y datos iniciales.
Norberto (norbertomoro4@gmail.com) es el único administrador de la empresa.
Ejecutar desde la raíz del backend: python -m app.seed
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import User, Vendedor, Servicio
from app.auth import get_password_hash

VENDEDORES_INICIALES = [
    {"nombre": "Daniel Moreno Rodriguez", "correo": "rookiemaker3d@gmail.com", "telefono": "479-100-09-52", "banco": "BBVA BANCOMER", "cuenta": "1575249892"},
    {"nombre": "Emanuel Fidel Ramirez Alamillo", "correo": "rookiemakersd@gmail.com", "telefono": "477-595-85-27", "banco": "Nu", "cuenta": "638180000157451360"},
    {"nombre": "Norberto Charbel Moreno Rodriguez", "correo": "norbertomoro4@gmail.com", "telefono": "472-148-89-13", "banco": "Mercado Pago", "cuenta": "W722969010092073360"},
]
SERVICIOS_INICIALES = [
    {"nombre": "Mantenimiento e Implementación", "tarifa_fija": 250, "tarifa_por_hora": 50},
    {"nombre": "Desarrollo de proyectos", "tarifa_fija": 250, "tarifa_por_hora": 50},
]


async def run():
    await init_db()
    async with AsyncSessionLocal() as db:
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
