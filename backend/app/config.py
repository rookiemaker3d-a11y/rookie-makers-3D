from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


def _normalize_db_url(url: str) -> str:
    """Render y otros dan postgresql:// o postgres://; debemos usar postgresql+asyncpg:// (asyncpg, no psycopg2)."""
    if not url:
        return url
    u = url.strip()
    if u.startswith("postgresql://") and "+" not in u.split("?")[0]:
        return u.replace("postgresql://", "postgresql+asyncpg://", 1)
    if u.startswith("postgres://") and "+" not in u.split("?")[0]:
        return u.replace("postgres://", "postgresql+asyncpg://", 1)
    return u


class Settings(BaseSettings):
    app_name: str = "Rookie Makers 3D ERP"
    # SQLite por defecto; para PostgreSQL: postgresql+asyncpg://user:pass@host/db (Render inyecta postgresql://)
    database_url: str = "sqlite+aiosqlite:///./rookie_erp.db"
    secret_key: str = "rookie-makers-3d-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # 30 min inactividad (informe 4.1); en producción considerar 8h absoluto
    use_https: bool = False  # Si True, se añade header Strict-Transport-Security (HSTS)
    # CORS: en producción poner ej. https://tu-app.vercel.app (varios separados por coma)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    # Constantes de negocio (igual que calculator_window.py)
    margen_ganancia: float = 0.50
    costo_filamento_base: float = 500.0  # MXN/kg
    costo_energia_base: float = 4.50
    costo_limpieza_base: float = 25.0
    costo_diseno_base: float = 50.0
    
    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v):
        if isinstance(v, str):
            return _normalize_db_url(v)
        return v

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
