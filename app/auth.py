#auth system for pass and login in authentication system

from datetime  import datetime, timedelta , timezone
from jose import JWTError , jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db

#using temp key for now

SECRET_KEY = "vibematch-indev"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#fist for hashing and verfiing password

def hash_password(password:str) -> str:
    return pwd_context.hash(password)

def verify_password(plain:str , hashed: str) -> bool:
    return pwd_context.verify(plain , hashed)

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub" : str(user_id), "exp" : expire }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token or expired")
    
oauth2_secheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(
        token: str = Depends(oauth2_secheme),
        db: Session = Depends(get_db)
):
    from app.models.user import User
    user_id = decode_access_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user