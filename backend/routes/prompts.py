"""
Prompts API routes — daily prompt rotation + user suggestions.

Endpoints
---------
GET    /api/prompts/today             Get today's prompt
GET    /api/prompts/archive           Past prompts with note counts (carousel/archive)
GET    /api/prompts/suggestions/mine  Current user's suggestions + status
POST   /api/prompts/suggestions      Suggest a prompt (admin-reviewed)
GET    /api/prompts/{id}              Get a specific prompt
POST   /api/prompts                   Create a new prompt (admin only)
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import get_current_admin, get_current_user
from database import get_db
from models import Note, Prompt, PromptSuggestion, User
from moderation import moderate_content, ModerationResult
from schemas import (
    PromptCreate, PromptResponse, SuggestionCreate, SuggestionResponse,
)

router = APIRouter(prefix="/api/prompts", tags=["Prompts"])


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def prompt_to_response(prompt: Prompt, db: Session) -> PromptResponse:
    """Convert a Prompt ORM object to a PromptResponse with note count."""
    count = (
        db.query(func.count(Note.id))
        .filter(Note.prompt_id == prompt.id, Note.is_hidden == False)
        .scalar()
    )
    return PromptResponse(
        id=prompt.id,
        text=prompt.text,
        scheduled_date=prompt.scheduled_date,
        note_count=count,
    )


# ──────────────────────────────────────
#  TODAY'S PROMPT
# ──────────────────────────────────────

@router.get("/today", response_model=PromptResponse)
def get_today_prompt(db: Session = Depends(get_db)):
    """
    Get today's prompt.

    Rotation logic:
    1. Look for a prompt scheduled for today's date.
    2. If none found, find the most recent prompt before today.
    3. If still none, return the first available prompt.
    """
    today = date.today()

    prompt = (
        db.query(Prompt)
        .filter(Prompt.scheduled_date == today, Prompt.is_active == True)
        .first()
    )

    if not prompt:
        prompt = (
            db.query(Prompt)
            .filter(Prompt.scheduled_date <= today, Prompt.is_active == True)
            .order_by(Prompt.scheduled_date.desc())
            .first()
        )

    if not prompt:
        prompt = (
            db.query(Prompt)
            .filter(Prompt.is_active == True)
            .order_by(Prompt.scheduled_date.asc())
            .first()
        )

    if not prompt:
        raise HTTPException(status_code=404, detail="No prompts available")

    return prompt_to_response(prompt, db)


# ──────────────────────────────────────
#  ARCHIVE (PAST PROMPTS)
# ──────────────────────────────────────

@router.get("/archive", response_model=list[PromptResponse])
def get_archive(
    limit: int = Query(default=20, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Past prompts with note counts, newest first. limit=7 feeds the carousel."""
    prompts = (
        db.query(Prompt)
        .filter(Prompt.is_active == True, Prompt.scheduled_date <= date.today())
        .order_by(Prompt.scheduled_date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [prompt_to_response(p, db) for p in prompts]


# ──────────────────────────────────────
#  SUGGESTIONS
# ──────────────────────────────────────

@router.post("/suggestions", response_model=SuggestionResponse, status_code=201)
def suggest_prompt(
    payload: SuggestionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Suggest a prompt for the admins to review."""
    moderation = moderate_content(payload.text)
    if moderation["result"] == ModerationResult.BLOCKED:
        raise HTTPException(
            status_code=400,
            detail="Your suggestion could not be submitted. Please keep it respectful.",
        )

    suggestion = PromptSuggestion(
        user_id=user.id,
        text=moderation["sanitised_content"],
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return suggestion


@router.get("/suggestions/mine", response_model=list[SuggestionResponse])
def my_suggestions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(PromptSuggestion)
        .filter(PromptSuggestion.user_id == user.id)
        .order_by(PromptSuggestion.created_at.desc())
        .all()
    )


# ──────────────────────────────────────
#  GET SPECIFIC PROMPT
# ──────────────────────────────────────

@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Get a specific prompt by ID."""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt_to_response(prompt, db)


# ──────────────────────────────────────
#  CREATE PROMPT (ADMIN)
# ──────────────────────────────────────

@router.post("/", response_model=PromptResponse, status_code=201)
def create_prompt(
    payload: PromptCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new daily prompt (admin only)."""
    existing = (
        db.query(Prompt)
        .filter(Prompt.scheduled_date == payload.scheduled_date)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A prompt already exists for {payload.scheduled_date}",
        )

    prompt = Prompt(
        text=payload.text,
        scheduled_date=payload.scheduled_date,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt_to_response(prompt, db)
