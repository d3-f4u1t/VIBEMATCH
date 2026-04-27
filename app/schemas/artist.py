from pydantic import BaseModel


class ArtistCreate(BaseModel):
    mb_id : str
    name : str
    country : str | None = None
    tags : list[str] = []


class ArtistResponse(BaseModel):
    id : int
    mb_id : str
    name : str
    country : str | None
    tags : list[str]

    class Config:
        from_attributes = True