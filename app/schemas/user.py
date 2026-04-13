from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr #for email validation // might even use just str
    bio: str | None = None
    loaction_city: str | None = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes= True)
    id : int
    name : str
    email : EmailStr
    bio : str | None
    location_city: str | None
    created_at : datetime

    class Config:
        from_attributes = True

