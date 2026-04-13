from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.musicbrainz import search_artist
from app.models.artist import Artist

router = APIRouter()

def add_artist(user_id : str, name : str, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code= 404, detail= "User not found")
        
        #serching for the artist in api 

        data = search_artist(name)

        if not data.get("artists"):
            raise HTTPException(status_code=404, detail= "Artist not found")
        
        a = data["artist"][0]

        #check if already there

        artist = db.query(Artist).filter(Artist.mb_id == a["id"]).first()

        if not artist:
            artist = Artist(
                mb_id = a["id"],
                name = a["name"],
                country = a.get("country"),
                tags = [t["name"] for t in a.get("tags", [])]

            )

            db.add(artist)
            db.commit()
            db.refresh(artist)

        #link user and artist

        if artist not in user.artists:
            user.artists.append(artist)
            db.commit()

        return {"message" : "artist added","artist" : artist.name}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="failed to add artist")
    
    