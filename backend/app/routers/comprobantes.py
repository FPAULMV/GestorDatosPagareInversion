"""
Router de comprobantes.
Responsabilidad: recibir peticiones HTTP, delegar al servicio y devolver la respuesta.
No contiene lógica de negocio.
"""
import json
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.models.comprobante import Comprobante
from app.schemas.comprobante import RespuestaCarga, ComprobanteResumen, ComprobanteDetalle
from app.services.extractor import procesar_pdf, extraer_texto_para_debug
from app.services.validador import validar_comprobante

router = APIRouter(prefix="/api/comprobantes", tags=["Comprobantes"])


@router.post("/debug", summary="Debug: ver texto crudo extraído del PDF")
async def debug_pdf(archivo: UploadFile = File(...)):
    """Endpoint de diagnóstico. Devuelve el texto crudo extraído del PDF."""
    if not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")
    pdf_bytes = await archivo.read()
    texto = extraer_texto_para_debug(pdf_bytes)
    return {"texto_extraido": texto, "longitud": len(texto)}


@router.post("/", response_model=RespuestaCarga, summary="Cargar y procesar un PDF")
async def cargar_comprobante(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")

    pdf_bytes = await archivo.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")

    # Extraer datos del PDF
    try:
        datos = procesar_pdf(pdf_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error en la extracción: {exc}")

    if "error" in datos:
        raise HTTPException(status_code=422, detail=datos)

    # Validar
    validacion = validar_comprobante(datos)

    # Guardar en BD
    registro = _construir_modelo(datos, validacion, archivo.filename)
    db.add(registro)
    db.commit()
    db.refresh(registro)

    return RespuestaCarga(id=registro.id, datos=datos, validacion=validacion)


@router.get("/", response_model=List[ComprobanteResumen], summary="Listar comprobantes")
def listar_comprobantes(limite: int = 50, db: Session = Depends(get_db)):
    registros = (
        db.query(Comprobante)
        .order_by(Comprobante.fecha_carga.desc())
        .limit(limite)
        .all()
    )
    return registros


@router.get("/{registro_id}", response_model=ComprobanteDetalle, summary="Detalle de un comprobante")
def obtener_comprobante(registro_id: int, db: Session = Depends(get_db)):
    registro = db.query(Comprobante).filter(Comprobante.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado.")
    return registro


# ── Helper privado ───────────────────────────────────────────────────────────

def _construir_modelo(datos: dict, validacion: dict, nombre_archivo: str) -> Comprobante:
    enc = datos.get("encabezado", {}) or {}
    prod = datos.get("producto", {}) or {}
    notas = datos.get("notas_legales", {}) or {}
    d = datos.get("detalle_comprobante", {}) or {}
    conf = datos.get("datos_confirmacion_transferencia", {}) or {}

    return Comprobante(
        nombre_archivo=nombre_archivo,
        fecha_hora_consulta=enc.get("fecha_hora_consulta"),
        contrato=enc.get("contrato"),
        nombre_cliente=enc.get("nombre_cliente"),
        producto_tipo=prod.get("tipo"),
        producto_moneda=prod.get("moneda"),
        garantia_ipab=notas.get("garantia_ipab"),
        nota_gat=notas.get("nota_gat"),
        estado_operacion=datos.get("estado_operacion"),
        fecha_hora_operacion=d.get("fecha_hora_operacion"),
        fecha_vencimiento=d.get("fecha_vencimiento"),
        cuenta_cargo=d.get("cuenta_cargo"),
        cuenta_deposito=d.get("cuenta_deposito"),
        contrato_inversion=d.get("contrato_inversion"),
        isr_impuesto_mxn=d.get("isr_impuesto_mxn"),
        importe_inversion_mxn=d.get("importe_inversion_mxn"),
        interes_mxn=d.get("interes_mxn"),
        plazo_dias=d.get("plazo_dias"),
        importe_neto_vencimiento_mxn=d.get("importe_neto_vencimiento_mxn"),
        tasa_fija_anual_antes_impuestos_pct=d.get("tasa_fija_anual_antes_impuestos_pct"),
        gat_nominal_antes_impuestos=str(d.get("gat_nominal_antes_impuestos")) if d.get("gat_nominal_antes_impuestos") is not None else None,
        tasa_fija_anual_despues_impuestos_pct=d.get("tasa_fija_anual_despues_impuestos_pct"),
        gat_real_antes_impuestos=str(d.get("gat_real_antes_impuestos")) if d.get("gat_real_antes_impuestos") is not None else None,
        folio_inversion=conf.get("folio_inversion"),
        folio_internet=conf.get("folio_internet"),
        schema_valido=validacion.get("schema_valido"),
        validacion_json=json.dumps(validacion, ensure_ascii=False),
        json_extraido=json.dumps(datos, ensure_ascii=False),
    )
