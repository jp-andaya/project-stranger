"""
Media API routes — serving stored win photos.

Instant photos are deliberately NOT served here: they are only ever returned
by POST /api/instants/{id}/view, which records the burn. A plain photo URL
would make view-once unenforceable.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import resolve_token
from database import get_db
from models import Win
from storage import photo_abs_path

from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/media", tags=["Media"])


@router.get("/wins/{win_id}/photo")
def win_photo(
    win_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    # <img> tags can't send an Authorization header, so the token rides the
    # query string — the prototype's stand-in for signed media URLs.
    user = resolve_token(token, db)
    win = db.query(Win).filter(Win.id == win_id).first()
    if not win or not win.photo_path:
        raise HTTPException(status_code=404, detail="Photo not found")
    if win.is_private and win.user_id != user.id:
        raise HTTPException(status_code=404, detail="Photo not found")

    path = photo_abs_path(win.photo_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(path)
