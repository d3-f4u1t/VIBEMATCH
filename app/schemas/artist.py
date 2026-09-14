from pydantic import BaseModel, ConfigDict, Field


class ArtistCreate(BaseModel):
    mb_id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    country: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=25)
    artist_type: str | None = Field(default=None, max_length=50)


class ArtistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id : int
    mb_id : str
    name : str
    country : str | None
    tags : list[str]
    artist_type : str | None
