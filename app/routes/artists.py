# app/routes/artists.py
from fastapi import APIRouter, HTTPException
from app.services.musicbrainz import search_artist

router = APIRouter(tags=["artists"])

@router.get("/search")
def search(name: str):
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search term too short")
    return search_artist(name)