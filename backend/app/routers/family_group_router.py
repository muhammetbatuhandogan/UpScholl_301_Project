from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.family_group_schema import (
    FamilyGroupDashboardOut,
    FamilyGroupJoinBody,
    FamilyGroupMemberOut,
    FamilyGroupOut,
)
from app.services.family_group_service import (
    create_group as create_family_group,
    get_dashboard as get_family_group_dashboard,
    join_group as join_family_group,
    leave_group as leave_family_group,
)

router = APIRouter(prefix="/api/family", tags=["family-group"])


@router.post("/group", response_model=FamilyGroupOut, status_code=201)
async def create_group(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyGroupOut:
    try:
        g = create_family_group(db, current_user.id)
    except ValueError as exc:
        if str(exc) == "already_in_group":
            raise HTTPException(status_code=400, detail="User is already in a family group.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FamilyGroupOut.model_validate(g)


@router.post("/group/join", response_model=FamilyGroupOut)
async def join_group(
    payload: FamilyGroupJoinBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyGroupOut:
    try:
        g = join_family_group(db, current_user.id, payload.code)
    except ValueError as exc:
        key = str(exc)
        if key == "invalid_code":
            raise HTTPException(status_code=404, detail="Invalid invite code.") from exc
        if key == "already_in_group":
            raise HTTPException(status_code=400, detail="User is already in a family group.") from exc
        if key == "group_full":
            raise HTTPException(status_code=400, detail="Family group is full (max 5).") from exc
        raise HTTPException(status_code=400, detail=key) from exc
    return FamilyGroupOut.model_validate(g)


@router.get("/group", response_model=FamilyGroupDashboardOut)
async def get_family_group(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyGroupDashboardOut:
    data = get_family_group_dashboard(db, current_user.id)
    if data is None:
        raise HTTPException(status_code=404, detail="Not a member of any family group.")
    members = [FamilyGroupMemberOut(**m) for m in data["members"]]
    return FamilyGroupDashboardOut(
        id=data["id"],
        invite_code=data["invite_code"],
        members=members,
        family_average_score=data["family_average_score"],
        weakest_user_id=data["weakest_user_id"],
    )


@router.delete("/group/leave")
async def leave_family_group(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict:
    try:
        leave_family_group(db, current_user.id)
    except ValueError as exc:
        if str(exc) == "not_in_group":
            raise HTTPException(status_code=404, detail="Not in a family group.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}
