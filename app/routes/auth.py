'''will handle auth/reg and auth/login'''

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    AccessTokenResponse,
    UserCreate,
    UserResponse,
    TokenResponse,
)
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags= ["auth"])

@router.post("/register", response_model= TokenResponse, status_code= 201)
def register(data: UserCreate, db: Session= Depends(get_db)):

    #checks for email token
    existing = db.query(User).filter(User.email ==  data.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="email already registered")
    
    #for passvalidation len()

    if len(data.password) < 6:
        raise HTTPException(
            status_code= 400,
            detail= "Password must be at lest 6 char long"
        )
    
    try:
        user = User(
            name = data.name,
            email = data.email,
            password_hash = hash_password(data.password),
            bio = data.bio or "",
            location_city = data.location_city or ""
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)

        return {"access_token": token, "token_type": "bearer", "user" : user}
    
    except Exception:
        db.rollback()
        raise HTTPException(status_code= 400, detail= "registration failed")
    
@router.post("/login", response_model=AccessTokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db:Session = Depends(get_db)
):
    #finds user by Mail
    email = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    #error is kept constant for both pass and email in validations
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code= 401,
            detail = "incorrect email or password"
        )
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model= UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
