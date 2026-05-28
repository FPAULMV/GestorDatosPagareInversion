"""
Servicio de validación.
Responsabilidad: validar el JSON extraído contra el schema y las reglas de negocio.
"""
from datetime import datetime, date
from jsonschema import validate, ValidationError

_JSON_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "ComprobanteInversionPagareBBVA",
    "type": "object",
    "required": [
        "encabezado", "producto", "notas_legales", "estado_operacion",
        "detalle_comprobante", "datos_confirmacion_transferencia",
    ],
    "properties": {
        "encabezado": {
            "type": "object",
            "required": ["fecha_hora_consulta", "contrato", "nombre_cliente"],
            "properties": {
                "fecha_hora_consulta": {"type": "string"},
                "contrato": {"type": "string", "pattern": "^[0-9]{8}$"},
                "nombre_cliente": {"type": "string", "minLength": 1},
            },
        },
        "producto": {
            "type": "object",
            "required": ["tipo", "moneda"],
            "properties": {
                "tipo": {"type": "string", "minLength": 1},
                "moneda": {"type": "string", "enum": ["MXN", "USD"]},
            },
        },
        "notas_legales": {
            "type": "object",
            "required": ["garantia_ipab", "nota_gat"],
            "properties": {
                "garantia_ipab": {"type": "string", "minLength": 1},
                "nota_gat": {"type": "string", "minLength": 1},
            },
        },
        "estado_operacion": {
            "type": "string",
            "enum": ["Operación Exitosa", "Operación Fallida", "Operación Pendiente"],
        },
        "detalle_comprobante": {
            "type": "object",
            "required": [
                "fecha_hora_operacion", "fecha_vencimiento", "cuenta_cargo",
                "cuenta_deposito", "contrato_inversion", "isr_impuesto_mxn",
                "importe_inversion_mxn", "interes_mxn", "plazo_dias",
                "importe_neto_vencimiento_mxn", "tasa_fija_anual_antes_impuestos_pct",
                "gat_nominal_antes_impuestos", "tasa_fija_anual_despues_impuestos_pct",
                "gat_real_antes_impuestos",
            ],
            "properties": {
                "fecha_hora_operacion": {"type": "string"},
                "fecha_vencimiento": {"type": "string"},
                "cuenta_cargo": {"type": "string", "pattern": "^[0-9]{10}$"},
                "cuenta_deposito": {"type": "string", "pattern": "^[0-9]{10}$"},
                "contrato_inversion": {"type": "string", "pattern": "^[0-9]+$"},
                "isr_impuesto_mxn": {"type": "number", "minimum": 0},
                "importe_inversion_mxn": {"type": "number", "exclusiveMinimum": 0},
                "interes_mxn": {"type": "number", "minimum": 0},
                "plazo_dias": {"type": "integer", "minimum": 1},
                "importe_neto_vencimiento_mxn": {"type": "number", "exclusiveMinimum": 0},
                "tasa_fija_anual_antes_impuestos_pct": {"type": "number", "minimum": 0, "maximum": 100},
                "gat_nominal_antes_impuestos": {
                    "oneOf": [{"type": "number"}, {"type": "string", "const": "NO APLICA"}]
                },
                "tasa_fija_anual_despues_impuestos_pct": {"type": "number", "minimum": 0, "maximum": 100},
                "gat_real_antes_impuestos": {
                    "oneOf": [{"type": "number"}, {"type": "string", "const": "NO APLICA"}]
                },
            },
        },
        "datos_confirmacion_transferencia": {
            "type": "object",
            "required": ["folio_inversion", "folio_internet"],
            "properties": {
                "folio_inversion": {"type": "string", "pattern": "^[0-9]+$"},
                "folio_internet": {"type": "string", "pattern": "^[0-9]+$"},
            },
        },
    },
}

_ORDEN_ESPERADO = [
    "encabezado", "producto", "notas_legales", "estado_operacion",
    "detalle_comprobante", "datos_confirmacion_transferencia",
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parsear_datetime(s: str | None) -> datetime | None:
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _parsear_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


# ── Validaciones ─────────────────────────────────────────────────────────────

def _validar_schema(data: dict) -> tuple[bool, list[str]]:
    try:
        validate(instance=data, schema=_JSON_SCHEMA)
        return True, []
    except ValidationError as e:
        return False, [e.message]


def _validar_orden(data: dict) -> bool:
    claves = [k for k in data.keys() if k in _ORDEN_ESPERADO]
    return claves == _ORDEN_ESPERADO


def _validar_reglas_negocio(data: dict) -> list[dict]:
    resultados = []
    d = data.get("detalle_comprobante", {})

    importe = d.get("importe_inversion_mxn")
    interes = d.get("interes_mxn")
    isr = d.get("isr_impuesto_mxn")
    plazo = d.get("plazo_dias")
    neto = d.get("importe_neto_vencimiento_mxn")
    tasa_antes = d.get("tasa_fija_anual_antes_impuestos_pct")
    tasa_despues = d.get("tasa_fija_anual_despues_impuestos_pct")
    fecha_op_str = d.get("fecha_hora_operacion")
    fecha_vec_str = d.get("fecha_vencimiento")
    fecha_cons_str = data.get("encabezado", {}).get("fecha_hora_consulta")

    # BR-01: interés ≈ importe × (tasa/100) × (plazo/360)
    if all(v is not None for v in [importe, tasa_antes, plazo, interes]):
        esperado = round(importe * (tasa_antes / 100) * (plazo / 360), 2)
        resultados.append({
            "id": "BR-01", "ok": abs(esperado - interes) <= 0.01,
            "esperado": esperado, "obtenido": interes,
        })

    # BR-02: neto = importe + interés − isr
    if all(v is not None for v in [importe, interes, isr, neto]):
        esperado = round(importe + interes - isr, 2)
        resultados.append({
            "id": "BR-02", "ok": abs(esperado - neto) <= 0.01,
            "esperado": esperado, "obtenido": neto,
        })

    # BR-03: días entre fechas == plazo_dias
    if fecha_op_str and fecha_vec_str and plazo is not None:
        dt_op = _parsear_datetime(fecha_op_str)
        dt_vec = _parsear_date(fecha_vec_str)
        if dt_op and dt_vec:
            dias = (dt_vec - dt_op.date()).days
            resultados.append({"id": "BR-03", "ok": dias == plazo, "esperado": plazo, "obtenido": dias})

    # BR-04: isr ≤ interés
    if isr is not None and interes is not None:
        resultados.append({"id": "BR-04", "ok": isr <= interes})

    # BR-05: tasa_despues ≤ tasa_antes
    if tasa_antes is not None and tasa_despues is not None:
        resultados.append({
            "id": "BR-05", "ok": tasa_despues <= tasa_antes,
            "tasa_antes": tasa_antes, "tasa_despues": tasa_despues,
        })

    # BR-06: fecha_vencimiento >= fecha_operacion
    if fecha_op_str and fecha_vec_str:
        dt_op = _parsear_datetime(fecha_op_str)
        dt_vec = _parsear_date(fecha_vec_str)
        if dt_op and dt_vec:
            resultados.append({"id": "BR-06", "ok": dt_vec >= dt_op.date()})

    # BR-07: fecha_consulta cercana a fecha_operacion (informativo, ±24 h)
    if fecha_cons_str and fecha_op_str:
        dt_c = _parsear_datetime(fecha_cons_str)
        dt_o = _parsear_datetime(fecha_op_str)
        if dt_c and dt_o:
            diff_horas = abs((dt_c - dt_o).total_seconds()) / 3600
            resultados.append({
                "id": "BR-07", "ok": diff_horas <= 24,
                "diff_horas": round(diff_horas, 2), "informativo": True,
            })

    # BR-10: todos los montos ≥ 0
    montos = {
        "isr_impuesto_mxn": isr,
        "importe_inversion_mxn": importe,
        "interes_mxn": interes,
        "importe_neto_vencimiento_mxn": neto,
    }
    negativos = [c for c, v in montos.items() if v is not None and v < 0]
    resultados.append({"id": "BR-10", "ok": len(negativos) == 0, "campos_negativos": negativos})

    # BR-11: importe_inversion > 0
    if importe is not None:
        resultados.append({"id": "BR-11", "ok": importe > 0, "importe": importe})

    return resultados


# ── Punto de entrada ─────────────────────────────────────────────────────────

def validar_comprobante(data: dict) -> dict:
    """
    Ejecuta validación completa: schema, orden de claves y reglas de negocio.
    Devuelve un dict con el resultado listo para guardar y responder.
    """
    schema_valido, schema_errores = _validar_schema(data)
    orden_correcto = _validar_orden(data)
    reglas = _validar_reglas_negocio(data)

    advertencias = [r for r in reglas if not r.get("ok") and r.get("informativo")]
    errores = list(schema_errores) + [r for r in reglas if not r.get("ok") and not r.get("informativo")]

    return {
        "schema_valido": schema_valido,
        "orden_correcto": orden_correcto,
        "reglas_negocio": reglas,
        "advertencias": advertencias,
        "errores": errores,
    }
