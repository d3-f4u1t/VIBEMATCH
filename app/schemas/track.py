from pydantic import BaseModel, ConfigDict, Field


class TrackCreate(BaseModel):
    mb_id: str = Field(..., min_length=1, max_length=100)
    artist_mb_id: str = Field(..., min_length=1, max_length=100)
    artist_name: str = Field(..., min_length=1, max_length=200)
    title: str = Field(..., min_length=1, max_length=300)
    release_title: str | None = Field(default=None, max_length=300)
    length_ms: int | None = Field(default=None, ge=0, le=3_600_000)


class TrackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mb_id: str
    artist_mb_id: str
    artist_name: str
    title: str
    release_title: str | None
    length_ms: int | None
