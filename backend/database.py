"""
Database configuration — PostgreSQL via SQLAlchemy.
Connection string comes from the DATABASE_URL environment variable,
falling back to a local dev server (database: stranger).
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()  # Reads backend/.env if present (see .env.example)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/stranger",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Recycle stale connections dropped by the server
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
