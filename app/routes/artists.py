# app/routes/artists.py
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.musicbrainz import (
    search_artist,
    search_artist_recordings,
    search_tracks_by_title,
)

router = APIRouter(tags=["artists"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/search")
@limiter.limit("30/minute")
def search(request: Request, name: str):
    """Search artists (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search term too short")
    return search_artist(name)


@router.get("/artists/{artist_mb_id}/tracks")
@limiter.limit("30/minute")
def get_artist_tracks(
    request: Request,
    artist_mb_id: str,
    limit: int = 10,
    artist_name: str | None = None,
):
    """Get top tracks for an artist (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
    if not artist_mb_id.strip():
        raise HTTPException(status_code=400, detail="Artist id is required")
    if limit < 1 or limit > 25:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 25")
    return search_artist_recordings(
        artist_mb_id,
        limit=limit,
        artist_name=artist_name.strip() if artist_name else None,
    )


@router.get("/tracks/search")
@limiter.limit("30/minute")
def search_tracks(
    request: Request,
    title: str,
    user_id: str,
    artist_name: str | None = None,
    db: Session = Depends(get_db),
    limit: int = 10,
):
    """Search tracks (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
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

    # Release the DB connection before the slow upstream music lookup.
    # The search can take seconds (Deezer retries + iTunes fallback) and
    # holding a pooled connection across it exhausts the pool under
    # concurrent load. Nothing below needs the session (get_db closes
    # again afterwards — Session.close() is idempotent).
    db.close()

    return search_tracks_by_title(
        title=title.strip(),
        artist_name=artist_name.strip() if artist_name else None,
        preferred_artists=preferred_artists,
        preferred_artist_mbids=preferred_artist_mbids,
        limit=limit,
    )
