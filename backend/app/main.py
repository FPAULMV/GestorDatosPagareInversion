import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.db import Base, engine
from app.routers.comprobantes import router as comprobantes_router, STORAGE_DIR

logging.basicConfig(
    format="%(asctime)s %(levelname)s:     %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)

# Crear tablas al arrancar (si no existen)
Base.metadata.create_all(bind=engine)

# Crear carpeta de almacenamiento de PDFs (si no existe)
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
logging.getLogger(__name__).info("Carpeta de almacenamiento: %s", STORAGE_DIR.resolve())

app = FastAPI(
    title="LectorBBVA API",
    description="API para extracción y validación de comprobantes de inversión Pagaré BBVA.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Puerto por defecto de Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(comprobantes_router)


@app.get("/", tags=["Estado"])
def estado():
    return {"estado": "en línea", "version": "1.0.0"}
