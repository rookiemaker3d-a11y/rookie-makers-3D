from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # "vendedor" | "administrador"
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)  # solo para vendedores
    is_active = Column(Boolean, default=True)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
