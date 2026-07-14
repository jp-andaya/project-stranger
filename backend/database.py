"""
Database configuration — SQLite via SQLAlchemy.
Creates stranger.db in the backend folder.
"""

import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Default to a local SQLite file (unchanged for local dev). In Docker we point
# this at a path on a mounted volume via the DATABASE_URL env var so data persists.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./stranger.db")

# check_same_thread is a SQLite-only connect arg; only pass it for SQLite URLs.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

if DATABASE_URL.startswith("sqlite"):
    # SQLite ignores foreign keys unless the pragma is set on every connection.
    # Without this, ON DELETE CASCADE (account deletion) silently does nothing.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
