"""
Pydantic schemas for request/response validation.
Keeps API contracts clean and auto-generates OpenAPI docs.
"""

from datetime import datetime, date
from pydantic import BaseModel, Field


# ──────────────────────────────────────
#  PROMPTS
# ──────────────────────────────────────

class PromptCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=500)
    category: str = Field(default="TRUTH", max_length=50)
    scheduled_date: date


class PromptResponse(BaseModel):
    id: int
    text: str
    category: str
    scheduled_date: date
    note_count: int = 0

    model_config = {"from_attributes": True}


class PromptWithNotes(PromptResponse):
    """Extended prompt response including its notes (for archive view)."""
    pass


# ──────────────────────────────────────
#  NOTES
# ──────────────────────────────────────

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=20, max_length=2000)
    prompt_id: int


class NoteResponse(BaseModel):
    id: int
    content: str
    prompt_id: int
    created_at: datetime
    time_ago: str = ""  # computed field like "2h ago"

    model_config = {"from_attributes": True}


# ──────────────────────────────────────
#  ADMIN
# ──────────────────────────────────────

class AdminNoteResponse(NoteResponse):
    """Extended note response for admin panel."""
    is_flagged: bool
    is_hidden: bool


class NoteModeration(BaseModel):
    is_hidden: bool
