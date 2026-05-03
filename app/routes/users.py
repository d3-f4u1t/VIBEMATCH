from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.models.artist import Artist
from app.models.track import Track
from app.schemas.user import UserCreate, UserResponse
from app.schemas.artist import ArtistCreate
from app.schemas.track import TrackCreate
from app.auth import get_current_user
from app.services.vector import build_and_save_vector

router = APIRouter(tags= ["users"])


@router.post("/user", response_model=UserResponse,status_code = 201) #201 for created


def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code= 400, detail = "Email is already registered")
    try:
        db_user = User(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"User creation failed: {e.orig}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"User creation failed: {str(e)}")
    
@router.get("/user/{user_id}",response_model= UserResponse)

def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code= 404, detail= "User not found") #404 for not found
    return user

@router.post("/user/{user_id}/add_artist", status_code=201)

def add_artist_to_user(#this is used to add artist to user id for music vector
    user_id : str,
    data: ArtistCreate,
    db: Session = Depends(get_db),
    current_user : User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code= 403, detail="not allowed")
    
    
    #check if artist is in db
    '''if not we add em in the database '''

    artist = db.query(Artist).filter(Artist.mb_id == data.mb_id).first()
    if not artist:
        artist = Artist(**data.model_dump())
        db.add(artist)
        db.commit()
        db.refresh(artist)

    #check if user already has that perticuler astist
    if artist in current_user.artists:
        raise HTTPException(status_code= 400, detail= "artist already added to your account")
    
    #link artist to user/account

    if len(current_user.artists) >= 5:
        raise HTTPException(
            status_code= 400,
            detail= "You can only select up to 5 artists"
        )
    

    current_user.artists.append(artist)
    db.commit()
    build_and_save_vector(current_user, db)

    return {"message": f"Artist {artist.name} added to user {current_user.name} and vector updated"}

@router.get("/user/{user_id}/artists")
def get_user_artists(user_id: str, db: Session= Depends(get_db)):
    user = db.query(User).filter(User.id ==  user_id).first()

    if not user:
        raise HTTPException(status_code= 404, detail= "user not found")

    #create artist if not already there 
    return{
        "user_id" : user_id,
        "name" : user.name,
        "artists" : [
            {
                "mb_id" : a.mb_id, "name" : a.name, "tags" : a.tags
            }
            for a in user.artists
        ]
    }


@router.post("/user/{user_id}/add_track", status_code=201)
def add_track_to_user( #this is usedd to add to tracks to user id
    user_id: str,
    data: TrackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="not allowed")

    track = db.query(Track).filter(Track.mb_id == data.mb_id).first()
    if not track:
        track = Track(**data.model_dump())
        db.add(track)
        db.commit()
        db.refresh(track)

    if track in current_user.tracks:
        raise HTTPException(status_code=400, detail="track already added to your account")
    if len(current_user.tracks) >= 7:
        raise HTTPException(
            status_code= 400,
            detail= "you can only select up to 7 song"
        )

    current_user.tracks.append(track)
    db.commit()
    build_and_save_vector(current_user, db)

    return {"message": f"Track {track.title} added to user {current_user.name} and vector updated"}


@router.get("/user/{user_id}/tracks")
def get_user_tracks(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    return {
        "user_id": user_id,
        "name": user.name,
        "tracks": [
            {
                "mb_id": t.mb_id,
                "artist_mb_id": t.artist_mb_id,
                "artist_name": t.artist_name,
                "title": t.title,
                "release_title": t.release_title,
                "length_ms": t.length_ms,
            }
            for t in user.tracks
        ],
    }


@router.get("/user/{user_id}/vector")
def get_user_vector(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    if not user.music_vector:
        raise HTTPException(
            status_code=404,
            detail="No vector yet add artists and tracks first",
        )

    return {
        "user_id": user_id,
        "vector_length": len(user.music_vector),
        "vector_preview": user.music_vector[:8],
        "has_vector": True,
    }


#music profile code

@router.get("/user/{user_id}/music-profile-status")
def get_music_profile_status(user_id: str, db: Session = Depends(get_db)):
    user= db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code= 404, detail="user not found")
    
    artist_count = len(user.artists)
    track_count = len(user.tracks)

    min_artists = 3
    max_artists = 5
    min_tracks = 4
    max_tracks = 7

    return {
        "user_id" : user_id,
        "artist_count": artist_count,
        "track_count": track_count,
        "artist_rules": {
            "min" : min_artists,
            "max": max_artists,
        },
        "track_rules": {
            "min": min_tracks,
            "max": max_tracks
        },
        "artists_complete": artist_count >=min_artists,
        "tracks_complete":track_count >= min_tracks,
        "music_profile_complete": artist_count >= min_artists and track_count >= min_tracks,
        "artists_rem_to_min": max(0, min_artists - artist_count),
        "tracks_rem_to_min": max(0, min_tracks- track_count),
        "artists_slots_left":max(0, max_artists - artist_count),
        "track_slots_left": max(0, max_tracks - track_count),
    }


'''to remove the artist from the user'''
@router.delete("/user/{user_id}/artists/{artist_mb_id}")
def remove_artist_from_user(
    user_id : str,
    artist_mb_id: str,
    db: Session= Depends(get_db),
    current_user: User = Depends(get_current_user)

):
    if current_user.id != user_id:
        raise HTTPException(status_code= 403,detail=" not allowed")
    
    #cross check if the artist is in the db
    artist = db.query(Artist).filter(Artist.mb_id == artist_mb_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    #to verify ifits linked to the user

    if artist not in current_user.artists:
        raise HTTPException(status_code=400, detail="artist not associated with your account")
    
    #to remove that relationship

    current_user.artists.remove(artist)
    db.commit()

    #now after that is removed to rebuld the vector from the new raw data

    build_and_save_vector(current_user, db)

    return {"message": f"Artist {artist.name} removed from user {current_user.name} and vector updated"}

'''to remove the track fromthe user'''
@router.delete("/user/{user_id}/tracks/{track_mb_id}")

def remove_track_from_user(
    user_id: str,
    track_mb_id: str,
    db: Session = Depends(get_db),
    current_user: User =Depends(get_current_user)

):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    #find the track in the db

    track = db.query(Track).filter(Track.mb_id == track_mb_id).first()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    #to checl if it is linked to the user
    if track not in current_user.tracks:
        raise HTTPException(status_code=400, detail="Track not associasted")
    #remove the relationship
    current_user.tracks.remove(track)
    db.commit()

    #rebuild the vector

    build_and_save_vector(current_user,db)

    return {"message": f"Track {track.title} removed from the user {current_user.name} and vector updated"}


    
