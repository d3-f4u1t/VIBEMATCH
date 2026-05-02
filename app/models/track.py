from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from app.database import Base


user_track = Table(
    "user_track",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("track_id", Integer, ForeignKey("tracks.id"), primary_key=True),
    Column("added_at", DateTime, default=lambda: datetime.now(timezone.utc)),
)


class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    mb_id = Column(String, unique=True, index=True, nullable=False)
    artist_mb_id = Column(String, index=True, nullable=False)
    artist_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    release_title = Column(String, nullable=True)
    length_ms = Column(Integer, nullable=True)

    users = relationship("User", secondary=user_track, back_populates="tracks")
