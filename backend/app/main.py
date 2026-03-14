from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.middleware.security import SecurityHeadersMiddleware, LoginRateLimitMiddleware
from app import models  # noqa: F401 - asegura que todas las tablas (incl. audit_log) estén registradas antes de init_db
from app.api.auth_routes import router as auth_router
from app.api.calculator_routes import router as calculator_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.productos_routes import router as productos_router
from app.api.cotizaciones_routes import router as cotizaciones_router
from app.api.pdf_routes import router as pdf_router
from app.api.clientes_routes import router as clientes_router
from app.api.vendedores_routes import router as vendedores_router
from app.api.servicios_routes import router as servicios_router
from app.api.stl_routes import router as stl_router
from app.api.videos_routes import router as videos_router
from app.api.inventario_routes import router as inventario_router
from app.api.materiales_filamento_routes import router as materiales_filamento_router
from app.api.pagina_publica_routes import router as pagina_publica_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Mini ERP - Rookie Makers 3D",
    lifespan=lifespan,
)
# CORS: en Render poner CORS_ORIGINS=https://tu-app.vercel.app o CORS_ORIGINS=* para permitir todos
_raw = (settings.cors_origins or "").strip()
if _raw == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in _raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoginRateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth_router, prefix="/api")
app.include_router(calculator_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(productos_router, prefix="/api")
app.include_router(cotizaciones_router, prefix="/api")
app.include_router(pdf_router, prefix="/api")
app.include_router(clientes_router, prefix="/api")
app.include_router(vendedores_router, prefix="/api")
app.include_router(servicios_router, prefix="/api")
app.include_router(stl_router, prefix="/api")
app.include_router(videos_router, prefix="/api")
app.include_router(inventario_router, prefix="/api")
app.include_router(materiales_filamento_router, prefix="/api")
app.include_router(pagina_publica_router, prefix="/api")


@app.get("/")
def root():
    return {"app": settings.app_name, "docs": "/docs"}


@app.get("/api/health")
def health():
    """Público: para comprobar que el backend responde (p. ej. desde Vercel)."""
    return {"status": "ok"}
