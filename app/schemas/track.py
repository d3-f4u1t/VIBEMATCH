from pydantic import BaseModel, ConfigDict


class TrackCreate(BaseModel):
    mb_id: str
    artist_mb_id: str
    artist_name: str
    title: str
    release_title: str | None = None
    length_ms: int | None = None


class TrackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mb_id: str
    artist_mb_id: str
    artist_name: str
    title: str
    release_title: str | None
    length_ms: int | None
