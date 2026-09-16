"""Waitlist endpoints: pre-launch city-gated signup. No auth required."""

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends

from app.database import get_db
from app.limiter import limiter
from app.models.waitlist import WaitlistEntry

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


class WaitlistCreate(BaseModel):
    email: EmailStr
    city: str | None = Field(default=None, max_length=100)


@router.post("", status_code=201)
@limiter.limit("20/minute")
def join_waitlist(request: Request, data: WaitlistCreate, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    city = (data.city or "").strip()[:100] or None
    existing = db.query(WaitlistEntry).filter(WaitlistEntry.email == email).first()
    if existing:
        if city and not existing.city:
            existing.city = city
            db.commit()
        return {"message": "You're on the list.", "email": email}
    try:
        db.add(WaitlistEntry(email=email, city=city))
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"message": "You're on the list.", "email": email}
    return {"message": "You're on the list.", "email": email}


@router.get("/count")
@limiter.limit("60/minute")
def waitlist_count(request: Request, city: str | None = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(WaitlistEntry)
    if city:
        q = q.filter(WaitlistEntry.city.ilike(city.strip()[:100]))
    return {"count": q.count(), "city": city}
