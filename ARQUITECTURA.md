# ARQUITECTURA.md — Lector BBVA

## Visión general

La aplicación sigue una **arquitectura por capas** estricta. El backend expone una API REST que el frontend consume. No hay lógica de negocio en routers ni en componentes de UI.

---

## Backend — Las 4 capas

```
Router → Service → Model → Base de datos
```

### Router (`app/routers/comprobantes.py`)
- Recibe la petición HTTP y valida la entrada (tipo de archivo, tamaño).
- Delega completamente al service.
- Devuelve la respuesta usando los schemas de Pydantic.
- **No contiene lógica de negocio.**
- Contiene el helper privado `_construir_modelo()` que mapea el `dict` extraído al modelo ORM antes de guardarlo.

**Endpoints expuestos:**

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/comprobantes/` | Carga y procesa un PDF. Devuelve datos + validación. |
| `GET` | `/api/comprobantes/` | Lista comprobantes (resumen). Parámetro: `limite` (default 50). |
| `GET` | `/api/comprobantes/{id}` | Detalle completo de un comprobante, incluyendo JSON crudo. |
| `POST` | `/api/comprobantes/debug` | Diagnóstico: devuelve el texto crudo y normalizado extraído del PDF. |

### Services (`app/services/`)

| Archivo | Responsabilidad |
|---|---|
| `extractor.py` | Extrae texto del PDF con `pdfplumber`, normaliza Unicode y lo procesa con regex para capturar cada campo. Devuelve un `dict`. |
| `validador.py` | Valida el `dict` contra el JSON Schema y las reglas de negocio. |

**`extractor.py` — funciones principales:**
- `procesar_pdf(pdf_bytes)` — punto de entrada: extrae y parsea todos los campos.
- `extraer_texto_para_debug(pdf_bytes)` — usado por el endpoint `/debug`; devuelve texto crudo y normalizado sin parsear.
- `_normalizar(texto)` — normaliza Unicode NFC, reemplaza caracteres especiales (non-breaking space, em dash, etc.) y colapsa whitespace antes de aplicar regex.

**`validador.py` — reglas implementadas:**

| Reglas | Estado |
|---|---|
| BR-01 a BR-07 | Implementadas |
| BR-08 (moneda MXN → importes en MXN) | **Pendiente** |
| BR-09 (plazo 1 día → cargo == depósito) | **Pendiente** |
| BR-10, BR-11 | Implementadas |

La extracción usa expresiones regulares que coinciden con las etiquetas y formatos del PDF BBVA. Sin dependencia externa.

### Model (`app/models/comprobante.py`)
- Define la tabla `pagare_inversiones` con SQLAlchemy ORM.
- No tiene métodos de negocio, solo describe la estructura de datos.

### Schema (`app/schemas/comprobante.py`)
- Contratos Pydantic de entrada y salida.
- `RespuestaCarga` — lo que devuelve el endpoint de carga.
- `ComprobanteResumen` — lo que devuelve el listado.
- `ComprobanteDetalle` — lo que devuelve el endpoint de detalle.

### Utils (`app/utils/db.py`)
- Configuración de conexión a SQL Server vía `DATABASE_URL` del `.env`.
- Provee `get_db()` como dependencia de FastAPI (sesión por request).

### Main (`app/main.py`)
- Registra el router de comprobantes bajo el prefijo `/api/comprobantes`.
- Configura CORS: solo permite origen `http://localhost:5173`. Peticiones desde la red pasan por el proxy Vite y no necesitan cambiar esta configuración.
- Ejecuta `Base.metadata.create_all()` al iniciar: crea la tabla si no existe (complementa los scripts SQL en `database/`).

---

## Frontend — Las 3 capas

```
Page → Component → Service → API Backend
```

### Pages (`src/pages/`)

| Archivo | Descripción |
|---|---|
| `Inicio.tsx` | Pantalla principal. Gestiona el estado de carga y muestra resultados. |
| `Historial.tsx` | Lista todos los comprobantes procesados en una tabla. |

### Components (`src/components/`)

| Archivo | Descripción |
|---|---|
| `ZonaCarga.tsx` | Zona drag-and-drop para subir el PDF. Recibe `onArchivo` como prop. |
| `TarjetaComprobante.tsx` | Muestra los datos extraídos del comprobante. Solo recibe `datos` + `id`. |
| `ResultadoValidacion.tsx` | Semáforo visual de validación: schema, orden y reglas BR-xx. |

Los componentes **no llaman a la API directamente**.

### Services (`src/services/comprobantes.ts`)
- Único punto de contacto con el backend. Usa `axios` con `baseURL: '/api'` (resuelto por el proxy Vite).
- `cargarComprobante(archivo)` — POST /api/comprobantes/
- `listarComprobantes(limite)` — GET /api/comprobantes/
- El endpoint de detalle (`GET /api/comprobantes/{id}`) existe en el backend pero no está expuesto en este archivo todavía.

### Types (`src/types/comprobante.ts`)
- Interfaces TypeScript que reflejan exactamente los schemas del backend.

---

## Flujo completo de una carga

```
1. Usuario arrastra PDF → ZonaCarga.tsx
2. Inicio.tsx llama a cargarComprobante(archivo)
3. Service hace POST /api/comprobantes/
4. Router valida el archivo y llama a procesar_pdf()
5. extractor.py → pdfplumber extrae texto del PDF
6. extractor.py → regex captura cada campo según etiquetas BBVA
7. validador.py → valida schema + reglas BR-01..BR-11
8. Router construye el modelo ORM y lo guarda en SQL Server
9. Respuesta JSON → frontend
10. TarjetaComprobante + ResultadoValidacion muestran el resultado
```

---

## Decisiones de diseño

| Decisión | Razón |
|---|---|
| Regex para extracción | El formato BBVA es consistente; sin dependencia externa ni costo de API |
| Tabla dedicada `pagare_inversiones` | Aislamiento dentro de la base de datos del aplicativo |
| JSON completo en columna `json_extraido` | Permite revalidar o reprocesar sin releer el PDF |
| Proxy Vite → FastAPI | El frontend habla con `/api` sin problemas de CORS, incluso desde la red local |
| `FormatoExtraccionValidacion.md` documentado | Referencia de los campos esperados y su validación — fuente de verdad |
| `host: true` en Vite | Permite acceso desde cualquier equipo en la red local sin cambiar CORS del backend |
| `Base.metadata.create_all()` en arranque | Facilita el primer despliegue sin ejecutar scripts SQL manualmente |
