"""Auth routes: registration, login, and token issuance."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.user import User
from app.schemas.user import (
    AccessTokenResponse,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger("vibematch.auth")

# Minimum password length enforced on registration
_MIN_PASSWORD_LEN = 8


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Rate-limited to 10 attempts per minute per IP."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password) < _MIN_PASSWORD_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {_MIN_PASSWORD_LEN} characters long",
        )

    try:
        user = User(
            name=data.name,
            email=data.email.strip().lower(),
            password_hash=hash_password(data.password),
            bio=data.bio or "",
            location_city=data.location_city or "",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer", "user": user}

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("registration failed")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password. Rate-limited to 20 attempts per minute per IP."""
    email = data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/token", response_model=AccessTokenResponse)
@limiter.limit("20/minute")
def issue_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2-compatible token endpoint. Rate-limited to 20 attempts per minute per IP."""
    email = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
