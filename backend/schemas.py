"""
Pydantic schemas for request/response validation.
Keeps API contracts clean and auto-generates OpenAPI docs.
"""

from datetime import datetime, date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

NOTE_CATEGORIES = ("Reflection", "Hope", "Confession", "Question", "Memory", "Gratitude")
REPORT_REASONS = ("Not a real photo", "Hurtful or unkind", "Sensitive content", "Spam or ads")

NoteCategory = Literal["Reflection", "Hope", "Confession", "Question", "Memory", "Gratitude"]
ReportReason = Literal["Not a real photo", "Hurtful or unkind", "Sensitive content", "Spam or ads"]


# ──────────────────────────────────────
#  AUTH / USERS
# ──────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    number: int
    handle: Optional[str] = None
    email: str
    wins_name_public: bool
    profile_private: bool
    onboarded: bool
    is_admin: bool
    subs_count: int = 0     # total notes submitted — drives the unlock economy
    wins_count: int = 0
    streak: int = 0


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class OnboardingRequest(BaseModel):
    handle: str = Field(..., min_length=3, max_length=24)
    wins_name_public: bool = True
    profile_private: bool = False


class UserUpdate(BaseModel):
    handle: Optional[str] = Field(default=None, min_length=3, max_length=24)
    email: Optional[EmailStr] = None
    wins_name_public: Optional[bool] = None
    profile_private: Optional[bool] = None


# ──────────────────────────────────────
#  PROMPTS
# ──────────────────────────────────────

class PromptCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=500)
    scheduled_date: date


class PromptResponse(BaseModel):
    id: int
    text: str
    scheduled_date: date
    note_count: int = 0

    model_config = {"from_attributes": True}


class SuggestionCreate(BaseModel):
    text: str = Field(..., min_length=8, max_length=120)


class SuggestionResponse(BaseModel):
    id: int
    text: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SuggestionReview(BaseModel):
    status: Literal["approved", "rejected"]


# ──────────────────────────────────────
#  NOTES
# ──────────────────────────────────────

class NoteCreate(BaseModel):
    prompt_id: int
    title: Optional[str] = Field(default=None, max_length=80)
    content: str = Field(..., min_length=20, max_length=280)
    category: NoteCategory


class NoteResponse(BaseModel):
    id: int
    title: str
    body: str
    category: str
    prompt_id: int
    author_number: int   # used client-side for "is it mine" only — never rendered
    likes: int
    liked: bool = False
    when: str = ""       # human label like "2h ago"
    created_at: datetime


class NoteFeedResponse(BaseModel):
    """Feed for one prompt with the unlock economy applied server-side."""
    total: int
    unlocked: bool
    free_limit: int
    notes: list[NoteResponse]


class MyNoteResponse(NoteResponse):
    unlock_at: datetime  # when this prompt's 24h compose cooldown lifts


class LikeStateResponse(BaseModel):
    likes: int
    liked: bool


# ──────────────────────────────────────
#  WINS
# ──────────────────────────────────────

class WinCommentResponse(BaseModel):
    id: int
    author_number: int
    author_is_me: bool = False
    text: str


class WinCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=140)
    photo: Optional[str] = None          # base64 dataURL; also creates today's instant
    is_private: bool = False
    retakes: int = Field(default=0, ge=0, le=3)


class WinUpdate(BaseModel):
    text: Optional[str] = Field(default=None, min_length=1, max_length=140)
    is_private: Optional[bool] = None


class WinResponse(BaseModel):
    id: int
    text: str
    date: str            # display label like "May 21"
    win_date: date
    photo_url: Optional[str] = None
    likes: int
    liked: bool = False
    is_private: bool
    comments: list[WinCommentResponse] = []


class WinCommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=120)


class WeekDay(BaseModel):
    letter: str
    done: bool


class WinsSummaryResponse(BaseModel):
    streak: int
    week_days: list[WeekDay]
    logged_dates: list[date]


# ──────────────────────────────────────
#  INSTANTS
# ──────────────────────────────────────

class InstantCreate(BaseModel):
    photo: str                                  # base64 dataURL
    retakes: int = Field(default=0, ge=0, le=3)


class InstantCardResponse(BaseModel):
    """Explore-stack card — never includes the photo."""
    id: int
    author_number: int
    author_handle: Optional[str] = None   # only when the author shares their name
    streak: int
    time: str                             # "2:41 PM"
    retakes: int
    caption: Optional[str] = None
    viewed: bool


class InstantViewResponse(BaseModel):
    """Returned exactly once per viewer — the burn."""
    id: int
    photo: str            # dataURL
    caption: Optional[str] = None
    author_number: int
    time: str


class MyInstantResponse(BaseModel):
    id: int
    photo: str
    caption: Optional[str] = None
    retakes: int
    time: str
    taken_at: datetime


class StrangerProfileResponse(BaseModel):
    number: int
    handle: Optional[str] = None      # respects wins_name_public
    streak: int
    has_instant_today: bool
    instant_viewed: bool
    instant_id: Optional[int] = None
    instant_time: Optional[str] = None   # "2:41 PM"
    public_wins_count: int
    is_private: bool = False


# ──────────────────────────────────────
#  REPORTS / DONATIONS
# ──────────────────────────────────────

class ReportCreate(BaseModel):
    note_id: Optional[int] = None
    instant_id: Optional[int] = None
    reason: ReportReason


class ReportResponse(BaseModel):
    id: int
    reason: str
    status: str
    note_id: Optional[int] = None
    instant_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DonationCreate(BaseModel):
    amount_pence: int = Field(..., gt=0, le=1_000_000)
    frequency: Literal["once", "monthly"] = "once"


class DonationResponse(BaseModel):
    status: str
    charity: str
    amount_pence: int
    frequency: str


# ──────────────────────────────────────
#  ADMIN
# ──────────────────────────────────────

class AdminNoteResponse(NoteResponse):
    is_flagged: bool
    is_hidden: bool


class NoteModeration(BaseModel):
    is_hidden: bool


class ReportReview(BaseModel):
    status: Literal["resolved"]


class AdminUserResponse(BaseModel):
    number: int
    handle: Optional[str] = None
    email: str
    is_admin: bool
    notes_count: int
    wins_count: int
    created_at: datetime
