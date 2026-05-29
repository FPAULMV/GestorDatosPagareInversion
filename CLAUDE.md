# CLAUDE.md — Lector BBVA

## Propósito

Portal web local para cargar, extraer y validar comprobantes de inversión **Pagaré BBVA** (rendimiento liquidable al vencimiento). Los datos se almacenan en SQL Server.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.13 + FastAPI |
| Extracción PDF | pdfplumber + regex (sin API externa) |
| Validación | jsonschema + reglas de negocio propias |
| Base de datos | SQL Server (ODBC Driver 17) vía SQLAlchemy |
| Frontend | React 19 + Vite + TypeScript + TailwindCSS v4 |

---

## Estructura del proyecto

```
LectorBBVA/
├── backend/
│   ├── app/
│   │   ├── routers/comprobantes.py   ← endpoints HTTP
│   │   ├── services/
│   │   │   ├── extractor.py          ← PDF → Claude → JSON
│   │   │   └── validador.py          ← JSON Schema + BR-01…BR-11
│   │   ├── models/comprobante.py     ← ORM SQLAlchemy
│   │   ├── schemas/comprobante.py    ← contratos Pydantic
│   │   ├── utils/db.py               ← conexión SQL Server
│   │   └── main.py                   ← arranque FastAPI + CORS
│   ├── .venv/
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Inicio.tsx            ← carga de PDF
│   │   │   └── Historial.tsx         ← tabla de registros
│   │   ├── components/
│   │   │   ├── ZonaCarga.tsx
│   │   │   ├── TarjetaComprobante.tsx
│   │   │   └── ResultadoValidacion.tsx
│   │   ├── services/comprobantes.ts  ← llamadas a la API
│   │   └── types/comprobante.ts      ← interfaces TypeScript
│   └── vite.config.ts
├── FormatoExtraccionValidacion.md    ← contrato de extracción (fuente de verdad)
├── CLAUDE.md                         ← este archivo
└── ARQUITECTURA.md
```

---

## Comandos de arranque

### Backend

```powershell
cd C:\Users\AdminTI\Desktop\GestorDatosPagareInversion\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd C:\Users\AdminTI\Desktop\GestorDatosPagareInversion\frontend
npm run dev
```

Acceder en: **http://localhost:5173** (o `http://<tu-IP-local>:5173` para acceso desde la red)
Documentación API: **http://localhost:8000/docs**

> **Acceso en red:** `vite.config.ts` tiene `host: true`, por lo que el frontend queda expuesto en todas las interfaces de red. Para que el backend acepte llamadas desde otras máquinas, arrancarlo con `--host 0.0.0.0`. El CORS del backend solo permite `http://localhost:5173`; como el frontend usa proxy Vite (`/api → localhost:8000`), las peticiones de red pasan por el servidor Vite y no requieren cambiar el CORS.

---

## Variables de entorno (backend/.env)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión SQLAlchemy para SQL Server |

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

---

## Registro de cambios

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
