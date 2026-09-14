"""Safety endpoints: block/unblock, report. Required for any public dating test."""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.limiter import limiter
from app.models.safety import Block, Report
from app.models.user import User

router = APIRouter(prefix="/safety", tags=["safety"])


class ReportCreate(BaseModel):
    reported_user_id: str = Field(..., min_length=1, max_length=64)
    reason: str = Field(..., min_length=1, max_length=100)
    details: str | None = Field(default=None, max_length=1000)


@router.post("/block/{blocked_user_id}", status_code=201)
@limiter.limit("30/minute")
def block_user(
    request: Request,
    blocked_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if blocked_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    target = db.query(User).filter(User.id == blocked_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = (
        db.query(Block)
        .filter(Block.blocker_id == current_user.id, Block.blocked_user_id == blocked_user_id)
        .first()
    )
    if existing:
        return {"message": "Already blocked"}
    db.add(Block(blocker_id=current_user.id, blocked_user_id=blocked_user_id))
    db.commit()
    return {"message": "User blocked"}


@router.delete("/block/{blocked_user_id}")
@limiter.limit("30/minute")
def unblock_user(
    request: Request,
    blocked_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Block)
        .filter(Block.blocker_id == current_user.id, Block.blocked_user_id == blocked_user_id)
        .first()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(existing)
    db.commit()
    return {"message": "User unblocked"}


@router.get("/blocks")
@limiter.limit("60/minute")
def list_blocks(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Block).filter(Block.blocker_id == current_user.id).all()
    return {"blocked_user_ids": [r.blocked_user_id for r in rows]}


@router.post("/report", status_code=201)
@limiter.limit("20/hour")
def report_user(
    request: Request,
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    target = db.query(User).filter(User.id == data.reported_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    report = Report(
        reporter_id=current_user.id,
        reported_user_id=data.reported_user_id,
        reason=data.reason.strip(),
        details=(data.details or "").strip() or None,
    )
    db.add(report)
    db.commit()
    return {"message": "Report submitted. Our team will review it."}
