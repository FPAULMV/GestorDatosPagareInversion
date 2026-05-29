from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, Text, Boolean
from sqlalchemy.sql import func
from app.utils.db import Base


class Comprobante(Base):
    __tablename__ = "pagare_inversiones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha_carga = Column(DateTime, server_default=func.now(), nullable=False)
    nombre_archivo = Column(String(255), nullable=True)

    # encabezado
    fecha_hora_consulta = Column(DateTime, nullable=True)
    contrato = Column(String(8), nullable=True)
    nombre_cliente = Column(String(255), nullable=True)

    # producto
    producto_tipo = Column(String(255), nullable=True)
    producto_moneda = Column(String(3), nullable=True)

    # notas legales
    garantia_ipab = Column(Text, nullable=True)
    nota_gat = Column(Text, nullable=True)

    # estado
    estado_operacion = Column(String(50), nullable=True)

    # detalle comprobante
    fecha_hora_operacion = Column(DateTime, nullable=True)
    fecha_vencimiento = Column(Date, nullable=True)
    cuenta_cargo = Column(String(10), nullable=True)
    cuenta_deposito = Column(String(10), nullable=True)
    contrato_inversion = Column(String(20), nullable=True)
    isr_impuesto_mxn = Column(Numeric(18, 4), nullable=True)
    importe_inversion_mxn = Column(Numeric(18, 4), nullable=True)
    interes_mxn = Column(Numeric(18, 4), nullable=True)
    plazo_dias = Column(Integer, nullable=True)
    importe_neto_vencimiento_mxn = Column(Numeric(18, 4), nullable=True)
    tasa_fija_anual_antes_impuestos_pct = Column(Numeric(10, 4), nullable=True)
    gat_nominal_antes_impuestos = Column(String(20), nullable=True)
    tasa_fija_anual_despues_impuestos_pct = Column(Numeric(10, 4), nullable=True)
    gat_real_antes_impuestos = Column(String(20), nullable=True)

    # confirmación
    folio_inversion = Column(String(50), nullable=True)
    folio_internet = Column(String(50), nullable=True)

    # archivo original
    hash_archivo = Column(String(64), nullable=True)
    texto_plano = Column(Text, nullable=True)

    # validación y JSON completo
    schema_valido = Column(Boolean, nullable=True)
    validacion_json = Column(Text, nullable=True)
    json_extraido = Column(Text, nullable=True)
