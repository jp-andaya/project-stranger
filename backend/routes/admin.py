"""
Admin API routes — moderation panel. The whole router requires an admin
bearer token (closes decision D2 — these routes are no longer open).

Endpoints
---------
GET    /api/admin/notes                List all notes (inc. hidden/flagged)
GET    /api/admin/notes/flagged        List flagged notes
PATCH  /api/admin/notes/{id}           Hide/unhide a note
DELETE /api/admin/notes/{id}           Permanently delete a note
POST   /api/admin/notes/{id}/flag      Flag a note for review
GET    /api/admin/suggestions          Review queue for prompt suggestions
PATCH  /api/admin/suggestions/{id}     Approve (auto-schedules a prompt) / reject
GET    /api/admin/reports              Open reports queue
PATCH  /api/admin/reports/{id}         Resolve a report
GET    /api/admin/instants/flagged     Flagged instants
DELETE /api/admin/instants/{id}        Remove an instant (+ its photo)
GET    /api/admin/users                User list with counters
GET    /api/admin/stats                Dashboard statistics
"""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import get_current_admin
from database import get_db
from models import (
    Instant, Note, Prompt, PromptSuggestion, Report, User, Win,
)
from schemas import (
    AdminNoteResponse, AdminUserResponse, NoteModeration, ReportResponse,
    ReportReview, SuggestionResponse, SuggestionReview,
)
from services import time_ago
from storage import delete_photo

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def admin_note_response(note: Note) -> AdminNoteResponse:
    return AdminNoteResponse(
        id=note.id,
        title=note.title,
        body=note.content,
        category=note.category,
        prompt_id=note.prompt_id,
        author_number=note.author.number,
        likes=note.likes,
        when=time_ago(note.created_at),
        created_at=note.created_at,
        is_flagged=note.is_flagged,
        is_hidden=note.is_hidden,
    )


# ──────────────────────────────────────
#  NOTES MODERATION
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


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Permanently delete a note. Likes and reports cascade at the DB level."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()


@router.post("/notes/{note_id}/flag")
def flag_note(note_id: int, db: Session = Depends(get_db)):
    """Flag a note for moderator review."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_flagged = True
    db.commit()

    return {"message": "Note flagged for review"}


# ──────────────────────────────────────
#  PROMPT SUGGESTIONS REVIEW
# ──────────────────────────────────────

@router.get("/suggestions", response_model=list[SuggestionResponse])
def list_suggestions(
    status: str = Query(default="pending"),
    db: Session = Depends(get_db),
):
    return (
        db.query(PromptSuggestion)
        .filter(PromptSuggestion.status == status)
        .order_by(PromptSuggestion.created_at.asc())
        .all()
    )


@router.patch("/suggestions/{suggestion_id}", response_model=SuggestionResponse)
def review_suggestion(
    suggestion_id: int,
    payload: SuggestionReview,
    db: Session = Depends(get_db),
):
    """Approve or reject. Approval schedules a real prompt on the next free date."""
    suggestion = (
        db.query(PromptSuggestion)
        .filter(PromptSuggestion.id == suggestion_id)
        .first()
    )
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != "pending":
        raise HTTPException(status_code=409, detail="Suggestion already reviewed")

    suggestion.status = payload.status
    suggestion.reviewed_at = datetime.utcnow()

    if payload.status == "approved":
        # Find the next date with no prompt scheduled, starting tomorrow.
        next_date = date.today() + timedelta(days=1)
        taken = {
            d for (d,) in db.query(Prompt.scheduled_date)
            .filter(Prompt.scheduled_date >= next_date)
            .all()
        }
        while next_date in taken:
            next_date += timedelta(days=1)

        prompt = Prompt(
            text=suggestion.text,
            scheduled_date=next_date,
            suggested_by_user_id=suggestion.user_id,
        )
        db.add(prompt)
        db.flush()
        suggestion.prompt_id = prompt.id

    db.commit()
    db.refresh(suggestion)
    return suggestion


# ──────────────────────────────────────
#  REPORTS QUEUE
# ──────────────────────────────────────

@router.get("/reports", response_model=list[ReportResponse])
def list_reports(
    status: str = Query(default="open"),
    db: Session = Depends(get_db),
):
    return (
        db.query(Report)
        .filter(Report.status == status)
        .order_by(Report.created_at.asc())
        .all()
    )


@router.patch("/reports/{report_id}", response_model=ReportResponse)
def resolve_report(
    report_id: int,
    payload: ReportReview,
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = payload.status
    db.commit()
    db.refresh(report)
    return report


# ──────────────────────────────────────
#  INSTANTS MODERATION
# ──────────────────────────────────────

@router.get("/instants/flagged")
def list_flagged_instants(db: Session = Depends(get_db)):
    instants = (
        db.query(Instant)
        .filter(Instant.is_flagged == True)
        .order_by(Instant.taken_at.desc())
        .all()
    )
    return [
        {
            "id": i.id,
            "author_number": i.user.number,
            "instant_date": i.instant_date.isoformat(),
            "caption": i.caption,
            "retakes": i.retakes,
        }
        for i in instants
    ]


@router.delete("/instants/{instant_id}", status_code=204)
def delete_instant(instant_id: int, db: Session = Depends(get_db)):
    instant = db.query(Instant).filter(Instant.id == instant_id).first()
    if not instant:
        raise HTTPException(status_code=404, detail="Instant not found")

    delete_photo(instant.photo_path)
    db.delete(instant)
    db.commit()


# ──────────────────────────────────────
#  USERS
# ──────────────────────────────────────

@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .order_by(User.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        AdminUserResponse(
            number=u.number,
            handle=u.handle,
            email=u.email,
            is_admin=u.is_admin,
            notes_count=db.query(func.count(Note.id)).filter(Note.author_id == u.id).scalar(),
            wins_count=db.query(func.count(Win.id)).filter(Win.user_id == u.id).scalar(),
            created_at=u.created_at,
        )
        for u in users
    ]


# ──────────────────────────────────────
#  DASHBOARD STATS
# ──────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Overview stats for the admin dashboard."""
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_notes": db.query(func.count(Note.id)).scalar(),
        "total_prompts": db.query(func.count(Prompt.id)).scalar(),
        "total_wins": db.query(func.count(Win.id)).scalar(),
        "total_likes": db.query(func.coalesce(func.sum(Note.likes), 0)).scalar(),
        "instants_today": db.query(func.count(Instant.id))
            .filter(Instant.instant_date == date.today()).scalar(),
        "flagged_count": db.query(func.count(Note.id))
            .filter(Note.is_flagged == True, Note.is_hidden == False).scalar(),
        "hidden_count": db.query(func.count(Note.id))
            .filter(Note.is_hidden == True).scalar(),
        "open_reports": db.query(func.count(Report.id))
            .filter(Report.status == "open").scalar(),
        "pending_suggestions": db.query(func.count(PromptSuggestion.id))
            .filter(PromptSuggestion.status == "pending").scalar(),
    }
