"""
Servicio de extracción.
Responsabilidad: convertir bytes de un PDF en un dict estructurado usando regex.
Sin dependencia de API externa.
"""
import io
import re
import unicodedata
from datetime import datetime

import pdfplumber


# ── Extracción de texto ──────────────────────────────────────────────────────

def _extraer_texto_pdf(pdf_bytes: bytes) -> str:
    """Extrae el texto de todas las páginas del PDF."""
    partes = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for pagina in pdf.pages:
            texto = pagina.extract_text(x_tolerance=2, y_tolerance=2)
            if texto:
                partes.append(texto)
    return "\n".join(partes)


def _normalizar(texto: str) -> str:
    """
    1. Normaliza Unicode a forma NFC (acentos precompuestos).
    2. Reemplaza caracteres especiales raros por sus equivalentes ASCII.
    3. Colapsa múltiples espacios/saltos de línea en uno solo.
    """
    # Normalizar Unicode (acentos como un solo carácter)
    texto = unicodedata.normalize("NFC", texto)

    # Reemplazar caracteres Unicode especiales por equivalentes estándar
    reemplazos = {
        " ": " ",      # non-breaking space
        " ": " ",      # thin space
        "​": "",       # zero-width space
        "％": "%",      # fullwidth percent sign
        "–": "-",      # en dash
        "—": "-",      # em dash
    }
    for orig, nuevo in reemplazos.items():
        texto = texto.replace(orig, nuevo)

    # Colapsar whitespace
    return re.sub(r"\s+", " ", texto).strip()


# ── Parsers ──────────────────────────────────────────────────────────────────

def _parsear_fecha_hora(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    formatos = [
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y %I:%M:%S %p",
        "%d/%m/%Y %I:%M %p",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
    ]
    for fmt in formatos:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            continue
    return None


def _parsear_fecha(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def _parsear_numero(s: str | None) -> float | None:
    if not s:
        return None
    try:
        return float(re.sub(r"[\$\s,]", "", s.strip()))
    except ValueError:
        return None


def _parsear_porcentaje(s: str | None) -> float | None:
    if not s:
        return None
    s = s.strip()
    if "NO APLICA" in s.upper():
        return None
    try:
        return float(re.sub(r"[\s%]", "", s))
    except ValueError:
        return None


def _buscar(texto: str, patron: str, grupo: int = 1) -> str | None:
    """Busca un patrón regex y devuelve el grupo capturado."""
    match = re.search(patron, texto, re.IGNORECASE)
    if match:
        valor = match.group(grupo).strip()
        return valor if valor else None
    return None


# ── Extracción de campos ─────────────────────────────────────────────────────

def _extraer_datos(texto_original: str) -> dict:
    """Extrae todos los campos del comprobante BBVA."""

    texto = _normalizar(texto_original)

    # ── ENCABEZADO ─────────────────────────────────────────────────────────
    fecha_consulta_raw = _buscar(
        texto,
        r"Fecha\s+y\s+hora\s+de\s+consulta\s*:\s*(\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))"
    )
    fecha_consulta = _parsear_fecha_hora(fecha_consulta_raw)

    contrato = _buscar(texto, r"Contrato\s*:\s*(\d{8})\b")

    # nombre_cliente: el nombre está PARTIDO alrededor del label "Nombre del cliente:"
    # Capturar todo entre "Contrato: NNNNNNNN" y "Pagaré con rendimiento", luego limpiar
    nombre_cliente = None
    nombre_match = re.search(
        r"Contrato\s*:\s*\d{8}\s+(.+?)\s+Pagar[ée]\s+con\s+rendimiento",
        texto,
        re.IGNORECASE
    )
    if nombre_match:
        nombre_raw = nombre_match.group(1)
        # Eliminar la etiqueta "Nombre del cliente:" que está en medio
        nombre_cliente = re.sub(r"\s*Nombre\s+del\s+cliente\s*:?\s*", " ", nombre_raw, flags=re.IGNORECASE)
        nombre_cliente = re.sub(r"\s+", " ", nombre_cliente).strip()

    # ── PRODUCTO ───────────────────────────────────────────────────────────
    # "Pagaré con rendimiento liquidable al vencimiento (MXN)"
    producto_tipo = _buscar(
        texto,
        r"(Pagar[ée]\s+con\s+rendimiento\s+liquidable\s+al\s+vencimiento)"
    )

    producto_moneda = _buscar(
        texto,
        r"liquidable\s+al\s+vencimiento\s*\(([A-Z]{3})\)"
    )

    # ── NOTAS LEGALES ──────────────────────────────────────────────────────
    # IPAB: desde "Únicamente están garantizados" hasta antes de la nota GAT o la operación
    garantia_ipab = _buscar(
        texto,
        r"(Únicamente\s+est[áa]n\s+garantizados.+?)(?=\s*\*?\s*La\s+GAT\s+Real|\s*Operaci[óo]n\s+(?:Exitosa|Fallida|Pendiente))"
    )

    # GAT note: desde "La GAT Real es" hasta antes de Operación o Detalle
    nota_gat = _buscar(
        texto,
        r"(La\s+GAT\s+Real\s+es.+?)(?=\s*Operaci[óo]n\s+(?:Exitosa|Fallida|Pendiente)|\s*Detalle\s+del\s+comprobante)"
    )

    # ── ESTADO ─────────────────────────────────────────────────────────────
    estado = _buscar(texto, r"(Operaci[óo]n\s+(?:Exitosa|Fallida|Pendiente))")

    # ── DETALLE DEL COMPROBANTE ────────────────────────────────────────────
    # Fecha operación: formato YYYY-MM-DD HH:MM:SS
    fecha_op_raw = _buscar(
        texto,
        r"Fecha\s+y\s+hora\s+de\s+la\s+operaci[óo]n\s*:?\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})"
    )
    fecha_op = _parsear_fecha_hora(fecha_op_raw)

    # Fecha vencimiento: formato YYYY-MM-DD
    fecha_vec_raw = _buscar(
        texto,
        r"Fecha\s+de\s+vencimiento\s*:?\s*(\d{4}-\d{2}-\d{2})"
    )
    fecha_vec = _parsear_fecha(fecha_vec_raw)

    cuenta_cargo = _buscar(texto, r"Cuenta\s+cargo\s*:?\s*(\d{10})")
    cuenta_deposito = _buscar(texto, r"Cuenta\s+de\s+dep[óo]sito\s*:?\s*(\d{10})")
    contrato_inversion = _buscar(texto, r"Contrato\s+de\s+inversi[óo]n\s*:?\s*(\d+)")

    isr_raw = _buscar(texto, r"ISR\s+Impuesto\s*:?\s*\$?\s*([\d,]+\.\d{2})")
    isr = _parsear_numero(isr_raw)

    importe_raw = _buscar(
        texto,
        r"Importe\s+de\s+la\s+inversi[óo]n\s+M\.?\s*N\.?\s*:?\s*\$?\s*([\d,]+\.\d{2})"
    )
    importe = _parsear_numero(importe_raw)

    interes_raw = _buscar(texto, r"Inter[ée]s\s*:?\s*\$?\s*([\d,]+\.\d{2})")
    interes = _parsear_numero(interes_raw)

    plazo_raw = _buscar(texto, r"Plazo\s*\(en\s+d[íi]as\)\s*:?\s*(\d+)")
    plazo = int(plazo_raw) if plazo_raw else None

    neto_raw = _buscar(
        texto,
        r"Importe\s+neto\s+al\s+vencimiento\s*\(MXN\)\s*:?\s*\$?\s*([\d,]+\.\d{2})"
    )
    neto = _parsear_numero(neto_raw)

    # Tasa antes: el label "Tasa fija anual antes de impuestos:" puede partirse
    # en líneas y el valor "6.50 %" puede aparecer alineado con la primera línea.
    # Usamos [^\d]*? para saltar cualquier texto no-numérico hasta el porcentaje.
    tasa_antes_raw = _buscar(
        texto,
        r"Tasa\s+fija\s+anual\s+antes[^\d]*?(\d+(?:\.\d+)?)\s*%"
    )
    tasa_antes = _parsear_porcentaje(tasa_antes_raw)

    # GAT Nominal: "* GAT Nominal antes de impuestos: NO APLICA" o porcentaje
    gat_nominal_raw = _buscar(
        texto,
        r"\*?\s*GAT\s+Nominal\s+antes\s+de\s+impuestos\s*:?\s*(NO\s+APLICA|\d+(?:\.\d{1,4})?\s*%)"
    )
    if gat_nominal_raw and "NO APLICA" in gat_nominal_raw.upper():
        gat_nominal = "NO APLICA"
    else:
        gat_nominal = _parsear_porcentaje(gat_nominal_raw)

    # Tasa después: mismo problema de layout que tasa antes
    tasa_despues_raw = _buscar(
        texto,
        r"Tasa\s+fija\s+anual\s+despu[ée]s[^\d]*?(\d+(?:\.\d+)?)\s*%"
    )
    tasa_despues = _parsear_porcentaje(tasa_despues_raw)

    # GAT Real: "* GAT Real antes de impuestos: NO APLICA" o porcentaje
    gat_real_raw = _buscar(
        texto,
        r"\*?\s*GAT\s+Real\s+antes\s+de\s+impuestos\s*:?\s*(NO\s+APLICA|\d+(?:\.\d{1,4})?\s*%)"
    )
    if gat_real_raw and "NO APLICA" in gat_real_raw.upper():
        gat_real = "NO APLICA"
    else:
        gat_real = _parsear_porcentaje(gat_real_raw)

    # ── CONFIRMACIÓN ───────────────────────────────────────────────────────
    folio_inversion = _buscar(texto, r"Folio\s+de\s+inversi[óo]n\s*:?\s*(\d+)")
    folio_internet = _buscar(texto, r"Folio\s+de\s+internet\s*:?\s*(\d+)")

    return {
        "encabezado": {
            "fecha_hora_consulta": fecha_consulta,
            "contrato": contrato,
            "nombre_cliente": nombre_cliente,
        },
        "producto": {
            "tipo": producto_tipo,
            "moneda": producto_moneda,
        },
        "notas_legales": {
            "garantia_ipab": garantia_ipab,
            "nota_gat": nota_gat,
        },
        "estado_operacion": estado,
        "detalle_comprobante": {
            "fecha_hora_operacion": fecha_op,
            "fecha_vencimiento": fecha_vec,
            "cuenta_cargo": cuenta_cargo,
            "cuenta_deposito": cuenta_deposito,
            "contrato_inversion": contrato_inversion,
            "isr_impuesto_mxn": isr,
            "importe_inversion_mxn": importe,
            "interes_mxn": interes,
            "plazo_dias": plazo,
            "importe_neto_vencimiento_mxn": neto,
            "tasa_fija_anual_antes_impuestos_pct": tasa_antes,
            "gat_nominal_antes_impuestos": gat_nominal,
            "tasa_fija_anual_despues_impuestos_pct": tasa_despues,
            "gat_real_antes_impuestos": gat_real,
        },
        "datos_confirmacion_transferencia": {
            "folio_inversion": folio_inversion,
            "folio_internet": folio_internet,
        },
    }


def procesar_pdf(pdf_bytes: bytes) -> dict:
    """
    Punto de entrada del servicio.
    Recibe bytes del PDF y devuelve el dict con los datos extraídos.
    """
    texto = _extraer_texto_pdf(pdf_bytes)
    return _extraer_datos(texto)


# ── Modo debug ───────────────────────────────────────────────────────────────

def extraer_texto_para_debug(pdf_bytes: bytes) -> dict:
    """Devuelve el texto crudo Y normalizado para diagnóstico."""
    texto_crudo = _extraer_texto_pdf(pdf_bytes)
    texto_normalizado = _normalizar(texto_crudo)
    return {
        "texto_crudo": texto_crudo,
        "texto_normalizado": texto_normalizado,
        "longitud_crudo": len(texto_crudo),
        "longitud_normalizado": len(texto_normalizado),
    }
