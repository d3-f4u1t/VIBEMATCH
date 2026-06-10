import uuid
from sqlalchemy import Column, Date, DateTime, JSON, String
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
    #profile fields
    bio = Column(String, nullable= True)
    location_city = Column(String, nullable = True)
    date_of_birth = Column(Date, nullable=True)
    pronouns = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    sexuality = Column(String, nullable=True)
    music_vector = Column(JSON, nullable = True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ethnicity = Column(String, nullable= True)
    height = Column(String, nullable= True)
    z_sign= Column(String, nullable = True)
    f_plan = Column(String, nullable= True)
    pets = Column(String, nullable= True)
    religion = Column(String, nullable= True)
    ethnicity = Column(String, nullable= True)
    #json cuz we are using a sub type fields in habits
    habit = Column(JSON, nullable= True)


    #relationship vector base
    artists = relationship("Artist", secondary= user_artist, back_populates="users")
    tracks = relationship("Track", secondary=user_track, back_populates="users")
    
