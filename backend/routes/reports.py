"""
Reports API routes — user reports against a note or an instant.

POST /api/reports   Report content (one of the four canned reasons);
                    flags the target for admin review.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Instant, Note, Report, User
from schemas import ReportCreate, ReportResponse

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(
    payload: ReportCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (payload.note_id is None) == (payload.instant_id is None):
        raise HTTPException(
            status_code=422,
            detail="Report exactly one target: a note or an instant",
        )

    if payload.note_id is not None:
        target = db.query(Note).filter(Note.id == payload.note_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Note not found")
        target.is_flagged = True
    else:
        target = db.query(Instant).filter(Instant.id == payload.instant_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Instant not found")
        target.is_flagged = True

    report = Report(
        reporter_id=user.id,
        note_id=payload.note_id,
        instant_id=payload.instant_id,
        reason=payload.reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
