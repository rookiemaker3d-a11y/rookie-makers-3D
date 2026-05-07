"""Diagnóstico de login — ejecutar en el VPS."""
import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select
from app.auth import verify_password

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).order_by(User.id))
        users = result.scalars().all()
        for u in users:
            ok = verify_password("AdminRookie2025!", u.password_hash) if u.role == "administrador" else verify_password("VendedorRookie2025!", u.password_hash)
            print(f"found={True} email={u.email} role={u.role} is_active={u.is_active} verify_ok={ok}")

if __name__ == "__main__":
    asyncio.run(main())
