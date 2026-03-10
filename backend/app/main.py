from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
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
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/")
def root():
    return {"app": settings.app_name, "docs": "/docs"}
