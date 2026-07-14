"""
Donations API routes — STUB.

Records donation intents only. No card details are accepted or stored;
the mock payment UI stays client-side. Wiring a real payment provider
(Stripe, or Mind's own donation endpoint) is explicitly out of scope
for the prototype.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Donation, User
from schemas import DonationCreate, DonationResponse

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("/", response_model=DonationResponse, status_code=201)
def record_donation(
    payload: DonationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donation = Donation(
        user_id=user.id,
        amount_pence=payload.amount_pence,
        frequency=payload.frequency,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    return DonationResponse(
        status=donation.status,
        charity=donation.charity,
        amount_pence=donation.amount_pence,
        frequency=donation.frequency,
    )
