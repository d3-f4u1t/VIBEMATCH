# app/routes/artists.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.musicbrainz import (
    search_artist,
    search_artist_recordings,
    search_tracks_by_title,
)

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


@router.get("/tracks/search")
def search_tracks(
    title: str,
    user_id: str,
    artist_name: str | None = None,
    db: Session = Depends(get_db),
    limit: int = 10,
):
    if not title or len(title.strip()) < 2:
        raise HTTPException(status_code=400, detail="Track search term too short")
    if limit < 1 or limit > 25:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 25")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    preferred_artists = {
        artist.mb_id: artist.name
        for artist in user.artists
        if artist.mb_id and artist.name
    }
    preferred_artist_mbids = set(preferred_artists.keys())

    return search_tracks_by_title(
        title=title.strip(),
        artist_name=artist_name.strip() if artist_name else None,
        preferred_artists=preferred_artists,
        preferred_artist_mbids=preferred_artist_mbids,
        limit=limit,
    )
