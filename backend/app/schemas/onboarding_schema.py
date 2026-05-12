from pydantic import BaseModel, Field


class OnboardingState(BaseModel):
    step: int = Field(ge=1, le=3)
    region: str = Field(max_length=120, default="")
    family_size: str = Field(default="1", max_length=10)
    has_children: str = Field(default="no", max_length=10)
    has_elderly: str = Field(default="no", max_length=10)
    completed: bool = False
