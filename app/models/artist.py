from sqlalchemy import column, Integer, String, JSON, Table, ForeignKey , DateTime
from sqlalchemy.orm import relationship
from datetime import datetime,timezone
from app.database import base


user_artist = Table(

    "user_artist",
    base.metadata,
    column("user_id", Integer, ForeignKey("user.id"), primary_key =True),
    column("artist_id", Integer, ForeignKey("artist.id"), primary_key = True),
    column("added_at", DateTime, default = lambda: datetime.now(timezone.ist))
)
    

class Artist(base):
    __tablename__ = "artists"


    id = column(Integer, primary_key = True, index = True)
    mb_id = column(String, unique = True, index =True, nullable = False)
    name = column(String, nullable = False)
    country = column(String, nullable = True)
    tags = column(JSON, default = list)
    artist_type = column(String, nullable = False)

    user = relationship("User", secondary= user_artist, back_populates= "artists")

    #keeping the tags in json as they can a list of string and will be collected from the api
