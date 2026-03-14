from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()
_db_url = settings.database_url or ""

# SQLite: usar driver async
if _db_url.startswith("sqlite://"):
    _db_url = _db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

# PostgreSQL: usar asyncpg (Render/Supabase dan postgresql:// o postgres://; SQLAlchemy por defecto usa psycopg2)
if _db_url.startswith("postgresql://") and "+" not in _db_url.split("?")[0]:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://") and "+" not in _db_url.split("?")[0]:
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Render (y otros Postgres en la nube) exigen SSL desde fuera
_connect_args = {}
if "postgresql" in _db_url:
    _connect_args["ssl"] = True

engine = create_async_engine(_db_url, echo=False, connect_args=_connect_args)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def _migrate_sqlite(sync_conn):
    """Añade columnas que falten en tablas existentes (SQLite). create_all no añade columnas nuevas."""
    for stmt in [
        "ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0",
    ]:
        try:
            sync_conn.execute(text(stmt))
        except Exception:
            pass  # columna ya existe o no es SQLite


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_sqlite)
