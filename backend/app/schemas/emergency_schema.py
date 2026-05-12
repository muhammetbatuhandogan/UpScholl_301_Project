from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class SosContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    sort_order: int


class SosContactInput(BaseModel):
    name: str = Field(max_length=80)
    phone: str = Field(max_length=20)


class SosContactsPutBody(BaseModel):
    contacts: list[SosContactInput] = Field(default_factory=list, max_length=3)


class SosTriggerBody(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SosEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: str
    recipients: list[Any]
    attempts: int
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GuideVersionOut(BaseModel):
    version: str
    manifest: dict[str, Any]
