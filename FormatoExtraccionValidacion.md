# CLAUDE.md — Extracción y Validación de Comprobantes de Inversión Pagaré BBVA

## Propósito

Este documento define el contrato que debe seguir cualquier IA (incluyendo Claude) al extraer información de un **Comprobante de Inversión Pagaré con rendimiento liquidable al vencimiento** emitido por BBVA México. El objetivo es producir un JSON **estructuralmente válido**, **semánticamente coherente** y en el **orden exacto de aparición** del documento fuente.

---

## 1. Entrada esperada

- **Formato del documento fuente:** PDF (texto nativo o escaneado con OCR aplicado).
- **Idioma:** Español (México).
- **Moneda:** Pesos mexicanos (MXN).
- **Emisor:** BBVA México, S.A., Institución de Banca Múltiple.
- **Tipo de producto:** Pagaré con rendimiento liquidable al vencimiento.

Si el documento no corresponde a este tipo de comprobante, la IA debe devolver:

```json
{ "error": "documento_no_compatible", "detalle": "<descripción breve>" }
```

---

## 2. Salida esperada

### 2.1 Reglas generales

1. Devolver **únicamente JSON válido**, sin envoltura en bloques de código markdown, sin comentarios, sin texto adicional antes o después.
2. Respetar **el orden exacto de aparición** de los campos en el documento (definido en la sección 4).
3. Si un campo no aparece en el documento, usar `null`. **No inferir, no calcular, no inventar valores.**
4. Los montos se devuelven como `number` (no string), sin símbolo de moneda, sin separadores de miles, con punto decimal.
5. Las fechas se devuelven en formato **ISO 8601**:
   - Fecha + hora → `YYYY-MM-DDTHH:MM:SS`
   - Solo fecha → `YYYY-MM-DD`
6. Los porcentajes se devuelven como `number` representando el valor numérico (ej. `6.50`, no `"6.50%"`).
7. Conservar literales como `"NO APLICA"` cuando el documento los muestre explícitamente.

### 2.2 Estructura canónica (orden de aparición)

```
encabezado
  ├── fecha_hora_consulta
  ├── contrato
  └── nombre_cliente
producto
  ├── tipo
  └── moneda
notas_legales
  ├── garantia_ipab
  └── nota_gat
estado_operacion
detalle_comprobante
  ├── fecha_hora_operacion
  ├── fecha_vencimiento
  ├── cuenta_cargo
  ├── cuenta_deposito
  ├── contrato_inversion
  ├── isr_impuesto_mxn
  ├── importe_inversion_mxn
  ├── interes_mxn
  ├── plazo_dias
  ├── importe_neto_vencimiento_mxn
  ├── tasa_fija_anual_antes_impuestos_pct
  ├── gat_nominal_antes_impuestos
  ├── tasa_fija_anual_despues_impuestos_pct
  └── gat_real_antes_impuestos
datos_confirmacion_transferencia
  ├── folio_inversion
  └── folio_internet
```

---

## 3. JSON Schema (Draft 2020-12)

Toda salida debe validar contra este esquema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ComprobanteInversionPagareBBVA",
  "type": "object",
  "required": [
    "encabezado",
    "producto",
    "notas_legales",
    "estado_operacion",
    "detalle_comprobante",
    "datos_confirmacion_transferencia"
  ],
  "properties": {
    "encabezado": {
      "type": "object",
      "required": ["fecha_hora_consulta", "contrato", "nombre_cliente"],
      "properties": {
        "fecha_hora_consulta": { "type": "string", "format": "date-time" },
        "contrato": { "type": "string", "pattern": "^[0-9]{8}$" },
        "nombre_cliente": { "type": "string", "minLength": 1 }
      }
    },
    "producto": {
      "type": "object",
      "required": ["tipo", "moneda"],
      "properties": {
        "tipo": { "type": "string", "minLength": 1 },
        "moneda": { "type": "string", "enum": ["MXN", "USD"] }
      }
    },
    "notas_legales": {
      "type": "object",
      "required": ["garantia_ipab", "nota_gat"],
      "properties": {
        "garantia_ipab": { "type": "string", "minLength": 1 },
        "nota_gat": { "type": "string", "minLength": 1 }
      }
    },
    "estado_operacion": {
      "type": "string",
      "enum": ["Operación Exitosa", "Operación Fallida", "Operación Pendiente"]
    },
    "detalle_comprobante": {
      "type": "object",
      "required": [
        "fecha_hora_operacion",
        "fecha_vencimiento",
        "cuenta_cargo",
        "cuenta_deposito",
        "contrato_inversion",
        "isr_impuesto_mxn",
        "importe_inversion_mxn",
        "interes_mxn",
        "plazo_dias",
        "importe_neto_vencimiento_mxn",
        "tasa_fija_anual_antes_impuestos_pct",
        "gat_nominal_antes_impuestos",
        "tasa_fija_anual_despues_impuestos_pct",
        "gat_real_antes_impuestos"
      ],
      "properties": {
        "fecha_hora_operacion": { "type": "string", "format": "date-time" },
        "fecha_vencimiento": { "type": "string", "format": "date" },
        "cuenta_cargo": { "type": "string", "pattern": "^[0-9]{10}$" },
        "cuenta_deposito": { "type": "string", "pattern": "^[0-9]{10}$" },
        "contrato_inversion": { "type": "string", "pattern": "^[0-9]+$" },
        "isr_impuesto_mxn": { "type": "number", "minimum": 0 },
        "importe_inversion_mxn": { "type": "number", "exclusiveMinimum": 0 },
        "interes_mxn": { "type": "number", "minimum": 0 },
        "plazo_dias": { "type": "integer", "minimum": 1 },
        "importe_neto_vencimiento_mxn": { "type": "number", "exclusiveMinimum": 0 },
        "tasa_fija_anual_antes_impuestos_pct": { "type": "number", "minimum": 0, "maximum": 100 },
        "gat_nominal_antes_impuestos": {
          "oneOf": [
            { "type": "number" },
            { "type": "string", "const": "NO APLICA" }
          ]
        },
        "tasa_fija_anual_despues_impuestos_pct": { "type": "number", "minimum": 0, "maximum": 100 },
        "gat_real_antes_impuestos": {
          "oneOf": [
            { "type": "number" },
            { "type": "string", "const": "NO APLICA" }
          ]
        }
      }
    },
    "datos_confirmacion_transferencia": {
      "type": "object",
      "required": ["folio_inversion", "folio_internet"],
      "properties": {
        "folio_inversion": { "type": "string", "pattern": "^[0-9]+$" },
        "folio_internet": { "type": "string", "pattern": "^[0-9]+$" }
      }
    },
  }
}
```

---

## 4. Mapeo campo a campo (etiqueta en PDF → clave JSON)

| Aparición | Etiqueta en el documento | Clave JSON | Tipo | Notas |
|---|---|---|---|---|
| 1 | `Fecha y hora de consulta` | `encabezado.fecha_hora_consulta` | date-time | Convertir `DD/MM/YYYY HH:MM:SS AM/PM` a ISO 8601 |
| 2 | `Contrato` | `encabezado.contrato` | string | 8 dígitos, conservar ceros a la izquierda |
| 3 | `Nombre del cliente` | `encabezado.nombre_cliente` | string | Trim de espacios y saltos de línea |
| 4 | Título de bloque (ej. `Pagaré con rendimiento liquidable al vencimiento (MXN)`) | `producto.tipo` + `producto.moneda` | string + enum | Separar tipo y moneda del paréntesis |
| 5 | Bloque legal IPAB | `notas_legales.garantia_ipab` | string | Texto completo, sin saltos artificiales |
| 6 | Nota sobre GAT Real | `notas_legales.nota_gat` | string | Texto completo |
| 7 | Encabezado de estado (ej. `Operación Exitosa`) | `estado_operacion` | enum | |
| 8 | `Fecha y hora de la operación` | `detalle_comprobante.fecha_hora_operacion` | date-time | |
| 9 | `Fecha de vencimiento` | `detalle_comprobante.fecha_vencimiento` | date | |
| 10 | `Cuenta cargo` | `detalle_comprobante.cuenta_cargo` | string | 10 dígitos |
| 11 | `Cuenta de depósito` | `detalle_comprobante.cuenta_deposito` | string | 10 dígitos |
| 12 | `Contrato de inversión` | `detalle_comprobante.contrato_inversion` | string | Solo dígitos |
| 13 | `ISR Impuesto` | `detalle_comprobante.isr_impuesto_mxn` | number | Quitar `$` y comas |
| 14 | `Importe de la inversión M.N.` | `detalle_comprobante.importe_inversion_mxn` | number | Quitar `$` y comas |
| 15 | `Interés` | `detalle_comprobante.interes_mxn` | number | Quitar `$` y comas |
| 16 | `Plazo (en días)` | `detalle_comprobante.plazo_dias` | integer | |
| 17 | `Importe neto al vencimiento (MXN)` | `detalle_comprobante.importe_neto_vencimiento_mxn` | number | |
| 18 | `Tasa fija anual antes de impuestos` | `detalle_comprobante.tasa_fija_anual_antes_impuestos_pct` | number | Quitar `%` |
| 19 | `GAT Nominal antes de impuestos` | `detalle_comprobante.gat_nominal_antes_impuestos` | number \| `"NO APLICA"` | |
| 20 | `Tasa fija anual después de impuestos` | `detalle_comprobante.tasa_fija_anual_despues_impuestos_pct` | number | |
| 21 | `GAT Real antes de impuestos` | `detalle_comprobante.gat_real_antes_impuestos` | number \| `"NO APLICA"` | |
| 22 | `Folio de inversión` | `datos_confirmacion_transferencia.folio_inversion` | string | |
| 23 | `Folio de internet` | `datos_confirmacion_transferencia.folio_internet` | string | Conservar ceros a la izquierda |

### 4.1 Normalización de valores

- **Montos:** eliminar `$`, espacios y separadores de miles (`,`). Conservar dos decimales como `number`.
  - `"$ 150,000,000.00"` → `150000000.00`
- **Porcentajes:** eliminar `%` y espacios. Conservar dos decimales como `number`.
  - `"6.50 %"` → `6.50`
- **Cuentas y contratos:** mantener como `string` para conservar ceros a la izquierda.
- **Fechas:**
  - `"21/05/2026 9:06:38 AM"` → `"2026-05-21T09:06:38"`
  - `"2026-05-21 09:06:35"` → `"2026-05-21T09:06:35"`
  - `"2026-05-22"` → `"2026-05-22"`

---

## 5. Reglas de validación de negocio

Después de la validación estructural (JSON Schema), aplicar estas validaciones semánticas. Toda inconsistencia debe reportarse, no corregirse silenciosamente.

### 5.1 Coherencia aritmética

| ID | Regla | Fórmula | Tolerancia |
|---|---|---|---|
| BR-01 | Interés coherente con tasa anual y plazo | `interes ≈ importe × (tasa_antes / 100) × (plazo_dias / 360)` | ±0.01 MXN |
| BR-02 | Importe neto al vencimiento | `neto = importe + interes − isr` | ±0.01 MXN |
| BR-03 | Plazo coherente con fechas | `dias_entre(fecha_vencimiento, fecha_operacion) == plazo_dias` | exacto |
| BR-04 | ISR no puede exceder el interés | `isr ≤ interes` | exacto |
| BR-05 | Tasa después de impuestos no excede tasa antes | `tasa_despues ≤ tasa_antes` | exacto |
| BR-06 | Fecha de vencimiento posterior o igual a fecha de operación | `fecha_vencimiento ≥ fecha_operacion` | exacto |
| BR-07 | Fecha de consulta cercana a fecha de operación (mismo día típicamente) | `|fecha_consulta − fecha_operacion| ≤ 24h` | informativo |

### 5.2 Validaciones de consistencia interna

| ID | Regla |
|---|---|
| BR-08 | Si producto.moneda = "MXN", los importes están en MXN |
| BR-09 | Si plazo_dias = 1 y producto es pagaré overnight, cuenta_cargo == cuenta_deposito típicamente |
| BR-10 | Todos los montos son ≥ 0 |
| BR-11 | importe_inversion_mxn > 0 |

### 5.3 Reporte de validación

Cuando se ejecute validación, la IA debe poder devolver (a petición) un objeto adicional:

```json
{
  "validacion": {
    "schema_valido": true,
    "orden_correcto": true,
    "reglas_negocio": [
      { "id": "BR-01", "ok": true, "esperado": 27083.33, "obtenido": 27083.33 },
      { "id": "BR-02", "ok": true, "esperado": 150023384.70, "obtenido": 150023384.70 },
      { "id": "BR-03", "ok": true }
    ],
    "advertencias": [],
    "errores": []
  }
}
```

---

## 6. Manejo de incertidumbre

- Si un valor se lee con baja confianza (ej. OCR ambiguo), incluir un objeto paralelo `_confianza` con el campo y el nivel (`alta` | `media` | `baja`).
- Si dos campos del documento se contradicen (ej. el importe neto no cuadra con la fórmula), **no corregir**. Reportar ambos valores y marcar la regla de negocio fallida.
- Nunca completar campos faltantes con valores "razonables". Faltante = `null` + entrada en `advertencias`.

---

## 7. Ejemplo de salida válida

```json
{
  "encabezado": {
    "fecha_hora_consulta": "2026-05-21T09:06:38",
    "contrato": "00477664",
    "nombre_cliente": "SINERGIA ESTRATEGICA DE COMBUSTIBLES S DE RL DE CV"
  },
  "producto": {
    "tipo": "Pagaré con rendimiento liquidable al vencimiento",
    "moneda": "MXN"
  },
  "notas_legales": {
    "garantia_ipab": "Únicamente están garantizados por el Instituto para la Protección al Ahorro Bancario (IPAB)...",
    "nota_gat": "La GAT Real es el rendimiento que obtendría después de descontar la inflación estimada..."
  },
  "estado_operacion": "Operación Exitosa",
  "detalle_comprobante": {
    "fecha_hora_operacion": "2026-05-21T09:06:35",
    "fecha_vencimiento": "2026-05-22",
    "cuenta_cargo": "0105010535",
    "cuenta_deposito": "0105010535",
    "contrato_inversion": "1370871796",
    "isr_impuesto_mxn": 3698.63,
    "importe_inversion_mxn": 150000000.00,
    "interes_mxn": 27083.33,
    "plazo_dias": 1,
    "importe_neto_vencimiento_mxn": 150023384.70,
    "tasa_fija_anual_antes_impuestos_pct": 6.50,
    "gat_nominal_antes_impuestos": "NO APLICA",
    "tasa_fija_anual_despues_impuestos_pct": 5.60,
    "gat_real_antes_impuestos": "NO APLICA"
  },
  "datos_confirmacion_transferencia": {
    "folio_inversion": "773",
    "folio_internet": "0072267016"
  },
  "pie_pagina": {
    "institucion": "BBVA México, S.A., Institución de Banca Múltiple, Grupo Financiero BBVA México",
    "sitio_web": "www.bbvanetcash.mx"
  }
}
```

---

## 8. Configuración recomendada para la IA

| Parámetro | Valor sugerido | Razón |
|---|---|---|
| `temperature` | `0` o `0.1` | Determinismo |
| `top_p` | `1` | No truncar distribución |
| `response_format` | `json_object` (si el proveedor lo soporta) | Forzar JSON |
| `max_tokens` | suficiente para todo el JSON | Evitar truncado |
| `system_prompt` | referencia a este `CLAUDE.md` | Contrato explícito |

---

## 9. Pipeline de procesamiento recomendado

```
1. PDF → texto (extracción nativa o OCR)
2. Texto → IA con este CLAUDE.md como contexto
3. IA → JSON crudo
4. Parseo JSON (¿es JSON válido?)
5. Validación JSON Schema (¿estructura correcta?)
6. Validación de orden de claves (¿coincide con sección 2.2?)
7. Validación de reglas de negocio (¿aritmética correcta?)
8. Si todo pasa → JSON aprobado
9. Si algo falla → reportar errores + flag para revisión humana
```

---

## 10. Versionado

- **Versión:** 1.0.0
- **Fecha:** 2026-05-27
- **Alcance:** Comprobantes de Inversión Pagaré BBVA México con rendimiento liquidable al vencimiento en MXN.
- **Cambios futuros:** documentar en un `CHANGELOG` separado. Incrementar versión mayor ante cambios incompatibles en el esquema.
