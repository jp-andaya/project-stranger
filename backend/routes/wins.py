"""
Wins API routes — the daily "captured wins" log that drives streaks.

Endpoints
---------
GET    /api/wins/mine            Current user's wins (newest first)
GET    /api/wins/summary         Streak + week strip + calendar dates
POST   /api/wins                 Log a win (a PUBLIC win's photo also captures today's instant)
PATCH  /api/wins/{id}            Edit text/privacy (owner; privacy toggles add/remove the day's instant)
DELETE /api/wins/{id}            Delete a win (owner; also removes the day's Instant if this win captured one)
POST   /api/wins/{id}/like       Like a win
DELETE /api/wins/{id}/like       Unlike a win
POST   /api/wins/{id}/comments   Comment on a win
"""

from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Instant, User, Win, WinComment, WinLike
from moderation import moderate_content, ModerationResult
from schemas import (
    WeekDay, WinCommentCreate, WinCommentResponse, WinCreate, WinResponse,
    WinsSummaryResponse, WinUpdate,
)
from services import compute_streak, date_label
from storage import copy_photo, delete_photo, save_photo

router = APIRouter(prefix="/api/wins", tags=["Wins"])


# ──────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────

def win_to_response(win: Win, db: Session, viewer: User) -> WinResponse:
    liked = (
        db.query(WinLike.id)
        .filter(WinLike.win_id == win.id, WinLike.user_id == viewer.id)
        .first()
        is not None
    )
    return WinResponse(
        id=win.id,
        text=win.text,
        date=date_label(win.win_date),
        win_date=win.win_date,
        photo_url=f"/api/media/wins/{win.id}/photo" if win.photo_path else None,
        likes=win.likes,
        liked=liked,
        is_private=win.is_private,
        comments=[
            WinCommentResponse(
                id=c.id,
                author_number=c.user.number,
                author_is_me=c.user_id == viewer.id,
                text=c.text,
            )
            for c in win.comments
        ],
    )


def get_own_win(win_id: int, user: User, db: Session) -> Win:
    win = db.query(Win).filter(Win.id == win_id).first()
    if not win or win.user_id != user.id:
        raise HTTPException(status_code=404, detail="Win not found")
    return win


def _capture_instant(db: Session, user: User, photo: str, caption: str, retakes: int):
    """A PUBLIC win logged with a photo also becomes today's instant (create or
    replace). Private wins never capture: instants are the publicly-shared face
    of win posts, so the explore feed must only ever contain public wins."""
    today = date.today()
    relative = save_photo(photo, "instants")
    instant = (
        db.query(Instant)
        .filter(Instant.user_id == user.id, Instant.instant_date == today)
        .first()
    )
    if instant:
        delete_photo(instant.photo_path)
        instant.photo_path = relative
        instant.caption = caption
        instant.retakes = retakes
        instant.taken_at = datetime.utcnow()
    else:
        db.add(Instant(
            user_id=user.id,
            instant_date=today,
            photo_path=relative,
            caption=caption,
            retakes=retakes,
            taken_at=datetime.utcnow(),
        ))


def _sync_instant_with_privacy(db: Session, user: User, win: Win):
    """Keep the day's instant consistent with the win's privacy after a toggle.
    Making a photographed win private withdraws its instant from the explore
    feed; making it public again re-captures from the win's stored photo
    (retakes reset to 0 — the original count died with the first instant).
    Only today's wins matter: older instants are already expired by date."""
    if not win.photo_path or win.win_date != date.today():
        return
    instant = (
        db.query(Instant)
        .filter(Instant.user_id == user.id, Instant.instant_date == win.win_date)
        .first()
    )
    if win.is_private and instant:
        delete_photo(instant.photo_path)
        db.delete(instant)
    elif not win.is_private and not instant:
        db.add(Instant(
            user_id=user.id,
            instant_date=win.win_date,
            photo_path=copy_photo(win.photo_path, "instants"),
            caption=win.text,
            retakes=0,
            taken_at=datetime.utcnow(),
        ))


# ──────────────────────────────────────
#  MY WINS + SUMMARY
# ──────────────────────────────────────

@router.get("/mine", response_model=list[WinResponse])
def my_wins(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wins = (
        db.query(Win)
        .filter(Win.user_id == user.id)
        .order_by(Win.win_date.desc(), Win.id.desc())
        .all()
    )
    return [win_to_response(w, db, user) for w in wins]


@router.get("/summary", response_model=WinsSummaryResponse)
def wins_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Streak, current-week strip, and every logged date (feeds the calendar
    and the mountain progress)."""
    rows = (
        db.query(Win.win_date)
        .filter(Win.user_id == user.id)
        .distinct()
        .order_by(Win.win_date.asc())
        .all()
    )
    logged = [r[0] for r in rows]
    logged_set = set(logged)

    today = date.today()
    monday = today - timedelta(days=today.weekday())
    week_days = [
        WeekDay(
            letter="MTWTFSS"[i],
            done=(monday + timedelta(days=i)) in logged_set,
        )
        for i in range(7)
    ]

    return WinsSummaryResponse(
        streak=compute_streak(db, user.id),
        week_days=week_days,
        logged_dates=logged,
    )


# ──────────────────────────────────────
#  CREATE / EDIT / DELETE
# ──────────────────────────────────────

@router.post("/", response_model=WinResponse, status_code=201)
def create_win(
    payload: WinCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    moderation = moderate_content(payload.text)
    if moderation["result"] == ModerationResult.BLOCKED:
        raise HTTPException(
            status_code=400,
            detail="Your win could not be saved. Please keep it respectful.",
        )

    text = moderation["sanitised_content"]
    win = Win(
        user_id=user.id,
        text=text,
        win_date=date.today(),
        is_private=payload.is_private,
    )

    if payload.photo:
        win.photo_path = save_photo(payload.photo, "wins")
        if not payload.is_private:
            _capture_instant(db, user, payload.photo, text, payload.retakes)

    db.add(win)
    db.commit()
    db.refresh(win)
    return win_to_response(win, db, user)


@router.patch("/{win_id}", response_model=WinResponse)
def update_win(
    win_id: int,
    payload: WinUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    win = get_own_win(win_id, user, db)
    if payload.text is not None:
        moderation = moderate_content(payload.text)
        if moderation["result"] == ModerationResult.BLOCKED:
            raise HTTPException(status_code=400, detail="That text isn't allowed")
        win.text = moderation["sanitised_content"]
    if payload.is_private is not None and payload.is_private != win.is_private:
        win.is_private = payload.is_private
        _sync_instant_with_privacy(db, user, win)
    db.commit()
    db.refresh(win)
    return win_to_response(win, db, user)


@router.delete("/{win_id}", status_code=204)
def delete_win(
    win_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    win = get_own_win(win_id, user, db)
    delete_photo(win.photo_path)
    if win.photo_path and not win.is_private:
        # This win's photo also became (or replaced) that day's Instant —
        # see _capture_instant. Instant has no win_id (it's a denormalized
        # snapshot, not a child row), so the link is inferred by user+date,
        # same as capture does. Private wins never own the day's instant
        # (they don't capture, and privatizing removes it), so skipping them
        # protects an instant another public win may have captured today.
        instant = (
            db.query(Instant)
            .filter(Instant.user_id == user.id, Instant.instant_date == win.win_date)
            .first()
        )
        if instant:
            delete_photo(instant.photo_path)
            db.delete(instant)
    db.delete(win)
    db.commit()


# ──────────────────────────────────────
#  LIKES + COMMENTS
# ──────────────────────────────────────

def _visible_win(win_id: int, user: User, db: Session) -> Win:
    win = db.query(Win).filter(Win.id == win_id).first()
    if not win or (win.is_private and win.user_id != user.id):
        raise HTTPException(status_code=404, detail="Win not found")
    return win


@router.post("/{win_id}/like", response_model=WinResponse)
def like_win(
    win_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    win = _visible_win(win_id, user, db)
    existing = (
        db.query(WinLike)
        .filter(WinLike.win_id == win_id, WinLike.user_id == user.id)
        .first()
    )
    if not existing:
        db.add(WinLike(win_id=win_id, user_id=user.id))
        win.likes += 1
        db.commit()
        db.refresh(win)
    return win_to_response(win, db, user)


@router.delete("/{win_id}/like", response_model=WinResponse)
def unlike_win(
    win_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    win = _visible_win(win_id, user, db)
    existing = (
        db.query(WinLike)
        .filter(WinLike.win_id == win_id, WinLike.user_id == user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        win.likes = max(0, win.likes - 1)
        db.commit()
        db.refresh(win)
    return win_to_response(win, db, user)


@router.post("/{win_id}/comments", response_model=WinResponse, status_code=201)
def comment_on_win(
    win_id: int,
    payload: WinCommentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    win = _visible_win(win_id, user, db)
    moderation = moderate_content(payload.text)
    if moderation["result"] == ModerationResult.BLOCKED:
        raise HTTPException(status_code=400, detail="That comment isn't allowed")

    db.add(WinComment(
        win_id=win.id,
        user_id=user.id,
        text=moderation["sanitised_content"],
    ))
    db.commit()
    db.refresh(win)
    return win_to_response(win, db, user)
