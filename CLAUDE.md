# CLAUDE.md — Lector BBVA

## Propósito

**Lector BBVA** es un portal web de uso interno para **cargar, extraer, validar y archivar
comprobantes de inversión Pagaré BBVA** (pagaré con rendimiento liquidable al vencimiento,
en MXN). Resuelve un problema concreto: capturar a mano los datos de estos comprobantes es
lento y propenso a errores. La aplicación lo automatiza de punta a punta:

1. El usuario sube el PDF del comprobante (arrastrando o seleccionando).
2. El sistema extrae el texto, identifica cada campo y lo estructura.
3. Valida que el documento sea correcto (estructura + coherencia aritmética).
4. Guarda el registro en SQL Server y archiva el PDF original.
5. Muestra el resultado y mantiene un historial consultable de comprobantes válidos.

Todo corre en local / red interna, sin enviar documentos a servicios externos.

---

## Funcionalidades principales

- **Carga de PDF** con zona drag-and-drop y validación de tipo de archivo.
- **Extracción automática** de los 23 campos del comprobante mediante regex (sin API externa).
- **Validación en dos niveles:** estructura (JSON Schema) y reglas de negocio aritméticas (BR-01…BR-11).
- **Mensajes de error claros en español** que indican qué campo falló y por qué.
- **Archivado del PDF original** en disco, nombrado con su hash SHA-256 (huella única).
- **Persistencia completa en SQL Server**, incluyendo el JSON extraído y el texto plano del PDF.
- **Historial** que lista únicamente los comprobantes que pasaron la validación.
- **Registro de todos los intentos:** incluso un documento inválido queda guardado en la BD para trazabilidad.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.13 + FastAPI |
| Extracción PDF | pdfplumber + regex (sin API externa) |
| Validación | jsonschema (Draft 2020-12) + reglas de negocio propias |
| Base de datos | SQL Server (ODBC Driver 17) vía SQLAlchemy 2.0 |
| Frontend | React 19 + Vite + TypeScript + TailwindCSS v4 |
| Cliente HTTP | axios (a través del proxy `/api` de Vite) |
| Ruteo frontend | react-router-dom 7 |

---

## Estructura del proyecto

> Para el detalle archivo por archivo, ver **`ARQUITECTURA.md`**. Aquí va el mapa de alto nivel.

```
GestorDatosPagareInversion/
├── backend/                          ← API FastAPI (Python 3.13)
│   ├── app/
│   │   ├── routers/comprobantes.py   ← endpoints HTTP
│   │   ├── services/
│   │   │   ├── extractor.py          ← PDF → texto → JSON (pdfplumber + regex)
│   │   │   └── validador.py          ← JSON Schema + reglas BR-01…BR-11
│   │   ├── models/comprobante.py     ← ORM SQLAlchemy
│   │   ├── schemas/comprobante.py    ← contratos Pydantic
│   │   ├── utils/db.py               ← conexión SQL Server
│   │   └── main.py                   ← arranque FastAPI + CORS + storage
│   ├── storage/                      ← PDFs archivados como <sha256>.pdf (se crea solo)
│   ├── .venv/
│   ├── .env
│   └── requirements.txt
├── frontend/                         ← SPA React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Inicio.tsx            ← carga de PDF + resultado
│   │   │   └── Historial.tsx         ← tabla de comprobantes válidos
│   │   ├── components/
│   │   │   ├── ZonaCarga.tsx
│   │   │   ├── TarjetaComprobante.tsx
│   │   │   └── ResultadoValidacion.tsx
│   │   ├── services/comprobantes.ts  ← llamadas a la API
│   │   └── types/comprobante.ts      ← interfaces TypeScript
│   └── vite.config.ts
├── database/                         ← scripts SQL versionados (ejecutar en orden)
│   ├── 001_crear_base_y_tabla.sql
│   ├── 002_eliminar_pie_pagina.sql
│   └── 003_agregar_hash_y_texto_plano.sql
├── FormatoExtraccionValidacion.md    ← contrato de extracción (fuente de verdad de campos y reglas)
├── ARQUITECTURA.md                   ← guía técnica detallada de la estructura
├── PREFERENCIAS.md                   ← estilo de trabajo y convenciones
└── CLAUDE.md                         ← este archivo
```

---

## Flujo funcional (resumen)

```
Subir PDF → extraer texto → parsear con regex → validar (schema + reglas)
          → archivar PDF (storage/<hash>.pdf) → guardar en SQL Server → mostrar resultado
```

- **Si el documento es válido:** se muestra la tarjeta con los datos extraídos y el semáforo de validación.
- **Si es inválido:** se muestra un panel de error detallado (qué campos fallaron). El registro **igual se guarda** en la BD.

El flujo paso a paso está documentado en `ARQUITECTURA.md`.

---

## Modelo de datos extraídos

Cada comprobante se estructura en 6 bloques, en el orden exacto de aparición en el PDF:

| Bloque | Campos |
|---|---|
| `encabezado` | fecha_hora_consulta, contrato, nombre_cliente |
| `producto` | tipo, moneda |
| `notas_legales` | garantia_ipab, nota_gat |
| `estado_operacion` | (Operación Exitosa / Fallida / Pendiente) |
| `detalle_comprobante` | fecha operación y vencimiento, cuentas, contrato inversión, ISR, importes, interés, plazo, tasas y GAT |
| `datos_confirmacion_transferencia` | folio_inversion, folio_internet |

El contrato completo (tipos, formatos, normalización y JSON Schema) está en **`FormatoExtraccionValidacion.md`**.

---

## Reglas de validación de negocio

| Regla | Descripción | Estado |
|---|---|---|
| BR-01 | Interés coherente con tasa anual y plazo | Implementada |
| BR-02 | Importe neto = importe + interés − ISR | Implementada |
| BR-03 | Días entre fechas == plazo en días | Implementada |
| BR-04 | ISR ≤ interés | Implementada |
| BR-05 | Tasa después de impuestos ≤ tasa antes | Implementada |
| BR-06 | Fecha de vencimiento ≥ fecha de operación | Implementada |
| BR-07 | Fecha de consulta cercana a la operación (±24 h) | Implementada (informativa) |
| BR-08 | Si moneda = MXN, los importes están en MXN | **Pendiente** |
| BR-09 | Si plazo = 1 día, cuenta_cargo == cuenta_deposito | **Pendiente** |
| BR-10 | Todos los montos ≥ 0 | Implementada |
| BR-11 | importe_inversion_mxn > 0 | Implementada |

---

## Comandos de arranque

### Backend

```powershell
cd C:\Users\AdminTI\PaulMorales\Aplicativos\Programas\GestorDatosPagareInversion\backend
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> Para aceptar llamadas desde otras máquinas de la red: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

### Frontend

```powershell
cd C:\Users\AdminTI\PaulMorales\Aplicativos\Programas\GestorDatosPagareInversion\frontend
npm run dev
```

Acceder en: **http://localhost:5173** (o `http://<tu-IP-local>:5173` para acceso desde la red)
Documentación API: **http://localhost:8000/docs**

> **Acceso en red:** `vite.config.ts` tiene `host: true`, por lo que el frontend queda expuesto en todas las interfaces de red. El CORS del backend solo permite `http://localhost:5173`; como el frontend usa proxy Vite (`/api → localhost:8000`), las peticiones de red pasan por el servidor Vite y no requieren cambiar el CORS.

---

## Variables de entorno (backend/.env)

| Variable | Descripción | Obligatoria |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión SQLAlchemy para SQL Server | Sí |
| `STORAGE_PATH` | Carpeta donde se archivan los PDFs (default: `storage`) | No |

---

## Base de datos

- **Servidor:** `<IP_SERVIDOR_SQL>`
- **Base de datos:** `<NOMBRE_BASE_DE_DATOS>`
- **Tabla principal:** `pagare_inversiones`
- Los scripts de creación están en `database/`. Ejecutarlos en orden numérico al montar el aplicativo por primera vez.
- **Nota:** `main.py` ejecuta `Base.metadata.create_all()` al arrancar, por lo que SQLAlchemy también puede crear la tabla si no existe. Los scripts SQL son la fuente de verdad para el servidor de producción.

| Script | Descripción |
|---|---|
| `001_crear_base_y_tabla.sql` | Crea la base de datos y la tabla `pagare_inversiones` |
| `002_eliminar_pie_pagina.sql` | Elimina columnas `institucion` y `sitio_web` (ya no se requieren) |
| `003_agregar_hash_y_texto_plano.sql` | Agrega columnas `hash_archivo` (SHA-256 del PDF) y `texto_plano` (texto crudo extraído) |

---

## Documentos de referencia

| Documento | Para qué sirve |
|---|---|
| `CLAUDE.md` | **Este archivo.** Especificación funcional, stack, arranque y registro de cambios. Punto de entrada de cada sesión. |
| `ARQUITECTURA.md` | Guía técnica: qué hace cada archivo, las capas y sus responsabilidades, decisiones de diseño. |
| `FormatoExtraccionValidacion.md` | Contrato de extracción: campos esperados, tipos, normalización, JSON Schema y reglas BR. Fuente de verdad. |
| `PREFERENCIAS.md` | Estilo de trabajo y convenciones del autor (idioma, flujo, commits, arquitectura esperada). |

---

## Convenciones clave

- **Todo en español:** UI, mensajes de error, comentarios, documentación.
- **Arquitectura por capas estricta:** la lógica de negocio vive en los services, nunca en routers ni componentes.
- **Commits y push solo cuando se solicite explícitamente**, con mensajes descriptivos en español y sin mencionar IA.
- **Nunca subir** `.env`, credenciales, `.venv/`, `node_modules/` ni la carpeta `storage/`.
- Detalle completo en `PREFERENCIAS.md`.

---

## Registro de cambios

### 2026-05-29
- `feat`: archivado del PDF original en `storage/<sha256>.pdf` + columnas `hash_archivo` y `texto_plano` (script `003`)
- `feat`: el historial ahora lista solo comprobantes válidos; columnas reducidas (folio internet, fechas, importes); eliminadas las tarjetas de resumen
- `feat`: documento inválido muestra panel de error detallado en lugar de una tarjeta vacía
- `feat`: mensajes de error de validación traducidos a español, identificando el campo y reportando todos los errores (no solo el primero)
- `refactor`: rediseño compacto de la tarjeta de datos extraídos (`TarjetaComprobante.tsx`)
- `docs`: `ARQUITECTURA.md` reescrito con árbol completo e inventario archivo por archivo
- `docs`: `CLAUDE.md` ampliado (funcionalidades, flujo, modelo de datos, reglas BR, documentos de referencia); corregida la descripción del extractor (regex, no Claude)

### 2026-05-28
- `chore`: proyecto publicado en GitHub (repo público `FPAULMV/GestorDatosPagareInversion`)
- `chore`: datos de infraestructura interna reemplazados por placeholders en `CLAUDE.md`
- `feat`: `vite.config.ts` configurado con `host: true` para exposición en red local
- `docs`: documentación actualizada — endpoints de debug y detalle, BR-08/BR-09 pendientes, acceso en red

### 2026-05-27
- `feat`: creación inicial del proyecto — backend FastAPI (4 capas), frontend React + Vite + Tailwind
- `feat`: extracción de comprobantes Pagaré BBVA con regex (sin API externa)
- `feat`: validación JSON Schema + reglas de negocio BR-01 a BR-07, BR-10, BR-11
- `feat`: almacenamiento en SQL Server (tabla `pagare_inversiones`)
- `feat`: portal con página de carga (drag-and-drop) e historial de comprobantes
