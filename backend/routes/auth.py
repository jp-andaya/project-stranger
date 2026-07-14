"""
Auth & account API routes.

Endpoints
---------
POST   /api/auth/signup        Create an account (email + password)
POST   /api/auth/login         Log in, returns bearer token
GET    /api/auth/me            Current user profile + counters
POST   /api/auth/onboarding    Pick a handle + privacy toggles
PATCH  /api/auth/me            Update handle/email/privacy
DELETE /api/auth/me            Delete account (cascades everything)
GET    /api/auth/handle-check  Live handle availability check
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from models import Instant, User, Win
from moderation import moderate_content, ModerationResult
from schemas import (
    AuthResponse, LoginRequest, OnboardingRequest, SignupRequest,
    UserResponse, UserUpdate,
)
from services import assign_number, user_to_response
from storage import delete_photo

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _normalise_handle(handle: str) -> str:
    handle = " ".join(handle.strip().split())
    # Handles are public identity, not review-queued content — there's no
    # place to send a "flagged" username, so anything short of clean is
    # rejected outright rather than published-with-a-flag.
    moderation = moderate_content(handle)
    if moderation["result"] != ModerationResult.CLEAN:
        raise HTTPException(
            status_code=422,
            detail="That name isn't allowed — please choose another.",
        )
    return moderation["sanitised_content"]


def _handle_taken(db: Session, handle: str, exclude_user_id: int | None = None) -> bool:
    query = db.query(User.id).filter(func.lower(User.handle) == handle.lower())
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    return query.first() is not None


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User.id).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        number=assign_number(db),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(token=create_access_token(user.id), user=user_to_response(db, user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return AuthResponse(token=create_access_token(user.id), user=user_to_response(db, user))


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_to_response(db, user)


@router.post("/onboarding", response_model=UserResponse)
def complete_onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    handle = _normalise_handle(payload.handle)
    if len(handle) < 3:
        raise HTTPException(status_code=422, detail="Handle is too short")
    if _handle_taken(db, handle, exclude_user_id=user.id):
        raise HTTPException(status_code=409, detail="That name is already taken")

    user.handle = handle
    user.wins_name_public = payload.wins_name_public
    user.profile_private = payload.profile_private
    db.commit()
    db.refresh(user)
    return user_to_response(db, user)


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.handle is not None:
        handle = _normalise_handle(payload.handle)
        if len(handle) < 3:
            raise HTTPException(status_code=422, detail="Handle is too short")
        if _handle_taken(db, handle, exclude_user_id=user.id):
            raise HTTPException(status_code=409, detail="That name is already taken")
        user.handle = handle

    if payload.email is not None:
        email = payload.email.lower()
        existing = db.query(User.id).filter(User.email == email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="That email is already in use")
        user.email = email

    if payload.wins_name_public is not None:
        user.wins_name_public = payload.wins_name_public
    if payload.profile_private is not None:
        user.profile_private = payload.profile_private

    db.commit()
    db.refresh(user)
    return user_to_response(db, user)


@router.delete("/me", status_code=204)
def delete_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Cascades delete the rows; photo files must be unlinked explicitly.
    for win in db.query(Win).filter(Win.user_id == user.id).all():
        delete_photo(win.photo_path)
    for instant in db.query(Instant).filter(Instant.user_id == user.id).all():
        delete_photo(instant.photo_path)

    db.delete(user)
    db.commit()


@router.get("/handle-check")
def handle_check(handle: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    normalised = _normalise_handle(handle)
    return {"available": len(normalised) >= 3 and not _handle_taken(db, normalised)}
