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


class MatchResponse(BaseModel):
    user_id: str
    match_count: int
    matches: list[MatchItem]
