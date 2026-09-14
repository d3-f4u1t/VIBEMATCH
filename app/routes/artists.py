# app/routes/artists.py
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.limiter import limiter
from app.models.user import User
from app.services.musicbrainz import (
    search_artist,
    search_artist_recordings,
    search_tracks_by_title,
)

router = APIRouter(tags=["artists"])


@router.get("/search")
@limiter.limit("30/minute")
def search(
    request: Request,
    name: str = Query(..., min_length=2, max_length=200),
    _user: User = Depends(get_current_user),
):
    """Search artists (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
    return search_artist(name.strip())


@router.get("/artists/{artist_mb_id}/tracks")
@limiter.limit("30/minute")
def get_artist_tracks(
    request: Request,
    artist_mb_id: str,
    limit: int = Query(default=10, ge=1, le=25),
    artist_name: str | None = Query(default=None, max_length=200),
    _user: User = Depends(get_current_user),
):
    """Get top tracks for an artist (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
    if not artist_mb_id.strip():
        raise HTTPException(status_code=400, detail="Artist id is required")
    return search_artist_recordings(
        artist_mb_id.strip(),
        limit=limit,
        artist_name=artist_name.strip() if artist_name else None,
    )


@router.get("/tracks/search")
@limiter.limit("30/minute")
def search_tracks(
    request: Request,
    title: str = Query(..., min_length=2, max_length=300),
    artist_name: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=25),
    current_user: User = Depends(get_current_user),
    user_id: str | None = Query(default=None, description="Deprecated, ignored. Uses your own profile."),
):
    """Search tracks (Deezer primary, iTunes fallback). Rate-limited to 30/min per IP."""
    # user_id is intentionally ignored: preferred artists always come from
    # the authenticated user to prevent enumerating other users' libraries.
    user = db.query(User).filter(User.id == current_user.id).first()
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
