from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    email: EmailStr #for email validation // might even use just str
    password: str #is plain text (Hashed)
    bio: str | None = None
    location_city: str | None = Field(
        default=None,
        validation_alias=AliasChoices("location_city", "location_city"),
    )

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id : str
    name : str
    email : EmailStr
    bio : str | None
    location_city: str | None
    created_at : datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponce(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
       
