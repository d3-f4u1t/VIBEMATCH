from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.models.artist import Artist
from app.schemas.user import UserCreate, UserResponse
from app.schemas.artist import ArtistCreate, ArtistResponse
from app.auth import get_current_user

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

def add_artist_to_user(
    user_id : int,
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
        current_user.artists.append(artist)
        db.commit()


        return {"message": f"Artist {artist.name} added to user {current_user.name}"}
    
    @router.get("/user/{user_id}/artists")
    def get_user_artists(user_id: int, db: Session= Depends(get_db)):
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
