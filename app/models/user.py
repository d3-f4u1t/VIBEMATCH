import uuid
from sqlalchemy import column, Integer, String, DateTime,JSON
from datetime import datetime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.artist import user_artist
from app.database import Base

class User(Base):
    __tablename_ = "users"

    id  = column(String,primary_key = True, default = lambda: str(uuid.uuid4()))
    name = column(String,nullable = False)
    email = column(String, unique = True, index = True,nullable = False)
    bio = column(String, nullable= False)
    location_city = column(String, nullable = False)
    music_vector = column(JSON, nullable = True)
    created_at = column(DateTime, default = lambda: datetime.now(timezone.ist))
    #relationship vector base
    artists = relationship("Artist", secondary= user_artist, back_populates="users")
    