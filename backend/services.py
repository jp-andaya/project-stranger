"""
Shared helpers used across routers: time labels, streak computation,
user response assembly, and pseudonymous number assignment.
"""

import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Note, User, Win


def time_ago(dt: datetime) -> str:
    """Human label matching the frontend's sample copy ("2h ago", "1 day ago")."""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    seconds = int((now - dt).total_seconds())

    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    days = seconds // 86400
    return "1 day ago" if days == 1 else f"{days} days ago"


def clock_label(dt: datetime) -> str:
    """"2:41 PM" — no leading zero, cross-platform (Windows lacks %-I)."""
    return dt.strftime("%I:%M %p").lstrip("0")


def date_label(d: date) -> str:
    """"May 21" — cross-platform (Windows lacks %-d)."""
    return f"{d.strftime('%b')} {d.day}"


def compute_streak(db: Session, user_id: int) -> int:
    """Consecutive distinct win dates ending today or yesterday (UTC).

    Derived on demand rather than stored — a stored counter is the classic
    source of drift bugs, and this query is cheap at prototype scale.
    """
    rows = (
        db.query(Win.win_date)
        .filter(Win.user_id == user_id)
        .distinct()
        .order_by(Win.win_date.desc())
        .all()
    )
    dates = [r[0] for r in rows]
    if not dates:
        return 0

    today = date.today()
    # A streak isn't broken until the day ends, so it may end yesterday.
    if dates[0] not in (today, today - timedelta(days=1)):
        return 0

    streak = 1
    for prev, nxt in zip(dates, dates[1:]):
        if prev - nxt == timedelta(days=1):
            streak += 1
        else:
            break
    return streak


def assign_number(db: Session) -> int:
    """Random unused public number. Random (not sequential) so it never leaks
    signup order or user count."""
    for _ in range(50):
        candidate = random.randint(1, 9999)
        if not db.query(User.id).filter(User.number == candidate).first():
            return candidate
    # Practically unreachable at prototype scale; widen the range as a backstop.
    while True:
        candidate = random.randint(10000, 999_999)
        if not db.query(User.id).filter(User.number == candidate).first():
            return candidate


def user_to_response(db: Session, user: User):
    from schemas import UserResponse

    subs_count = db.query(func.count(Note.id)).filter(Note.author_id == user.id).scalar()
    wins_count = db.query(func.count(Win.id)).filter(Win.user_id == user.id).scalar()
    return UserResponse(
        number=user.number,
        handle=user.handle,
        email=user.email,
        wins_name_public=user.wins_name_public,
        profile_private=user.profile_private,
        onboarded=user.handle is not None,
        is_admin=user.is_admin,
        subs_count=subs_count,
        wins_count=wins_count,
        streak=compute_streak(db, user.id),
    )
