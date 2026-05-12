from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FamilyGroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invite_code: str
    leader_user_id: int


class FamilyGroupJoinBody(BaseModel):
    code: str = Field(min_length=6, max_length=12)


class FamilyGroupMemberOut(BaseModel):
    user_id: int
    username: str
    total_score: int
    is_leader: bool


class FamilyGroupDashboardOut(BaseModel):
    id: int
    invite_code: str
    members: list[FamilyGroupMemberOut]
    family_average_score: float
    weakest_user_id: int
