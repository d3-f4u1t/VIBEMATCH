'''
This is just dfor user auth and makes sure the user is auth to use the error so that user onboarding is sommoth enough
herethe file str is just taht the file are in a compact way so that can enter use api req and edit them 
'''

from pydantic import BaseModel, ConfigDict

class MessageResponc(BaseModel):
    message:str


class ArtistSearchItem(BaseModel):
    mb_id: str
    name: str
    country: str | None = None
    type : str | None =  None
    disambiguation: str = ""
    tags = list[str] = []
    score =  int |None = None

class ArtistSearchResponse(BaseModel):
    artist: list[ArtistSearchItem]


class TrackSearchItem(BaseModel):
    mb_id: str
    artist_mb_id: str
    artist_name: str
    title: str 
    release_title: str | None = None
    length_ms : int | None = None

class TrakeSearchResponce(BaseModel):
    artist: list[TrackSearchItem]

class UserArtistItem(BaseModel):
    mb_id: str
    name: str
    tags: list[str] = []

