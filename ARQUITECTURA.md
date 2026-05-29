# ARQUITECTURA.md — Lector BBVA

## Visión general

La aplicación sigue una **arquitectura por capas** estricta. El backend (FastAPI) expone
una API REST que el frontend (React) consume a través de un proxy de Vite. No hay lógica
de negocio en routers ni en componentes de UI: cada capa tiene una única responsabilidad
y no invade a las demás.

El flujo es siempre el mismo: se carga un PDF de Pagaré BBVA, se extrae su texto, se
parsea con expresiones regulares, se valida contra un JSON Schema y un conjunto de reglas
de negocio, y el resultado se almacena en SQL Server junto con el PDF original.

---

## Árbol completo del proyecto

```
GestorDatosPagareInversion/
├── CLAUDE.md                         ← Especificación funcional, stack y registro de cambios
├── ARQUITECTURA.md                   ← Este documento: guía técnica de la estructura
├── PREFERENCIAS.md                   ← Estilo de trabajo y convenciones del autor
├── FormatoExtraccionValidacion.md    ← Contrato de extracción y validación (fuente de verdad)
├── .gitignore                        ← Exclusiones de git a nivel raíz
│
├── backend/                          ← API FastAPI (Python 3.13)
│   ├── .env                          ← Variables de entorno reales (NO se sube a git)
│   ├── .env.example                  ← Plantilla de variables de entorno
│   ├── requirements.txt              ← Dependencias de Python
│   ├── .venv/                        ← Entorno virtual de Python (NO se sube a git)
│   ├── storage/                      ← PDFs guardados como <sha256>.pdf (se crea al arrancar)
│   └── app/
│       ├── __init__.py               ← Marca el paquete `app`
│       ├── main.py                   ← Arranque FastAPI: CORS, routers, tablas y carpeta storage
│       ├── routers/
│       │   ├── __init__.py
│       │   └── comprobantes.py       ← Endpoints HTTP del recurso comprobantes
│       ├── services/
│       │   ├── __init__.py
│       │   ├── extractor.py          ← PDF → texto → dict estructurado (pdfplumber + regex)
│       │   └── validador.py          ← Validación JSON Schema + reglas de negocio BR-xx
│       ├── models/
│       │   ├── __init__.py
│       │   └── comprobante.py        ← Modelo ORM SQLAlchemy de la tabla pagare_inversiones
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── comprobante.py        ← Contratos Pydantic de entrada/salida de la API
│       └── utils/
│           ├── __init__.py
│           └── db.py                 ← Conexión a SQL Server y dependencia get_db()
│
├── frontend/                         ← SPA React 19 + Vite + TypeScript + Tailwind v4
│   ├── index.html                    ← HTML raíz; monta la app en #root
│   ├── package.json                  ← Dependencias y scripts (dev, build, lint, preview)
│   ├── package-lock.json             ← Lockfile de versiones exactas
│   ├── vite.config.ts                ← Config Vite: host de red, puerto 5173, proxy /api → :8000
│   ├── eslint.config.js              ← Reglas de linting
│   ├── tsconfig.json                 ← Config TypeScript raíz (referencias a las otras dos)
│   ├── tsconfig.app.json             ← Config TS del código de la app (src/)
│   ├── tsconfig.node.json            ← Config TS de los archivos de entorno Node (vite.config)
│   ├── README.md                     ← Readme por defecto de la plantilla Vite
│   ├── .gitignore                    ← Exclusiones de git del frontend
│   ├── public/                       ← Assets servidos tal cual desde la raíz
│   │   ├── favicon.svg               ← Ícono de la pestaña del navegador
│   │   └── icons.svg                 ← Sprite de íconos SVG
│   └── src/
│       ├── main.tsx                  ← Punto de entrada React; renderiza <App> en #root
│       ├── App.tsx                   ← Layout (header/footer) y rutas (/ y /historial)
│       ├── App.css                   ← Estilos puntuales del componente App
│       ├── index.css                 ← Estilos globales e importación de Tailwind
│       ├── assets/                   ← Imágenes importadas por el bundler
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── pages/
│       │   ├── Inicio.tsx            ← Página de carga de PDF y resultado de validación
│       │   └── Historial.tsx         ← Página con la tabla de comprobantes válidos
│       ├── components/
│       │   ├── ZonaCarga.tsx         ← Zona drag-and-drop / selección de archivo
│       │   ├── TarjetaComprobante.tsx ← Tarjeta compacta con los datos extraídos
│       │   └── ResultadoValidacion.tsx ← Semáforo visual de schema, orden y reglas BR
│       ├── services/
│       │   └── comprobantes.ts       ← Único punto de contacto con la API (axios)
│       └── types/
│           └── comprobante.ts        ← Interfaces TS que reflejan los schemas del backend
│
└── database/                         ← Scripts SQL versionados (ejecutar en orden numérico)
    ├── 001_crear_base_y_tabla.sql    ← Crea la base y la tabla pagare_inversiones
    ├── 002_eliminar_pie_pagina.sql   ← Elimina columnas institucion y sitio_web
    └── 003_agregar_hash_y_texto_plano.sql ← Agrega columnas hash_archivo y texto_plano
```

---

## Backend — Inventario por carpeta

### Raíz de `backend/`

| Archivo | Rol y propósito |
|---|---|
| `.env` | Variables de entorno reales (principalmente `DATABASE_URL`). Nunca se sube a git. |
| `.env.example` | Plantilla a copiar como `.env`. Documenta el formato de la cadena de conexión. |
| `requirements.txt` | Dependencias fijadas: FastAPI, Uvicorn, pdfplumber, jsonschema, SQLAlchemy, pyodbc, python-dotenv, python-multipart. |
| `storage/` | Carpeta donde se guardan los PDFs originales con nombre `<sha256>.pdf`. Se crea automáticamente al arrancar `main.py`. No se versiona. |

### `app/` (raíz del paquete)

| Archivo | Rol y propósito |
|---|---|
| `__init__.py` | Marca `app` como paquete Python. |
| `main.py` | Punto de arranque de FastAPI. Configura logging, crea las tablas con `Base.metadata.create_all()`, crea la carpeta `storage/`, monta el middleware CORS (solo `http://localhost:5173`) y registra el router de comprobantes. Expone `GET /` como healthcheck. |

### `app/routers/` — Capa de entrada HTTP

| Archivo | Rol y propósito |
|---|---|
| `comprobantes.py` | Define los endpoints del recurso. Valida la entrada (tipo y tamaño de archivo), genera el hash SHA-256, guarda el PDF en `storage/`, delega la extracción y validación a los services, construye el modelo ORM con el helper privado `_construir_modelo()` y lo persiste. **No contiene lógica de negocio.** |

**Endpoints expuestos:**

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/comprobantes/` | Carga y procesa un PDF. Devuelve datos extraídos + resultado de validación. |
| `GET`  | `/api/comprobantes/` | Lista comprobantes (resumen). Parámetro `limite` (default 50). |
| `GET`  | `/api/comprobantes/{id}` | Detalle completo de un comprobante, incluyendo JSON crudo y texto plano. |
| `POST` | `/api/comprobantes/debug` | Diagnóstico: devuelve el texto crudo y normalizado extraído del PDF. |

### `app/services/` — Capa de lógica de negocio

| Archivo | Rol y propósito |
|---|---|
| `extractor.py` | Convierte los bytes del PDF en un `dict` estructurado. Extrae texto con `pdfplumber`, lo normaliza (Unicode NFC, caracteres especiales, whitespace) y aplica regex por cada campo BBVA. Funciones públicas: `procesar_pdf()`, `extraer_texto_plano()` y `extraer_texto_para_debug()`. |
| `validador.py` | Valida el `dict` contra el JSON Schema (`Draft202012Validator`, recoge todos los errores y los traduce a mensajes legibles en español) y contra las reglas de negocio BR-01…BR-11. Devuelve schema válido, orden de claves, reglas, advertencias y errores. |

**`extractor.py` — funciones principales:**

- `procesar_pdf(pdf_bytes)` — punto de entrada: extrae el texto y parsea todos los campos.
- `extraer_texto_plano(pdf_bytes)` — devuelve el texto crudo extraído (se guarda en la columna `texto_plano`).
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

### `app/models/` — Capa de datos (ORM)

| Archivo | Rol y propósito |
|---|---|
| `comprobante.py` | Modelo SQLAlchemy `Comprobante` de la tabla `pagare_inversiones`. Describe todas las columnas (metadatos, encabezado, producto, notas, detalle, confirmación, `hash_archivo`, `texto_plano`, validación y JSON crudo). Solo estructura, sin lógica. |

### `app/schemas/` — Contratos de la API

| Archivo | Rol y propósito |
|---|---|
| `comprobante.py` | Modelos Pydantic de entrada/salida: sub-esquemas del JSON extraído, `RespuestaCarga` (endpoint de carga), `ComprobanteResumen` (listado) y `ComprobanteDetalle` (detalle completo, incluye `texto_plano` y `hash_archivo`). |

### `app/utils/` — Capa auxiliar

| Archivo | Rol y propósito |
|---|---|
| `db.py` | Crea el `engine` de SQLAlchemy desde `DATABASE_URL`, el `SessionLocal` y la dependencia `get_db()` que provee una sesión por request y la cierra al terminar. |

---

## Frontend — Inventario por carpeta

### Raíz de `frontend/`

| Archivo | Rol y propósito |
|---|---|
| `index.html` | HTML raíz; contiene el `<div id="root">` donde se monta React. |
| `package.json` | Dependencias (React 19, react-router-dom 7, axios) y scripts: `dev`, `build`, `lint`, `preview`. |
| `package-lock.json` | Lockfile con las versiones exactas de cada dependencia. |
| `vite.config.ts` | Config de Vite: plugins React y Tailwind, `host: true` (acceso en red), puerto 5173 y proxy `/api → http://localhost:8000`. |
| `eslint.config.js` | Reglas de linting del proyecto. |
| `tsconfig.json` | Config TypeScript raíz; referencia a `tsconfig.app.json` y `tsconfig.node.json`. |
| `tsconfig.app.json` | Config TS del código de la aplicación (`src/`). |
| `tsconfig.node.json` | Config TS de los archivos de entorno Node (`vite.config.ts`). |
| `README.md` | Readme por defecto de la plantilla Vite. |

### `src/` (raíz de la app)

| Archivo | Rol y propósito |
|---|---|
| `main.tsx` | Punto de entrada: renderiza `<App>` dentro de `#root` en modo estricto. |
| `App.tsx` | Layout general (header con navegación, footer) y definición de rutas: `/` (Inicio) y `/historial` (Historial). |
| `index.css` | Estilos globales e importación de Tailwind. |
| `App.css` | Estilos puntuales del componente App. |
| `assets/` | Imágenes importadas por el bundler (`hero.png`, `react.svg`, `vite.svg`). |

### `src/pages/` — Capa de páginas

| Archivo | Rol y propósito |
|---|---|
| `Inicio.tsx` | Pantalla principal. Gestiona la carga (incl. drag-and-drop global), llama al service y muestra el resultado: tarjeta de datos si es válido, o panel de error detallado si es inválido. |
| `Historial.tsx` | Lista en tabla solo los comprobantes que pasaron validación (`schema_valido === true`). Columnas: folio internet, fecha operación, vencimiento, importe, interés y neto al vencimiento. |

### `src/components/` — Capa de componentes

| Archivo | Rol y propósito |
|---|---|
| `ZonaCarga.tsx` | Zona drag-and-drop / selección de archivo. Recibe `onArchivo` y `cargando` como props. |
| `TarjetaComprobante.tsx` | Tarjeta compacta con los datos extraídos agrupados (operación, tasas, confirmación). Solo recibe `datos` + `id`. |
| `ResultadoValidacion.tsx` | Semáforo visual de validación: schema, orden de campos y reglas BR-xx, con errores y advertencias. |

Los componentes **no llaman a la API directamente**.

### `src/services/` y `src/types/`

| Archivo | Rol y propósito |
|---|---|
| `services/comprobantes.ts` | Único punto de contacto con el backend (axios, `baseURL: '/api'`). Funciones: `cargarComprobante()` y `listarComprobantes()`. |
| `types/comprobante.ts` | Interfaces TypeScript que reflejan exactamente los schemas del backend. |

---

## Base de datos — `database/`

| Script | Rol y propósito |
|---|---|
| `001_crear_base_y_tabla.sql` | Crea la base `Aplicativo_LectorInversion` y la tabla `pagare_inversiones`. |
| `002_eliminar_pie_pagina.sql` | Elimina las columnas `institucion` y `sitio_web` (ya no se requieren). |
| `003_agregar_hash_y_texto_plano.sql` | Agrega las columnas `hash_archivo` (SHA-256 del PDF) y `texto_plano` (texto crudo extraído). |

> Los scripts son la **fuente de verdad** para producción y se ejecutan en orden numérico.
> `main.py` también puede crear la tabla con `Base.metadata.create_all()` para el primer arranque.

---

## Las capas y sus responsabilidades

### Backend — Las 4 capas

```
Router → Service → Model → Base de datos
```

| Capa | Responsabilidad | Lo que NO hace |
|---|---|---|
| **Router** | Recibe la petición HTTP, valida la entrada (schemas) y delega al service | No tiene lógica de negocio, no consulta la BD directamente |
| **Service** | Toda la lógica de negocio: extracción, validaciones, reglas | No define rutas HTTP ni formatea respuestas |
| **Model** | Define la estructura de la tabla (ORM) | No toma decisiones, solo describe datos |
| **Schema** | Contratos de entrada y salida (qué se acepta, qué se devuelve) | No accede a la BD ni ejecuta lógica |

Capa auxiliar: **Utils** (`db.py`) provee la conexión y la dependencia de sesión.

### Frontend — Las 3 capas

```
Page/Component → Service → API Backend
```

| Capa | Responsabilidad |
|---|---|
| **Page** | Pantalla completa asociada a una ruta. Presenta datos y llama a los services. |
| **Component** | Pieza reutilizable. Recibe props, no llama a la API. |
| **Service** | Funciones que hablan con el backend (un archivo por recurso). |

---

## Flujo completo de una carga

```
1.  Usuario arrastra/selecciona PDF → ZonaCarga.tsx
2.  Inicio.tsx llama a cargarComprobante(archivo)
3.  Service hace POST /api/comprobantes/ (vía proxy Vite)
4.  Router valida el archivo y calcula su hash SHA-256
5.  El PDF se guarda en storage/<hash>.pdf (si no existía)
6.  extractor.py extrae el texto plano y lo parsea con regex
7.  validador.py valida schema + orden + reglas BR-01..BR-11
8.  Router construye el modelo ORM (incl. hash y texto plano) y lo guarda en SQL Server
9.  Respuesta JSON → frontend
10. Si es válido → TarjetaComprobante + ResultadoValidacion
    Si es inválido → panel de error detallado (el registro igual queda en la BD)
```

---

## Decisiones de diseño

| Decisión | Razón |
|---|---|
| Regex para extracción | El formato BBVA es consistente; sin dependencia externa ni costo de API. |
| Tabla dedicada `pagare_inversiones` | Aislamiento dentro de la base de datos del aplicativo. |
| JSON completo en columna `json_extraido` | Permite revalidar o reprocesar sin releer el PDF. |
| Proxy Vite → FastAPI | El frontend habla con `/api` sin problemas de CORS, incluso desde la red local. |
| `FormatoExtraccionValidacion.md` documentado | Referencia de los campos esperados y su validación — fuente de verdad. |
| `host: true` en Vite | Permite acceso desde cualquier equipo en la red local sin cambiar CORS del backend. |
| `Base.metadata.create_all()` en arranque | Facilita el primer despliegue sin ejecutar scripts SQL manualmente. |
| Hash SHA-256 del PDF | Huella única del contenido; permite detectar duplicados y referenciar el archivo. |
| Guardar el PDF en `storage/<hash>.pdf` | Trazabilidad: el registro de la BD apunta a un archivo físico recuperable. |
| Columna `texto_plano` | Conservar el texto crudo permite reprocesar o auditar sin releer el PDF. |
| Historial filtra solo válidos | La tabla operativa muestra únicamente comprobantes confiables; los inválidos quedan registrados pero no se listan. |
| Mensajes de error de validación en español | Traducir los errores de jsonschema facilita identificar qué campo falló y por qué. |
