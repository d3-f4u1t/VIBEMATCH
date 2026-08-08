from pydantic import BaseModel, ConfigDict


class ArtistCreate(BaseModel):
    mb_id : str
    name : str
    country : str | None = None
    tags : list[str] = []
    artist_type : str | None = None


class ArtistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id : int
    mb_id : str
    name : str
    country : str | None
    tags : list[str]
    artist_type : str | None
