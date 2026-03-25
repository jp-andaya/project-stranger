"""
SQLAlchemy ORM models for Project Stranger.

Tables
------
- prompts    : daily writing prompts
- notes      : anonymous stories submitted by users
- likes      : tracks warmth/likes (by session token to prevent duplicates)
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    Boolean, ForeignKey,
)
from sqlalchemy.orm import relationship
from database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    category = Column(String(50), default="TRUTH")       # e.g. TRUTH, REFLECTION, HOPE
    scheduled_date = Column(Date, nullable=False, unique=True)  # one prompt per day
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("Note", back_populates="prompt", lazy="dynamic")

    def __repr__(self):
        return f"<Prompt {self.id}: {self.text[:40]}...>"


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False)
    likes = Column(Integer, default=0)
    is_flagged = Column(Boolean, default=False)           # for moderation
    is_hidden = Column(Boolean, default=False)             # hidden by admin
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt = relationship("Prompt", back_populates="notes")
    like_records = relationship("Like", back_populates="note")

    def __repr__(self):
        return f"<Note {self.id}: {self.content[:40]}...>"


class Like(Base):
    """
    Tracks individual likes using a session token.
    This prevents the same browser session from liking a note twice
    without requiring user accounts.
    """
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    session_token = Column(String(64), nullable=False)    # anonymous session ID
    created_at = Column(DateTime, default=datetime.utcnow)

    note = relationship("Note", back_populates="like_records")
