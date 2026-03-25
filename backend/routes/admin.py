"""
Admin API routes — moderation panel.

Endpoints
---------
GET    /api/admin/notes              List all notes (inc. hidden/flagged)
GET    /api/admin/notes/flagged      List flagged notes
PATCH  /api/admin/notes/{id}         Hide/unhide a note
DELETE /api/admin/notes/{id}         Permanently delete a note
GET    /api/admin/stats              Dashboard statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Note, Prompt, Like
from schemas import AdminNoteResponse, NoteModeration
from routes.notes import note_to_response, time_ago

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# NOTE: In production, these routes would be protected by authentication.
# For the dissertation prototype, they are open for demonstration purposes.


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def admin_note_response(note: Note) -> AdminNoteResponse:
    return AdminNoteResponse(
        id=note.id,
        content=note.content,
        prompt_id=note.prompt_id,
        likes=note.likes,
        created_at=note.created_at,
        time_ago=time_ago(note.created_at),
        is_flagged=note.is_flagged,
        is_hidden=note.is_hidden,
    )


# ──────────────────────────────────────
#  LIST ALL NOTES (ADMIN VIEW)
# ──────────────────────────────────────

@router.get("/notes", response_model=list[AdminNoteResponse])
def list_all_notes(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    show_hidden: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    """List all notes including hidden ones (for moderation)."""
    query = db.query(Note).order_by(Note.created_at.desc())
    if not show_hidden:
        query = query.filter(Note.is_hidden == False)
    notes = query.offset(offset).limit(limit).all()
    return [admin_note_response(n) for n in notes]


# ──────────────────────────────────────
#  LIST FLAGGED NOTES
# ──────────────────────────────────────

@router.get("/notes/flagged", response_model=list[AdminNoteResponse])
def list_flagged_notes(db: Session = Depends(get_db)):
    """List notes that have been flagged for review."""
    notes = (
        db.query(Note)
        .filter(Note.is_flagged == True, Note.is_hidden == False)
        .order_by(Note.created_at.desc())
        .all()
    )
    return [admin_note_response(n) for n in notes]


# ──────────────────────────────────────
#  MODERATE A NOTE (HIDE / UNHIDE)
# ──────────────────────────────────────

@router.patch("/notes/{note_id}", response_model=AdminNoteResponse)
def moderate_note(
    note_id: int,
    payload: NoteModeration,
    db: Session = Depends(get_db),
):
    """Hide or unhide a note (soft moderation)."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_hidden = payload.is_hidden
    if payload.is_hidden:
        note.is_flagged = False  # Clear flag when hidden
    db.commit()
    db.refresh(note)

    return admin_note_response(note)


# ──────────────────────────────────────
#  DELETE A NOTE (PERMANENT)
# ──────────────────────────────────────

@router.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Permanently delete a note and its likes."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Delete associated likes first
    db.query(Like).filter(Like.note_id == note_id).delete()
    db.delete(note)
    db.commit()


# ──────────────────────────────────────
#  FLAG A NOTE (USER-FACING)
# ──────────────────────────────────────

@router.post("/notes/{note_id}/flag")
def flag_note(note_id: int, db: Session = Depends(get_db)):
    """Flag a note for moderator review (could be called from frontend)."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_flagged = True
    db.commit()

    return {"message": "Note flagged for review"}


# ──────────────────────────────────────
#  DASHBOARD STATS
# ──────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get overview stats for the admin dashboard."""
    total_notes = db.query(func.count(Note.id)).scalar()
    total_prompts = db.query(func.count(Prompt.id)).scalar()
    total_likes = db.query(func.coalesce(func.sum(Note.likes), 0)).scalar()
    flagged_count = (
        db.query(func.count(Note.id))
        .filter(Note.is_flagged == True, Note.is_hidden == False)
        .scalar()
    )
    hidden_count = (
        db.query(func.count(Note.id))
        .filter(Note.is_hidden == True)
        .scalar()
    )

    return {
        "total_notes": total_notes,
        "total_prompts": total_prompts,
        "total_likes": total_likes,
        "flagged_count": flagged_count,
        "hidden_count": hidden_count,
    }
