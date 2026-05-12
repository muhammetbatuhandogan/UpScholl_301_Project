from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LoginInput(BaseModel):
    username: str = Field(min_length=3, max_length=60)
    password: str = Field(min_length=6, max_length=120)


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    phone: Optional[str] = None
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"
    user: UserProfile


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=128)
