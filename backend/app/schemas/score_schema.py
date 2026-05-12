from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    total_score: int
    breakdown: Optional[dict[str, Any]] = None
    updated_at: datetime


class ScoreUpsertBody(BaseModel):
    total_score: int = Field(ge=0, le=100)
    breakdown: Optional[dict[str, Any]] = None
