from __future__ import annotations
from datetime import datetime, date
from decimal import Decimal
from typing import Union, Optional, List, Any
from pydantic import BaseModel


# ── Sub-esquemas del JSON extraído ──────────────────────────────────────────

class Encabezado(BaseModel):
    fecha_hora_consulta: Optional[str] = None
    contrato: Optional[str] = None
    nombre_cliente: Optional[str] = None


class Producto(BaseModel):
    tipo: Optional[str] = None
    moneda: Optional[str] = None


class NotasLegales(BaseModel):
    garantia_ipab: Optional[str] = None
    nota_gat: Optional[str] = None


class DetalleComprobante(BaseModel):
    fecha_hora_operacion: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    cuenta_cargo: Optional[str] = None
    cuenta_deposito: Optional[str] = None
    contrato_inversion: Optional[str] = None
    isr_impuesto_mxn: Optional[float] = None
    importe_inversion_mxn: Optional[float] = None
    interes_mxn: Optional[float] = None
    plazo_dias: Optional[int] = None
    importe_neto_vencimiento_mxn: Optional[float] = None
    tasa_fija_anual_antes_impuestos_pct: Optional[float] = None
    gat_nominal_antes_impuestos: Optional[Union[float, str]] = None
    tasa_fija_anual_despues_impuestos_pct: Optional[float] = None
    gat_real_antes_impuestos: Optional[Union[float, str]] = None


class DatosConfirmacion(BaseModel):
    folio_inversion: Optional[str] = None
    folio_internet: Optional[str] = None


class ComprobanteExtraido(BaseModel):
    encabezado: Optional[Encabezado] = None
    producto: Optional[Producto] = None
    notas_legales: Optional[NotasLegales] = None
    estado_operacion: Optional[str] = None
    detalle_comprobante: Optional[DetalleComprobante] = None
    datos_confirmacion_transferencia: Optional[DatosConfirmacion] = None


# ── Resultado de validación ──────────────────────────────────────────────────

class ReglaNegocio(BaseModel):
    id: str
    ok: bool
    esperado: Optional[Any] = None
    obtenido: Optional[Any] = None
    informativo: Optional[bool] = None


class ResultadoValidacion(BaseModel):
    schema_valido: bool
    orden_correcto: bool
    reglas_negocio: List[ReglaNegocio]
    advertencias: List[Any]
    errores: List[Any]


# ── Respuesta del endpoint de carga ─────────────────────────────────────────

class RespuestaCarga(BaseModel):
    id: int
    datos: ComprobanteExtraido
    validacion: ResultadoValidacion


# ── Respuesta del listado (resumen) ─────────────────────────────────────────

class ComprobanteResumen(BaseModel):
    id: int
    fecha_carga: Optional[datetime] = None
    nombre_archivo: Optional[str] = None
    nombre_cliente: Optional[str] = None
    contrato: Optional[str] = None
    estado_operacion: Optional[str] = None
    importe_inversion_mxn: Optional[Decimal] = None
    plazo_dias: Optional[int] = None
    fecha_hora_operacion: Optional[datetime] = None
    fecha_vencimiento: Optional[date] = None
    folio_inversion: Optional[str] = None
    schema_valido: Optional[bool] = None

    model_config = {"from_attributes": True}


# ── Respuesta del detalle completo ───────────────────────────────────────────

class ComprobanteDetalle(BaseModel):
    id: int
    fecha_carga: Optional[datetime] = None
    nombre_archivo: Optional[str] = None
    nombre_cliente: Optional[str] = None
    contrato: Optional[str] = None
    estado_operacion: Optional[str] = None
    producto_tipo: Optional[str] = None
    producto_moneda: Optional[str] = None
    fecha_hora_operacion: Optional[datetime] = None
    fecha_vencimiento: Optional[date] = None
    cuenta_cargo: Optional[str] = None
    cuenta_deposito: Optional[str] = None
    contrato_inversion: Optional[str] = None
    isr_impuesto_mxn: Optional[Decimal] = None
    importe_inversion_mxn: Optional[Decimal] = None
    interes_mxn: Optional[Decimal] = None
    plazo_dias: Optional[int] = None
    importe_neto_vencimiento_mxn: Optional[Decimal] = None
    tasa_fija_anual_antes_impuestos_pct: Optional[Decimal] = None
    gat_nominal_antes_impuestos: Optional[str] = None
    tasa_fija_anual_despues_impuestos_pct: Optional[Decimal] = None
    gat_real_antes_impuestos: Optional[str] = None
    folio_inversion: Optional[str] = None
    folio_internet: Optional[str] = None
    schema_valido: Optional[bool] = None
    validacion_json: Optional[str] = None
    json_extraido: Optional[str] = None

    model_config = {"from_attributes": True}
