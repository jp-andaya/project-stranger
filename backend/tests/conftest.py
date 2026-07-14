"""
Shared fixtures — in-memory SQLite + TestClient, fresh DB per test.
"""

import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Isolate uploads before storage.py is imported.
_upload_dir = tempfile.mkdtemp(prefix="pondr-test-uploads-")
os.environ["UPLOAD_DIR"] = _upload_dir
os.environ["DATABASE_URL"] = "sqlite://"  # in-memory; StaticPool wired below

import database  # noqa: E402

from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

# Rebuild the engine on a StaticPool so every connection shares the one
# in-memory database (database.py's default engine makes one per connection).
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_engine, "connect")
def _fk_on(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


database.engine = _engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402  (imports database before we patch get_db below)
from database import Base  # noqa: E402


def _get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


main.app.dependency_overrides[database.get_db] = _get_db


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    yield


@pytest.fixture()
def client():
    return TestClient(main.app)


@pytest.fixture()
def db_session():
    db = database.SessionLocal()
    yield db
    db.close()


def signup(client, email="user@example.com", password="password123", handle=None):
    """Helper: create an account (optionally onboarded) and return (token, user)."""
    response = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert response.status_code == 201, response.text
    data = response.json()
    token = data["token"]
    if handle:
        response = client.post(
            "/api/auth/onboarding",
            json={"handle": handle, "wins_name_public": True, "profile_private": False},
            headers=auth_header(token),
        )
        assert response.status_code == 200, response.text
        data["user"] = response.json()
    return token, data["user"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_token(client, db_session):
    from models import User

    token, _ = signup(client, email="admin@pondr.dev", handle="Pondr Admin")
    user = db_session.query(User).filter(User.email == "admin@pondr.dev").first()
    user.is_admin = True
    db_session.commit()
    return token


@pytest.fixture()
def make_prompt(db_session):
    from datetime import date, timedelta
    from models import Prompt

    def _make(days_ago=0, text=None):
        prompt = Prompt(
            text=text or f"Test prompt {days_ago} — what's on your mind right now?",
            scheduled_date=date.today() - timedelta(days=days_ago),
        )
        db_session.add(prompt)
        db_session.commit()
        db_session.refresh(prompt)
        return prompt

    return _make


# Tiny valid JPEG dataURL for photo endpoints.
TINY_JPEG_DATAURL = (
    "data:image/jpeg;base64,"
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
    "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB"
    "/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9"
    "AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3"
    "ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKj"
    "pKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6"
    "/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
)
