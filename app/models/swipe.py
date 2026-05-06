import uuid
from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class SwipeAction(str, Enum):
    """Enum for swipe interaction types"""
    LIKE = "like"
    PASS = "pass"
    SUPER_LIKE = "super_like"


class Swipe(Base):
    __tablename__ = "swipes"

    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign keys
    swiper_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    swiped_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Action type
    action = Column(SQLEnum(SwipeAction), nullable=False, default=SwipeAction.PASS)
    
    # Timestamp
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    swiper = relationship("User", foreign_keys=[swiper_id], backref="swipes_made")
    swiped_user = relationship("User", foreign_keys=[swiped_user_id], backref="swipes_received")
    
    # Constraint: each user can only swipe once per target user
    __table_args__ = (UniqueConstraint('swiper_id', 'swiped_user_id', name='unique_swiper_swiped'),)
