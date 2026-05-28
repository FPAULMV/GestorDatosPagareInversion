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
cd C:\Users\AdminTI\Desktop\LectorBBVA\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd C:\Users\AdminTI\Desktop\LectorBBVA\frontend
npm run dev
```

Acceder en: **http://localhost:5173**
Documentación API: **http://localhost:8000/docs**

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

| Script | Descripción |
|---|---|
| `001_crear_base_y_tabla.sql` | Crea la base de datos y la tabla `pagare_inversiones` |

---

## Registro de cambios

### 2026-05-27
- `feat`: creación inicial del proyecto — backend FastAPI (4 capas), frontend React + Vite + Tailwind
- `feat`: extracción de comprobantes Pagaré BBVA con regex (sin API externa)
- `feat`: validación JSON Schema + reglas de negocio BR-01 a BR-11
- `feat`: almacenamiento en SQL Server (tabla `pagare_inversiones`)
- `feat`: portal con página de carga (drag-and-drop) e historial de comprobantes
