from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # "vendedor" | "administrador" | "vendedor_ventas"
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)  # solo para vendedores
    nombre = Column(String(255), nullable=True)  # nombre para mostrar (vendedor_ventas; vendedores usan Vendedor.nombre)
    telefono = Column(String(50), nullable=True)   # perfil vendedor_ventas (como diseñadores)
    banco = Column(String(255), nullable=True)
    cuenta = Column(String(100), nullable=True)
    clabe = Column(String(22), nullable=True)
    is_active = Column(Boolean, default=True)
    subscription_plan_role = Column(String(50), nullable=True)  # ej: vendedor, vendedor_ventas
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    # Diseño / tiempo de uso (admin asigna horas; tipo afecta plan sugerido al cobrar)
    horas_saldo = Column(Float, default=0)
    horas_paquete_expira_at = Column(DateTime(timezone=True), nullable=True)  # validez tipo “ciber”
    disenador_tipo = Column(String(32), nullable=True)  # rookie | emanuel | disenador_3d | None
    subscription_reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    recibir_alertas_suscripcion = Column(Boolean, default=True)
    mfa_secret = Column(String(64), nullable=True)  # TOTP secret (base32)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vendedor = relationship("Vendedor", back_populates="user", uselist=False)


class Vendedor(Base):
    __tablename__ = "vendedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    correo = Column(String(255), nullable=False)
    telefono = Column(String(50))
    banco = Column(String(255))
    cuenta = Column(String(100))
    clabe = Column(String(22), nullable=True)  # CLABE 18 dígitos en México
    # Tarjeta: nunca exponer el número completo; solo guardar últimos 4 y el número encriptado.
    tarjeta_ultimos4 = Column(String(4), nullable=True)
    tarjeta_enc = Column(Text, nullable=True)
    user = relationship("User", back_populates="vendedor", uselist=False)


class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    correo = Column(String(255), nullable=False)
    telefono = Column(String(50))
    direccion = Column(Text)


class Servicio(Base):
    __tablename__ = "servicios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    tarifa_fija = Column(Float, default=0)
    tarifa_por_hora = Column(Float, default=0)


class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(500), nullable=False)
    costo_base = Column(Float, default=0)
    costo_final = Column(Float, default=0)
    cantidad = Column(Float, default=1)
    vendedor = Column(String(255))  # nombre del vendedor (compatibilidad)
    detalles = Column(JSON, default=dict)  # tiempo_total, costo_filamento, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CotizacionEnEspera(Base):
    __tablename__ = "cotizaciones_en_espera"
    id = Column(Integer, primary_key=True, index=True)
    vendedor = Column(String(255), nullable=False)
    descripcion = Column(String(500), nullable=False)
    cantidad = Column(Float, default=1)
    costo_base = Column(Float, default=0)
    costo_final = Column(Float, default=0)
    fecha = Column(String(20))
    detalles = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ArchivoCotizacion(Base):
    """Archivo adjunto de una cotización en espera (STL, imagen, PDF). Se guarda en BD para persistencia."""
    __tablename__ = "archivos_cotizacion"
    id = Column(Integer, primary_key=True, index=True)
    cotizacion_id = Column(Integer, ForeignKey("cotizaciones_en_espera.id", ondelete="CASCADE"), nullable=False)
    nombre_original = Column(String(255), nullable=False)
    content_type = Column(String(128), nullable=False)
    content = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CotizacionServicio(Base):
    __tablename__ = "cotizaciones_servicios"
    id = Column(Integer, primary_key=True, index=True)
    items = Column(JSON, default=list)  # lista de {vendedor, descripcion, cantidad, horas, costo_final, fecha}
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReciboVenta(Base):
    __tablename__ = "recibos_venta"
    id = Column(Integer, primary_key=True, index=True)
    items = Column(JSON, default=list)
    vendedor = Column(String(255))
    fecha = Column(String(20))
    total = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VideoPromocional(Base):
    __tablename__ = "videos_promocionales"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    red = Column(String(50))
    orden = Column(Integer, default=0)
    estado = Column(String(20), default="aprobado")  # "solicitud" | "aprobado"
    solicitante = Column(String(255))  # nombre del vendedor que pidió subir (si aplica)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MaterialFilamento(Base):
    """Filamentos/materiales de impresión con costo por kg para cotizador."""
    __tablename__ = "materiales_filamento"
    id = Column(Integer, primary_key=True, index=True)
    id_externo = Column(String(50), unique=True, nullable=False)  # ej. 'pla', 'petg'
    nombre = Column(String(255), nullable=False)
    costo_por_kg = Column(Float, nullable=False, default=500)
    activo = Column(Boolean, default=True)
    orden = Column(Integer, default=0)


class InventarioItem(Base):
    """Materiales y materias primas (distinto de productos autorizados)."""
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    cantidad = Column(Float, default=0)
    unidad = Column(String(50), default="pza")
    costo_unitario = Column(Float, default=0)  # MXN por unidad (pza/m/kg/etc.) para usar en cotización
    foto_url = Column(Text, nullable=True)  # data URL o URL (ej. foto del filamento/accesorio)
    color_hex = Column(String(20), nullable=True)  # detectado desde foto (hex)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)  # quien lo subió; null = admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class InventarioFilamento(Base):
    """Stock de filamento por vendedor: nombre, color (auto desde foto), gramos, foto. Compartido Norberto+Daniel; Fidel aparte."""
    __tablename__ = "inventario_filamento"
    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    nombre = Column(String(255), nullable=False)
    tipo = Column(String(50), default="PLA")  # PLA, PETG, etc.
    color_hex = Column(String(20), nullable=True)  # auto desde foto
    color_nombre = Column(String(100), nullable=True)
    cantidad_gramos = Column(Float, default=0)
    foto_url = Column(String(500), nullable=True)  # URL o path a la imagen
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PaginaPublicaConfig(Base):
    """Configuración editable por admin: tamaños, fondos, categorías de la página pública."""
    __tablename__ = "pagina_publica_config"
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, nullable=False)
    valor = Column(JSON, default=dict)  # { "fontSizeTitle": 24, "categories": ["oficina","escuela"], ... }
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    """Registro de auditoría para eventos de seguridad (login, cambio de contraseña, acceso denegado)."""
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    event_type = Column(String(64), nullable=False)  # login_success, login_failed, password_changed, access_denied
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip = Column(String(64), nullable=True)
    details = Column(JSON, default=dict)  # email, reason, target_user_id, etc.


class PlanSuscripcion(Base):
    """Plan configurable por rol (mensualidad por usuario)."""
    __tablename__ = "planes_suscripcion"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False, unique=True)  # vendedor | vendedor_ventas | ...
    precio_mxn = Column(Float, default=0)
    periodo_dias = Column(Integer, default=30)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PagoSuscripcion(Base):
    """Registro de pagos (MercadoPago) para auditoría e historial."""
    __tablename__ = "pagos_suscripcion"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_role = Column(String(50), nullable=False)
    provider = Column(String(50), default="mercadopago")
    provider_payment_id = Column(String(100), nullable=True)
    status = Column(String(30), default="pendiente")  # pendiente|link_creado|aprobado|rechazado|cancelado|error
    amount = Column(Float, default=0)
    currency = Column(String(10), default="MXN")
    payment_url = Column(Text, nullable=True)
    months = Column(Integer, default=1)
    # Nombre en BD "metadata"; atributo Python distinto (SQLAlchemy reserva .metadata en el mapper)
    extra_data = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)


class AppSetting(Base):
    """Clave/valor JSON para toggles (ej. alertas automáticas)."""
    __tablename__ = "app_settings"
    key = Column(String(80), primary_key=True)
    value_json = Column(JSON, default=dict)


class AlertaProgramada(Base):
    """Alerta programada por admin: envía correos a cualquier destinatario."""
    __tablename__ = "alertas_programadas"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    to_emails = Column(JSON, default=list)  # lista de correos (strings)
    send_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pendiente")  # pendiente | pausada | enviado | error | cancelado
    sent_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
