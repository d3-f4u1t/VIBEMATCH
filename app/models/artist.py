from sqlalchemy import Column, Integer, String, JSON, Table, ForeignKey , DateTime
from sqlalchemy.orm import relationship
from datetime import datetime,timezone
from app.database import Base


user_artist = Table(

    "user_artist",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id"), primary_key =True),
    Column("artist_id", Integer, ForeignKey("artists.id"), primary_key = True),
    Column("added_at", DateTime, default = lambda: datetime.now(timezone.utc))
)
    

class Artist(Base):
    __tablename__ = "artists"


    id = Column(Integer, primary_key = True, index = True)
    mb_id = Column(String, unique = True, index =True, nullable = False)
    name = Column(String, nullable = False)
    country = Column(String, nullable = True)
    tags = Column(JSON, default = list)
    artist_type = Column(String, nullable = True)

    users = relationship("User", secondary= user_artist, back_populates= "artists")

    #keeping the tags in json as they can a list of string and will be collected from the api
