import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()
_db_url = (settings.database_url or "").strip()

# SQLite: usar driver async
if _db_url.startswith("sqlite://"):
    _db_url = _db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

# PostgreSQL: obligatorio usar asyncpg en producción (Render da postgresql:// y SQLAlchemy cargaría psycopg2)
if _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Render PostgreSQL: quitar parámetros SSL de la URL para que asyncpg no use sslmode=require (verificación)
# y use solo nuestro connect_args["ssl"] con CERT_NONE (sin verificar certificado self-signed).
if "postgresql" in _db_url and "?" in _db_url:
    _parsed = urlparse(_db_url)
    _q = parse_qs(_parsed.query, keep_blank_values=True)
    for _key in ("sslmode", "sslrootcert", "sslcert", "sslkey", "sslcrl", "ssl"):
        _q.pop(_key, None)
    _new_query = urlencode(_q, doseq=True)
    _db_url = urlunparse((_parsed.scheme, _parsed.netloc, _parsed.path, _parsed.params, _new_query or "", _parsed.fragment))
    if _db_url.endswith("?"):
        _db_url = _db_url.rstrip("?")

# Render PostgreSQL puede usar certificado que falla verificación (CERTIFICATE_VERIFY_FAILED / self-signed)
_connect_args = {}
if "postgresql" in _db_url:
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args["ssl"] = _ssl_ctx

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
