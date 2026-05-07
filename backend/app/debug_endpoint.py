"""Replica EXACTA del endpoint de login para diagnóstico."""
import asyncio
from app.database import get_db
from app.api.auth_routes import login, LoginRequest, Request
from app.auth import verify_password
from app.models import User
from sqlalchemy import select, func

async def main():
    email = "norbertomoro4@gmail.com"
    password = "AdminRookie2025!"

    data = LoginRequest(email=email, password=password)

    # Simular request mínimo
    class FakeClient:
        host = "127.0.0.1"
    class FakeRequest:
        client = FakeClient()
        headers = {}
        url = type("U", (), {"path": "/api/auth/login"})()
    request = FakeRequest()

    # Usar get_db exactamente como el endpoint
    db_gen = get_db()
    db = await db_gen.__anext__()
    try:
        print(f"data.email={data.email!r} data.password={data.password!r}")
        print(f"email after strip.lower={email.strip().lower()!r}")

        result = await db.execute(
            select(User).where(func.lower(User.email) == email.strip().lower(), User.is_active == True)
        )
        user = result.scalar_one_or_none()
        print(f"user found: {bool(user)}")
        if user:
            print(f"user.id={user.id} email={user.email} is_active={user.is_active}")
            print(f"hash prefix: {user.password_hash[:30]}")
            ok = verify_password(data.password or "", user.password_hash)
            print(f"verify_password(data.password, hash) = {ok}")
        else:
            print("Usuario NO encontrado por el query del endpoint!")
            # Listar todos
            r2 = await db.execute(select(User).order_by(User.id))
            for u in r2.scalars():
                print(f"  ALL id={u.id} email={u.email} is_active={u.is_active}")
    finally:
        try:
            await db_gen.__anext__()
        except StopAsyncIteration:
            pass

if __name__ == "__main__":
    asyncio.run(main())
