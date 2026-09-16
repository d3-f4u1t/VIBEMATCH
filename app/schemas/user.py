from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator
from datetime import date, datetime


class UserCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    bio: str | None = Field(default=None, max_length=500)
    location_city: str | None = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("location_city", "location_city"),
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    bio: str | None
    location_city: str | None
    created_at: datetime


class Habits(BaseModel):
    smoking: str | None = None
    drinking: str | None = None
    weed: str | None = None


class UserProfileResponse(UserResponse):
    date_of_birth: date | None
    pronouns: str | None
    gender: str | None
    sexuality: str | None
    ethnicity: str | None = None
    height: str | None = None
    weight: str | None = None
    z_sign: str | None = None
    f_plan: str | None = None
    pets: str | None = None
    religion: str | None = None
    habit: Habits | None = None
    music_moods: list[str] | None = None
    music_eras: list[str] | None = None
    music_energy: str | None = None
    music_contexts: list[str] | None = None
    age_min: int | None = None
    age_max: int | None = None
    max_distance_km: int | None = None
    intent: str | None = None
    dealbreakers: list[str] | None = None


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=80)
    bio: str | None = Field(default=None, max_length=500)
    location_city: str | None = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("location_city", "location_city"),
    )
    date_of_birth: date | None = None
    pronouns: str | None = Field(default=None, max_length=50)
    gender: str | None = Field(default=None, max_length=50)
    sexuality: str | None = Field(default=None, max_length=50)
    height: str | None = Field(default=None, max_length=20)
    weight: str | None = Field(default=None, max_length=20)
    ethnicity: str | None = Field(default=None, max_length=80)
    z_sign: str | None = Field(default=None, max_length=30)
    f_plan: str | None = Field(default=None, max_length=50)
    pets: str | None = Field(default=None, max_length=100)
    religion: str | None = Field(default=None, max_length=80)
    habit: Habits | None = None
    music_moods: list[str] | None = Field(default=None, max_length=8)
    music_eras: list[str] | None = Field(default=None, max_length=8)
    music_energy: str | None = Field(default=None, max_length=30)
    music_contexts: list[str] | None = Field(default=None, max_length=8)
    age_min: int | None = Field(default=None, ge=18, le=100)
    age_max: int | None = Field(default=None, ge=18, le=100)
    max_distance_km: int | None = Field(default=None, ge=1, le=20000)
    intent: str | None = Field(default=None, max_length=30)
    dealbreakers: list[str] | None = Field(default=None, max_length=10)

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

    @field_validator("age_max")
    @classmethod
    def validate_age_range(cls, v: int | None, info):
        # age_min <= age_max when both set; handled at route level too for PATCH partials
        if v is not None and info.data.get("age_min") is not None and v < info.data["age_min"]:
            raise ValueError("age_max must be >= age_min")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
