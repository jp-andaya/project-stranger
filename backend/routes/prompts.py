"""
Prompts API routes — daily prompt rotation system.

Endpoints
---------
GET    /api/prompts/today      Get today's prompt
GET    /api/prompts/archive    Get past prompts with note counts
GET    /api/prompts/{id}       Get a specific prompt
POST   /api/prompts            Create a new prompt (admin)
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Prompt, Note
from schemas import PromptCreate, PromptResponse

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
        category=prompt.category,
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

    # Try exact match for today
    prompt = (
        db.query(Prompt)
        .filter(Prompt.scheduled_date == today, Prompt.is_active == True)
        .first()
    )

    # Fallback: most recent past prompt
    if not prompt:
        prompt = (
            db.query(Prompt)
            .filter(Prompt.scheduled_date <= today, Prompt.is_active == True)
            .order_by(Prompt.scheduled_date.desc())
            .first()
        )

    # Fallback: any active prompt
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
    """Get past prompts with note counts, newest first."""
    prompts = (
        db.query(Prompt)
        .filter(Prompt.is_active == True)
        .order_by(Prompt.scheduled_date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [prompt_to_response(p, db) for p in prompts]


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
def create_prompt(payload: PromptCreate, db: Session = Depends(get_db)):
    """Create a new daily prompt (admin use)."""
    # Check for duplicate date
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
        category=payload.category,
        scheduled_date=payload.scheduled_date,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt_to_response(prompt, db)
