import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

engine = create_engine(
    os.getenv("DATABASE_URL"),
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    """Dependencia de FastAPI: provee una sesión de BD y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
