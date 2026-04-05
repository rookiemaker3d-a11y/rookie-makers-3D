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
    nombre: Optional[str] = None  # nombre para mostrar (vendedor_nombre o user.nombre o email)
    vendedor_nombre: Optional[str] = None
    vendedor_correo: Optional[str] = None
    vendedor_telefono: Optional[str] = None
    vendedor_banco: Optional[str] = None
    vendedor_cuenta: Optional[str] = None
    vendedor_clabe: Optional[str] = None
    vendedor_tarjeta_ultimos4: Optional[str] = None

    class Config:
        from_attributes = True


class MiPerfilUpdate(BaseModel):
    """Actualizar perfil del usuario actual. Vendedor: Vendedor; vendedor_ventas: User (nombre, telefono, banco, cuenta, clabe)."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    banco: Optional[str] = None
    cuenta: Optional[str] = None
    clabe: Optional[str] = None


class CambiarContrasenaRequest(BaseModel):
    """Cambio de contraseña del usuario actual. Requiere la actual y envía correo de confirmación."""
    current_password: str
    new_password: str


# ----- Vendedor -----
class VendedorBase(BaseModel):
    nombre: str
    correo: str
    telefono: Optional[str] = None
    banco: Optional[str] = None
    cuenta: Optional[str] = None
    clabe: Optional[str] = None
    tarjeta_ultimos4: Optional[str] = None


class VendedorCreate(VendedorBase):
    pass


class VendedorCreateWithUser(VendedorBase):
    """Para agregar diseñador/vendedor con usuario de login. Solo admin."""
    password: Optional[str] = None  # si se envía, se crea User con este password y role vendedor


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
    clabe: Optional[str] = None
    # Se envía el número completo solo al guardar; el backend lo encripta y solo devuelve últimos 4.
    tarjeta_numero: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    new_password: str


class VendedorVentasCreate(BaseModel):
    """Solo admin. Crea usuario con rol vendedor_ventas (sin perfil en tabla diseñadores)."""
    email: str
    password: str


class VendedorVentasUpdate(BaseModel):
    """Solo admin. Actualiza usuario vendedor_ventas: email, contraseña, nombre, telefono, banco, cuenta, clabe."""
    email: Optional[str] = None
    new_password: Optional[str] = None
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    banco: Optional[str] = None
    cuenta: Optional[str] = None
    clabe: Optional[str] = None


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


class ProductoUpdate(BaseModel):
    """Actualización parcial: detalles y/o costos (desde análisis/edición)."""
    detalles: Optional[dict] = None
    costo_base: Optional[float] = None
    costo_final: Optional[float] = None


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
    created_at: Optional[str] = None
    has_archivo: Optional[bool] = None

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
    costo_unitario: float = 0
    foto_url: Optional[str] = None
    color_hex: Optional[str] = None


class InventarioItemCreate(InventarioItemBase):
    pass


class InventarioItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None
    costo_unitario: Optional[float] = None
    foto_url: Optional[str] = None
    color_hex: Optional[str] = None


class InventarioItemResponse(InventarioItemBase):
    id: int
    vendedor_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Inventario filamento (stock por vendedor, color desde foto) -----
class InventarioFilamentoCreate(BaseModel):
    nombre: str
    tipo: str = "PLA"
    color_hex: Optional[str] = None
    color_nombre: Optional[str] = None
    cantidad_gramos: float = 0
    foto_url: Optional[str] = None  # data URL o path


class InventarioFilamentoUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    color_hex: Optional[str] = None
    color_nombre: Optional[str] = None
    cantidad_gramos: Optional[float] = None
    foto_url: Optional[str] = None
    activo: Optional[bool] = None


class InventarioFilamentoResponse(BaseModel):
    id: int
    vendedor_id: int
    nombre: str
    tipo: str
    color_hex: Optional[str] = None
    color_nombre: Optional[str] = None
    cantidad_gramos: float
    foto_url: Optional[str] = None
    activo: bool = True
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ConsumirFilamentoBody(BaseModel):
    gramos: float


# ----- Página pública (config editable por admin) -----
class PaginaPublicaConfigUpdate(BaseModel):
    fontSizeTitle: Optional[int] = None
    fontSizeSubtitle: Optional[int] = None
    backgroundColor: Optional[str] = None
    categories: Optional[list[str]] = None  # oficina, escuela, industrial, etc.


# ----- Landing (contenido completo página pública, tema cyan | green) -----
class LandingUpdate(BaseModel):
    theme: Optional[str] = None  # "cyan" | "green"
    hero: Optional[dict] = None
    stats: Optional[list] = None
    process: Optional[list] = None
    gallery: Optional[list] = None
    cta: Optional[dict] = None
    footer: Optional[dict] = None
    nav: Optional[dict] = None
    # Materiales de la calculadora pública (costoPorKg MXN, type FDM|SLA)
    calculatorMaterials: Optional[list] = None
