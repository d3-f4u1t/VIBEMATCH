import uuid
from sqlalchemy import Column, Integer, String, DateTime,JSON
from datetime import datetime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.artist import user_artist
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id  = Column(String,primary_key = True, default = lambda: str(uuid.uuid4()))
    name = Column(String,nullable = False)
    email = Column(String, unique = True, index = True,nullable = False)
    bio = Column(String, nullable= False)
    location_city = Column(String, nullable = False)
    music_vector = Column(JSON, nullable = True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    #relationship vector base
    artists = relationship("Artist", secondary= user_artist, back_populates="users")
    
