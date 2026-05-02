import uuid
from sqlalchemy import Column, DateTime, JSON, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.artist import user_artist
from app.models.track import user_track
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id  = Column(String,primary_key = True, default = lambda: str(uuid.uuid4()))
    name = Column(String,nullable = False)
    email = Column(String, unique = True, index = True,nullable = False)
    password_hash = Column(String, nullable = False)
    bio = Column(String, nullable= True)
    location_city = Column(String, nullable = True)
    music_vector = Column(JSON, nullable = True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    #relationship vector base
    artists = relationship("Artist", secondary= user_artist, back_populates="users")
    tracks = relationship("Track", secondary=user_track, back_populates="users")
    
