"""
Notes API routes — moderated stories with the contribute-to-unlock economy.

Endpoints
---------
POST   /api/notes               Submit a story (moderated; 24h per-prompt cooldown)
GET    /api/notes/mine          Current user's notes + cooldown state
GET    /api/notes/random/{id}   Pick a random note from a prompt's jar
GET    /api/notes/prompt/{id}   Notes feed for a prompt (unlock economy applied)
POST   /api/notes/{id}/like     Like a note (per user)
DELETE /api/notes/{id}/like     Unlike a note
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import get_current_user
from database import get_db
from models import Note, NoteLike, Prompt, User
from schemas import (
    LikeStateResponse, MyNoteResponse, NoteCreate, NoteFeedResponse, NoteResponse,
)
from moderation import moderate_content, ModerationResult
from services import time_ago

router = APIRouter(prefix="/api/notes", tags=["Notes"])

# Contribute-to-unlock economy (mirrors FREE_NOTES / UNLOCK_SUBS in the frontend):
# 0 submissions -> no notes visible; < UNLOCK_SUBS -> first FREE_NOTES per prompt;
# >= UNLOCK_SUBS -> everything.
FREE_NOTES = 3
UNLOCK_SUBS = 5

COOLDOWN = timedelta(hours=24)


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def note_to_response(note: Note, db: Session, viewer: User) -> NoteResponse:
    liked = (
        db.query(NoteLike.id)
        .filter(NoteLike.note_id == note.id, NoteLike.user_id == viewer.id)
        .first()
        is not None
    )
    return NoteResponse(
        id=note.id,
        title=note.title,
        body=note.content,
        category=note.category,
        prompt_id=note.prompt_id,
        author_number=note.author.number,
        is_anonymous=note.is_anonymous,
        likes=note.likes,
        liked=liked,
        when=time_ago(note.created_at),
        created_at=note.created_at,
    )


def derive_title(content: str) -> str:
    """First ~5 words, mirroring the frontend's fallback title."""
    words = content.split()
    title = " ".join(words[:5])
    if len(words) > 5:
        title += "…"
    return title[:80]


def subs_count(db: Session, user_id: int) -> int:
    return db.query(func.count(Note.id)).filter(Note.author_id == user_id).scalar()


# ──────────────────────────────────────
#  SUBMIT A NOTE (WITH MODERATION + COOLDOWN)
# ──────────────────────────────────────

@router.post("/", response_model=NoteResponse, status_code=201)
def create_note(
    payload: NoteCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a story to a prompt's jar.

    - One note per prompt per 24 hours (409 with unlock_at otherwise).
    - Content is moderated: CLEAN published, FLAGGED published + flagged,
      BLOCKED rejected with 400.
    """
    prompt = db.query(Prompt).filter(Prompt.id == payload.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    latest = (
        db.query(Note)
        .filter(Note.author_id == user.id, Note.prompt_id == payload.prompt_id)
        .order_by(Note.created_at.desc())
        .first()
    )
    if latest and datetime.utcnow() - latest.created_at < COOLDOWN:
        unlock_at = latest.created_at + COOLDOWN
        raise HTTPException(
            status_code=409,
            detail={
                "message": "You've already dropped a note on this prompt today",
                "unlock_at": unlock_at.isoformat() + "Z",
            },
        )

    moderation = moderate_content(payload.content)
    if moderation["result"] == ModerationResult.BLOCKED:
        raise HTTPException(
            status_code=400,
            detail="Your story could not be shared. Please ensure your content "
                   "is respectful and does not contain harmful language.",
        )

    content = moderation["sanitised_content"]
    note = Note(
        title=(payload.title or "").strip() or derive_title(content),
        content=content,
        category=payload.category,
        prompt_id=payload.prompt_id,
        author_id=user.id,
        is_anonymous=payload.is_anonymous,
        is_flagged=moderation["result"] == ModerationResult.FLAGGED,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return note_to_response(note, db, user)


# ──────────────────────────────────────
#  MY NOTES (+ COOLDOWN STATE)
# ──────────────────────────────────────

@router.get("/mine", response_model=list[MyNoteResponse])
def my_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The user's own notes, each with when its prompt's cooldown lifts."""
    notes = (
        db.query(Note)
        .filter(Note.author_id == user.id)
        .order_by(Note.created_at.desc())
        .all()
    )
    return [
        MyNoteResponse(
            **note_to_response(n, db, user).model_dump(),
            unlock_at=n.created_at + COOLDOWN,
        )
        for n in notes
    ]


# ──────────────────────────────────────
#  PICK A RANDOM NOTE
# ──────────────────────────────────────

@router.get("/random/{prompt_id}", response_model=NoteResponse)
def get_random_note(
    prompt_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reach into the jar. Requires having shared at least one note."""
    if subs_count(db, user.id) == 0:
        raise HTTPException(
            status_code=403,
            detail="Share a note first to reach into the jar",
        )

    note = (
        db.query(Note)
        .filter(
            Note.prompt_id == prompt_id,
            Note.is_hidden == False,
            Note.author_id != user.id,
        )
        .order_by(func.random())
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="No notes in this jar yet")

    return note_to_response(note, db, user)


# ──────────────────────────────────────
#  NOTES FEED FOR A PROMPT (UNLOCK ECONOMY)
# ──────────────────────────────────────

@router.get("/prompt/{prompt_id}", response_model=NoteFeedResponse)
def get_notes_by_prompt(
    prompt_id: int,
    category: str | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Visible notes for a prompt, newest first, gated by the unlock economy."""
    query = db.query(Note).filter(Note.prompt_id == prompt_id, Note.is_hidden == False)
    if category:
        query = query.filter(Note.category == category)

    total = query.count()
    query = query.order_by(Note.created_at.desc())

    subs = subs_count(db, user.id)
    unlocked = subs >= UNLOCK_SUBS
    if subs == 0:
        notes = []
    elif not unlocked:
        notes = query.limit(FREE_NOTES).all()
    else:
        notes = query.offset(offset).limit(limit).all()

    return NoteFeedResponse(
        total=total,
        unlocked=unlocked,
        free_limit=FREE_NOTES,
        notes=[note_to_response(n, db, user) for n in notes],
    )


# ──────────────────────────────────────
#  LIKE / UNLIKE
# ──────────────────────────────────────

@router.post("/{note_id}/like", response_model=LikeStateResponse)
def like_note(
    note_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Like a note. Idempotent — the unique constraint is the source of truth."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    existing = (
        db.query(NoteLike)
        .filter(NoteLike.note_id == note_id, NoteLike.user_id == user.id)
        .first()
    )
    if not existing:
        db.add(NoteLike(note_id=note_id, user_id=user.id))
        note.likes += 1
        db.commit()
        db.refresh(note)

    return LikeStateResponse(likes=note.likes, liked=True)


@router.delete("/{note_id}/like", response_model=LikeStateResponse)
def unlike_note(
    note_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    existing = (
        db.query(NoteLike)
        .filter(NoteLike.note_id == note_id, NoteLike.user_id == user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        note.likes = max(0, note.likes - 1)
        db.commit()
        db.refresh(note)

    return LikeStateResponse(likes=note.likes, liked=False)
