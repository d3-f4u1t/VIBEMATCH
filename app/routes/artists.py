# app/routes/artists.py
from fastapi import APIRouter, HTTPException
from app.services.musicbrainz import search_artist, search_artist_recordings

router = APIRouter(tags=["artists"])

@router.get("/search")
def search(name: str):
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search term too short")
    return search_artist(name)


@router.get("/artists/{artist_mb_id}/tracks")
def get_artist_tracks(artist_mb_id: str, limit: int = 10):
    if not artist_mb_id.strip():
        raise HTTPException(status_code=400, detail="Artist id is required")
    if limit < 1 or limit > 25:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 25")
    return search_artist_recordings(artist_mb_id, limit=limit)
