"""Replica exacta del endpoint de login para diagnóstico."""
import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select, func
from app.auth import verify_password

async def main():
    email = "norbertomoro4@gmail.com"
    password = "AdminRookie2025!"
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(func.lower(User.email) == email, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        print(f"user found: {bool(user)}")
        if user:
            print(f"user.id={user.id} email={user.email} is_active={user.is_active}")
            print(f"hash prefix: {user.password_hash[:30]}")
            ok = verify_password(password or "", user.password_hash)
            print(f"verify_password result: {ok}")
            ok2 = verify_password("AdminRookie2025!", user.password_hash)
            print(f"verify direct result: {ok2}")
        else:
            # Listar todos los usuarios para ver qué hay
            r2 = await db.execute(select(User).order_by(User.id))
            for u in r2.scalars():
                print(f"  ALL_USERS id={u.id} email={u.email} is_active={u.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
