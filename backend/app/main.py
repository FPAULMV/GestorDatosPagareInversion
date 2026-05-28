from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.db import Base, engine
from app.routers.comprobantes import router as comprobantes_router

# Crear tablas al arrancar (si no existen)
Base.metadata.create_all(bind=engine)

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
