from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalyticsEventCreate(BaseModel):
    event_name: str = Field(min_length=1, max_length=80)
    payload: Optional[dict[str, Any]] = None


class AnalyticsEventResponse(BaseModel):
    id: int
    event_name: str
    user_id: Optional[int] = None
