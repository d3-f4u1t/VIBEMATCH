from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/user", response_model=UserResponse,status_code = 201) #201 for created


def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = User(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code = 400, detail= "User creation failed")
    
@router.get("/user/{user_id}/artists")

def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code= 404, detail= "User not found") #404 for not found
    return {
        "user" : user.name,
        "artists" : [
            {
                "name" : a.name,
                "tags" : a.tags
            }
            for a in user.artists
        ]
    }