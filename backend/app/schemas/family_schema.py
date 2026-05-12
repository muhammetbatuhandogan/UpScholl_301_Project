from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FamilyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    role: str = Field(default="Member", max_length=40)
    score: int = Field(default=50, ge=0, le=100)


class FamilyMemberUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    role: str = Field(default="Member", max_length=40)
    score: int = Field(ge=0, le=100)


class FamilyMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str
    score: int
    created_at: datetime


class FamilyMemberListResponse(BaseModel):
    items: list[FamilyMemberOut]
