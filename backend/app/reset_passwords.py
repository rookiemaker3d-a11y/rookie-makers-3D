"""
Reset de contraseñas de emergencia.
Ejecutar en el VPS: docker compose exec backend python -m app.reset_passwords
"""
import asyncio
from app.database import AsyncSessionLocal, engine
from app.models import User
from app.auth import get_password_hash
from sqlalchemy import select

# Contraseñas seguras por rol
PASSWORDS = {
    "administrador": "AdminRookie2025!",
    "vendedor": "VendedorRookie2025!",
    "vendedor_ventas": "VentasRookie2025!",
}


async def reset_all():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).order_by(User.id))
        users = result.scalars().all()

        print("=" * 60)
        print("RESET DE CONTRASEÑAS - ROOKIE MAKERS 3D")
        print("=" * 60)
        print()

        for u in users:
            pwd = PASSWORDS.get(u.role, "Rookie2025!")
            u.password_hash = get_password_hash(pwd)
            print(f"  ID {u.id:>3} | {u.role:<18} | {u.email:<35} | Nueva contraseña: {pwd}")

        await db.commit()
        print()
        print("=" * 60)
        print(f"Total de usuarios actualizados: {len(users)}")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(reset_all())
