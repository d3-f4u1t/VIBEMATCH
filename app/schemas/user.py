from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator
from datetime import date, datetime


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


class UserProfileResponse(UserResponse):
    date_of_birth: date | None
    pronouns: str | None
    gender: str | None
    sexuality: str | None


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = None
    bio: str | None = None
    location_city: str | None = Field(
        default=None,
        validation_alias=AliasChoices("location_city", "location_city"),
    )
    date_of_birth: date | None = None
    pronouns: str | None = None
    gender: str | None = None
    sexuality: str | None = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date | None):
        if value is None:
            return value

        today = date.today()

        if value > today:
            raise ValueError("Birth date cannot be in the future")

        age = today.year - value.year - (
            (today.month, today.day) < (value.month, value.day)
        )

        if age < 18:
            raise ValueError("User must be at least 18 years old")

        return value

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
       
