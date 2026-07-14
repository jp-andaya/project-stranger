"""
Instants API routes — one ephemeral photo per user per day, view-once per viewer.

Endpoints
---------
POST   /api/instants                 Capture today's instant (409 if already taken)
GET    /api/instants/mine/today      Own instant for today (owner can always re-view)
GET    /api/instants/explore         Today's instants from other users (no photos)
POST   /api/instants/{id}/view       The burn: returns the photo exactly once
POST   /api/instants/{id}/like       Send love (persisted per user)
GET    /api/instants/users/{number}  Stranger profile for the wins screen

Expiry is derived: an instant is live iff instant_date == today (UTC).
Old rows simply stop appearing — no cron, no deletion job.
"""

import base64
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import get_current_user
from database import get_db
from models import Instant, InstantLike, InstantView, User, Win
from schemas import (
    InstantCardResponse, InstantCreate, InstantViewResponse,
    MyInstantResponse, StrangerProfileResponse,
)
from services import clock_label, compute_streak
from storage import delete_photo, photo_abs_path, save_photo

router = APIRouter(prefix="/api/instants", tags=["Instants"])

_MIME_BY_EXT = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def photo_data_url(relative_path: str) -> str:
    path = photo_abs_path(relative_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    mime = _MIME_BY_EXT.get(path.suffix.lstrip("."), "image/jpeg")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def _todays_caption(db: Session, user_id: int) -> str | None:
    win = (
        db.query(Win)
        .filter(Win.user_id == user_id, Win.win_date == date.today())
        .order_by(Win.id.desc())
        .first()
    )
    return win.text if win else None


def _has_viewed(db: Session, instant_id: int, viewer_id: int) -> bool:
    return (
        db.query(InstantView.id)
        .filter(InstantView.instant_id == instant_id, InstantView.viewer_id == viewer_id)
        .first()
        is not None
    )


# ──────────────────────────────────────
#  CAPTURE
# ──────────────────────────────────────

@router.post("/", response_model=MyInstantResponse, status_code=201)
def capture_instant(
    payload: InstantCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    existing = (
        db.query(Instant)
        .filter(Instant.user_id == user.id, Instant.instant_date == today)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You've already captured today's instant")

    instant = Instant(
        user_id=user.id,
        instant_date=today,
        photo_path=save_photo(payload.photo, "instants"),
        caption=_todays_caption(db, user.id),
        retakes=payload.retakes,
        taken_at=datetime.utcnow(),
    )
    db.add(instant)
    db.commit()
    db.refresh(instant)

    return MyInstantResponse(
        id=instant.id,
        photo=payload.photo,
        caption=instant.caption,
        retakes=instant.retakes,
        time=clock_label(instant.taken_at),
        taken_at=instant.taken_at,
    )


@router.get("/mine/today", response_model=MyInstantResponse)
def my_instant_today(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instant = (
        db.query(Instant)
        .filter(Instant.user_id == user.id, Instant.instant_date == date.today())
        .first()
    )
    if not instant:
        raise HTTPException(status_code=404, detail="No instant captured today")

    return MyInstantResponse(
        id=instant.id,
        photo=photo_data_url(instant.photo_path),
        caption=instant.caption,
        retakes=instant.retakes,
        time=clock_label(instant.taken_at),
        taken_at=instant.taken_at,
    )


# ──────────────────────────────────────
#  EXPLORE (NO PHOTOS)
# ──────────────────────────────────────

@router.get("/explore", response_model=list[InstantCardResponse])
def explore(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Today's instants from other users. Photos are never included here —
    they only leave the server through the view endpoint (the burn)."""
    instants = (
        db.query(Instant)
        .filter(
            Instant.instant_date == date.today(),
            Instant.user_id != user.id,
            Instant.is_flagged == False,
        )
        .order_by(Instant.taken_at.desc())
        .all()
    )
    return [
        InstantCardResponse(
            id=i.id,
            author_number=i.user.number,
            author_handle=i.user.handle if i.user.wins_name_public else None,
            streak=compute_streak(db, i.user_id),
            time=clock_label(i.taken_at),
            retakes=i.retakes,
            caption=i.caption,
            viewed=_has_viewed(db, i.id, user.id),
        )
        for i in instants
    ]


# ──────────────────────────────────────
#  VIEW (THE BURN)
# ──────────────────────────────────────

@router.post("/{instant_id}/view", response_model=InstantViewResponse)
def view_instant(
    instant_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the photo exactly once per viewer. A second call finds the
    burn record and returns 410 Gone."""
    instant = db.query(Instant).filter(Instant.id == instant_id).first()
    if not instant or instant.instant_date != date.today():
        raise HTTPException(status_code=404, detail="Instant not found")

    if instant.user_id != user.id:  # owners can always re-view their own
        if _has_viewed(db, instant.id, user.id):
            raise HTTPException(status_code=410, detail="This instant has already burned")
        db.add(InstantView(instant_id=instant.id, viewer_id=user.id))
        db.commit()

    return InstantViewResponse(
        id=instant.id,
        photo=photo_data_url(instant.photo_path),
        caption=instant.caption,
        author_number=instant.user.number,
        time=clock_label(instant.taken_at),
    )


# ──────────────────────────────────────
#  LIKE
# ──────────────────────────────────────

@router.post("/{instant_id}/like", status_code=204)
def like_instant(
    instant_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instant = db.query(Instant).filter(Instant.id == instant_id).first()
    if not instant:
        raise HTTPException(status_code=404, detail="Instant not found")

    existing = (
        db.query(InstantLike)
        .filter(InstantLike.instant_id == instant_id, InstantLike.user_id == user.id)
        .first()
    )
    if not existing:
        db.add(InstantLike(instant_id=instant_id, user_id=user.id))
        db.commit()


# ──────────────────────────────────────
#  STRANGER PROFILE
# ──────────────────────────────────────

@router.get("/users/{number}", response_model=StrangerProfileResponse)
def stranger_profile(
    number: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stranger = db.query(User).filter(User.number == number).first()
    if not stranger:
        raise HTTPException(status_code=404, detail="Stranger not found")

    if stranger.profile_private and stranger.id != user.id:
        return StrangerProfileResponse(
            number=stranger.number,
            handle=None,
            streak=0,
            has_instant_today=False,
            instant_viewed=False,
            public_wins_count=0,
            is_private=True,
        )

    instant = (
        db.query(Instant)
        .filter(Instant.user_id == stranger.id, Instant.instant_date == date.today())
        .first()
    )
    public_wins = (
        db.query(func.count(Win.id))
        .filter(Win.user_id == stranger.id, Win.is_private == False)
        .scalar()
    )

    return StrangerProfileResponse(
        number=stranger.number,
        handle=stranger.handle if stranger.wins_name_public else None,
        streak=compute_streak(db, stranger.id),
        has_instant_today=instant is not None,
        instant_viewed=_has_viewed(db, instant.id, user.id) if instant else False,
        instant_id=instant.id if instant else None,
        instant_time=clock_label(instant.taken_at) if instant else None,
        public_wins_count=public_wins,
    )
