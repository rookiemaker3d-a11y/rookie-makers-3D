from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import date


# ----- Auth -----
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class LoginRequest(BaseModel):
    email: str
    password: str


# ----- User -----
class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    vendedor_id: Optional[int] = None
    vendedor_nombre: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Vendedor -----
class VendedorBase(BaseModel):
    nombre: str
    correo: str
    telefono: Optional[str] = None
    banco: Optional[str] = None
    cuenta: Optional[str] = None


class VendedorCreate(VendedorBase):
    pass


class VendedorResponse(VendedorBase):
    id: int
    user_id: Optional[int] = None  # para que el admin pueda cambiar contraseña

    class Config:
        from_attributes = True


class VendedorUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    banco: Optional[str] = None
    cuenta: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    new_password: str


# ----- Cliente -----
class ClienteBase(BaseModel):
    nombre: str
    correo: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    id: int

    class Config:
        from_attributes = True


# ----- Costos (calculadora) -----
class CalculateCostRequest(BaseModel):
    horas: float = 0
    minutos: float = 0
    gramos: float = 0
    limpieza: float = 0  # minutos
    diseno: float = 0    # minutos
    cantidad: float = 1
    envio: float = 0
    descripcion: Optional[str] = None


class CalculateCostResponse(BaseModel):
    costo_filamento: float
    costo_energia: float
    costo_limpieza: float
    costo_diseno: float
    costo_base_pieza: float
    costo_final_total: float
    tiempo_total_min: float


# ----- Producto -----
class ProductoBase(BaseModel):
    descripcion: str
    costo_base: float = 0
    costo_final: float = 0
    cantidad: float = 1
    vendedor: Optional[str] = None
    detalles: Optional[dict] = None


class ProductoCreate(ProductoBase):
    pass


class ProductoResponse(ProductoBase):
    id: int
    detalles: Optional[dict] = None

    class Config:
        from_attributes = True


# ----- Cotización en espera -----
class CotizacionEnEsperaCreate(BaseModel):
    descripcion: str
    cantidad: float = 1
    costo_base: float
    costo_final: float
    detalles: dict
    fecha: Optional[str] = None


class CotizacionEnEsperaResponse(BaseModel):
    id: int
    vendedor: str
    descripcion: str
    cantidad: float
    costo_base: float
    costo_final: float
    fecha: Optional[str] = None
    detalles: Optional[dict] = None

    class Config:
        from_attributes = True


# ----- Dashboard -----
class DashboardTotals(BaseModel):
    total_costo: float
    total_venta: float
    ganancia_neta: float
    cantidad_productos: int


# ----- PDF -----
class CotizacionItem(BaseModel):
    descripcion: str
    cantidad: float
    tiempo_total: float
    costo_final: float
    detalles: Optional[dict] = None


class GenerateQuotePDFRequest(BaseModel):
    items: list[CotizacionItem]
    vendedor_nombre: str
    tipo: str = "cotizacion"  # "cotizacion" | "recibo"


# Fix forward ref
Token.model_rebuild()


# ----- Materiales filamento (costos por kg para cotizador) -----
class MaterialFilamentoResponse(BaseModel):
    id: int
    id_externo: str
    nombre: str
    costo_por_kg: float
    activo: bool = True
    orden: int = 0

    class Config:
        from_attributes = True


class MaterialFilamentoUpdate(BaseModel):
    costo_por_kg: Optional[float] = None
    nombre: Optional[str] = None
    activo: Optional[bool] = None


# ----- Inventario (materiales / materias primas) -----
class InventarioItemBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cantidad: float = 0
    unidad: str = "pza"


class InventarioItemCreate(InventarioItemBase):
    pass


class InventarioItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None


class InventarioItemResponse(InventarioItemBase):
    id: int
    vendedor_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Página pública (config editable por admin) -----
class PaginaPublicaConfigUpdate(BaseModel):
    fontSizeTitle: Optional[int] = None
    fontSizeSubtitle: Optional[int] = None
    backgroundColor: Optional[str] = None
    categories: Optional[list[str]] = None  # oficina, escuela, industrial, etc.
