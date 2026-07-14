"""
SQLAlchemy ORM models for Pondr.

Tables
------
- users               : accounts with pseudonymous public numbers + handles
- prompts             : daily writing prompts
- prompt_suggestions  : user-submitted prompt ideas (admin-reviewed)
- notes               : stories submitted to a prompt's jar
- note_likes          : per-user likes on notes
- wins                : daily "captured wins" (gratitude log), drives streaks
- win_likes           : per-user likes on wins
- win_comments        : short comments on wins
- instants            : one ephemeral photo per user per day
- instant_views       : per-viewer "burn" records (view-once enforcement)
- instant_likes       : per-user likes on instants
- reports             : user reports against a note or an instant
- donations           : recorded donation intents (stub — no card data)
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    Boolean, ForeignKey, UniqueConstraint, Index, CheckConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Public pseudonymous identity, e.g. shown as "@1024". Random, immutable,
    # non-sequential so it never leaks signup order or user count.
    number = Column(Integer, nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True)  # stored lowercased
    password_hash = Column(String(255), nullable=False)
    # Null until onboarding completes; stored lowercased-checked for uniqueness.
    handle = Column(String(64), unique=True, nullable=True)
    wins_name_public = Column(Boolean, default=True, nullable=False)
    profile_private = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("Note", back_populates="author", passive_deletes=True)
    wins = relationship("Win", back_populates="user", passive_deletes=True)
    instants = relationship("Instant", back_populates="user", passive_deletes=True)

    def __repr__(self):
        return f"<User {self.id} @{self.number} {self.handle!r}>"


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    scheduled_date = Column(Date, nullable=False, unique=True)  # one prompt per day
    is_active = Column(Boolean, default=True)
    # Provenance when a prompt came from an approved user suggestion.
    suggested_by_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("Note", back_populates="prompt", lazy="dynamic")

    def __repr__(self):
        return f"<Prompt {self.id}: {self.text[:40]}...>"


class PromptSuggestion(Base):
    __tablename__ = "prompt_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text = Column(String(120), nullable=False)
    status = Column(String(16), nullable=False, default="pending")  # pending|approved|rejected
    # Set when approved and scheduled as a real prompt.
    prompt_id = Column(Integer, ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User")


class Note(Base):
    __tablename__ = "notes"
    __table_args__ = (
        Index("ix_notes_prompt_created", "prompt_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(80), nullable=False)
    content = Column(Text, nullable=False)  # <= 280 chars, enforced in Pydantic
    category = Column(String(20), nullable=False)  # Reflection/Hope/Confession/...
    prompt_id = Column(
        Integer, ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False
    )
    author_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    likes = Column(Integer, default=0, nullable=False)  # denormalized counter
    is_flagged = Column(Boolean, default=False)   # for moderation
    is_hidden = Column(Boolean, default=False)    # hidden by admin
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt = relationship("Prompt", back_populates="notes")
    author = relationship("User", back_populates="notes")
    like_records = relationship("NoteLike", passive_deletes=True)

    def __repr__(self):
        return f"<Note {self.id}: {self.content[:40]}...>"


class NoteLike(Base):
    __tablename__ = "note_likes"
    __table_args__ = (
        UniqueConstraint("note_id", "user_id", name="uq_note_likes_note_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Win(Base):
    __tablename__ = "wins"
    __table_args__ = (
        Index("ix_wins_user_date", "user_id", "win_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text = Column(String(140), nullable=False)
    win_date = Column(Date, nullable=False)  # server date at creation; streaks use distinct dates
    photo_path = Column(String(255), nullable=True)  # relative path under UPLOAD_DIR
    is_private = Column(Boolean, default=False, nullable=False)
    likes = Column(Integer, default=0, nullable=False)  # denormalized counter
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wins")
    comments = relationship(
        "WinComment", back_populates="win", passive_deletes=True,
        order_by="WinComment.created_at",
    )
    like_records = relationship("WinLike", passive_deletes=True)


class WinLike(Base):
    __tablename__ = "win_likes"
    __table_args__ = (
        UniqueConstraint("win_id", "user_id", name="uq_win_likes_win_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    win_id = Column(Integer, ForeignKey("wins.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WinComment(Base):
    __tablename__ = "win_comments"

    id = Column(Integer, primary_key=True, index=True)
    win_id = Column(
        Integer, ForeignKey("wins.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    win = relationship("Win", back_populates="comments")
    user = relationship("User")


class Instant(Base):
    __tablename__ = "instants"
    __table_args__ = (
        UniqueConstraint("user_id", "instant_date", name="uq_instants_user_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    instant_date = Column(Date, nullable=False)  # live iff == today (UTC); no cron needed
    photo_path = Column(String(255), nullable=False)
    # Copied from today's win at capture time — deliberately denormalized:
    # the instant is a snapshot; editing the win later shouldn't rewrite it.
    caption = Column(String(140), nullable=True)
    retakes = Column(Integer, default=0, nullable=False)  # 0-3
    taken_at = Column(DateTime, nullable=False)  # drives the "2:41 PM" display
    is_flagged = Column(Boolean, default=False)

    user = relationship("User", back_populates="instants")
    views = relationship("InstantView", passive_deletes=True)


class InstantView(Base):
    """The 'burn' table — one row per viewer; existence means already viewed."""
    __tablename__ = "instant_views"
    __table_args__ = (
        UniqueConstraint("instant_id", "viewer_id", name="uq_instant_views_instant_viewer"),
    )

    id = Column(Integer, primary_key=True, index=True)
    instant_id = Column(
        Integer, ForeignKey("instants.id", ondelete="CASCADE"), nullable=False
    )
    viewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)


class InstantLike(Base):
    __tablename__ = "instant_likes"
    __table_args__ = (
        UniqueConstraint("instant_id", "user_id", name="uq_instant_likes_instant_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    instant_id = Column(
        Integer, ForeignKey("instants.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        # Exactly one target: a note XOR an instant.
        CheckConstraint(
            "(note_id IS NULL) != (instant_id IS NULL)",
            name="ck_reports_one_target",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=True)
    instant_id = Column(
        Integer, ForeignKey("instants.id", ondelete="CASCADE"), nullable=True
    )
    reason = Column(String(40), nullable=False)  # one of the 4 canned reasons
    status = Column(String(16), nullable=False, default="open")  # open|resolved
    created_at = Column(DateTime, default=datetime.utcnow)


class Donation(Base):
    """Recorded donation intents only — no card details are ever stored."""
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    amount_pence = Column(Integer, nullable=False)
    frequency = Column(String(16), nullable=False, default="once")  # once|monthly
    charity = Column(String(32), nullable=False, default="Mind")
    status = Column(String(16), nullable=False, default="recorded")
    created_at = Column(DateTime, default=datetime.utcnow)
