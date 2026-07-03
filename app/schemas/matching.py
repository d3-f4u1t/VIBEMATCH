from pydantic import BaseModel


class MatchItem(BaseModel):
    user_id: str
    name: str
    similarity: float
    artist_count: int
    track_count: int
    shared_artists: list[str]
    shared_tracks: list[str]
    match_reason: str
    bio: str | None = None
    location_city: str | None = None
    pronouns: str | None = None
    gender: str | None = None
    sexuality: str | None = None
    height: str | None = None
    weight: str | None = None
    ethnicity: str | None = None
    z_sign: str | None = None
    f_plan: str | None = None
    pets: str | None = None
    religion: str | None = None
    habit: dict | None = None


class MatchResponse(BaseModel):
    user_id: str
    match_count: int
    matches: list[MatchItem]
