"""
Notes API routes — the core of Project Stranger.

Endpoints
---------
POST   /api/notes              Submit an anonymous story
GET    /api/notes/random/{id}  Pick a random note for a prompt
GET    /api/notes/prompt/{id}  List all notes for a prompt
POST   /api/notes/{id}/like    Send warmth (like) to a note
GET    /api/notes/{id}/liked   Check if session already liked a note
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Note, Like, Prompt
from schemas import NoteCreate, NoteResponse, LikeRequest, LikeResponse

router = APIRouter(prefix="/api/notes", tags=["Notes"])


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def time_ago(dt: datetime) -> str:
    """Convert a datetime to a human-readable 'time ago' string."""
    now = datetime.now(timezone.utc)
    # Make dt offset-aware if it isn't
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        mins = seconds // 60
        return f"{mins}m ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours}h ago"
    else:
        days = seconds // 86400
        return f"{days}d ago"


def note_to_response(note: Note) -> NoteResponse:
    """Convert a Note ORM object to a NoteResponse schema."""
    return NoteResponse(
        id=note.id,
        content=note.content,
        prompt_id=note.prompt_id,
        likes=note.likes,
        created_at=note.created_at,
        time_ago=time_ago(note.created_at),
    )


# ──────────────────────────────────────
#  SUBMIT A NOTE
# ──────────────────────────────────────

@router.post("/", response_model=NoteResponse, status_code=201)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """Submit an anonymous story to a prompt's bowl."""
    # Verify the prompt exists
    prompt = db.query(Prompt).filter(Prompt.id == payload.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    note = Note(
        content=payload.content,
        prompt_id=payload.prompt_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return note_to_response(note)


# ──────────────────────────────────────
#  PICK A RANDOM NOTE
# ──────────────────────────────────────

@router.get("/random/{prompt_id}", response_model=NoteResponse)
def get_random_note(prompt_id: int, db: Session = Depends(get_db)):
    """Pick a random note from a prompt's bowl."""
    note = (
        db.query(Note)
        .filter(Note.prompt_id == prompt_id, Note.is_hidden == False)
        .order_by(func.random())
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="No notes in this bowl yet")

    return note_to_response(note)


# ──────────────────────────────────────
#  LIST NOTES FOR A PROMPT
# ──────────────────────────────────────

@router.get("/prompt/{prompt_id}", response_model=list[NoteResponse])
def get_notes_by_prompt(
    prompt_id: int,
    limit: int = Query(default=20, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all visible notes for a prompt (paginated, newest first)."""
    notes = (
        db.query(Note)
        .filter(Note.prompt_id == prompt_id, Note.is_hidden == False)
        .order_by(Note.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [note_to_response(n) for n in notes]


# ──────────────────────────────────────
#  LIKE A NOTE (SEND WARMTH)
# ──────────────────────────────────────

@router.post("/{note_id}/like", response_model=LikeResponse)
def like_note(note_id: int, payload: LikeRequest, db: Session = Depends(get_db)):
    """Send warmth to a note. One like per session token per note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Check if this session already liked this note
    existing = (
        db.query(Like)
        .filter(Like.note_id == note_id, Like.session_token == payload.session_token)
        .first()
    )
    if existing:
        return LikeResponse(note_id=note_id, likes=note.likes, already_liked=True)

    # Record the like
    like = Like(note_id=note_id, session_token=payload.session_token)
    db.add(like)
    note.likes += 1
    db.commit()
    db.refresh(note)

    return LikeResponse(note_id=note_id, likes=note.likes, already_liked=False)


# ──────────────────────────────────────
#  CHECK IF LIKED
# ──────────────────────────────────────

@router.get("/{note_id}/liked")
def check_liked(
    note_id: int,
    session_token: str = Query(...),
    db: Session = Depends(get_db),
):
    """Check if a session has already liked a note."""
    existing = (
        db.query(Like)
        .filter(Like.note_id == note_id, Like.session_token == session_token)
        .first()
    )
    return {"liked": existing is not None}
