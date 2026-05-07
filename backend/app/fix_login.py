"""Diagnóstico de login — ejecutar en el VPS."""
import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select
from app.auth import get_password_hash, verify_password

async def main():
    email = "norbertomoro4@gmail.com"
    password = "AdminRookie2025!"
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        print(f"user found: {bool(user)}")
        if user:
            print(f"user.id={user.id} email={user.email} is_active={user.is_active}")
            print(f"hash prefix: {user.password_hash[:30]}")
            ok = verify_password(password, user.password_hash)
            print(f"verify_password('{password}', hash) = {ok}")
            ok2 = verify_password("", user.password_hash)
            print(f"verify_password('', hash) = {ok2}")
            # Re-hash y guardar explícitamente
            new_hash = get_password_hash(password)
            user.password_hash = new_hash
            await db.commit()
            print(f"Nuevo hash guardado: {new_hash[:30]}")
            # Verificar de nuevo
            ok3 = verify_password(password, new_hash)
            print(f"verify_password después de guardar = {ok3}")
        else:
            print("Usuario no encontrado")

if __name__ == "__main__":
    asyncio.run(main())
