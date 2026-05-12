from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginInput(BaseModel):
    username: str = Field(min_length=3, max_length=60)
    password: str = Field(min_length=6, max_length=120)


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
