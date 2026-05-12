from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.family_schema import (
    FamilyMemberCreate,
    FamilyMemberListResponse,
    FamilyMemberOut,
    FamilyMemberUpdate,
)
from app.services.family_service import (
    add_member,
    delete_member,
    list_members,
    update_member,
)

router = APIRouter(prefix="/api/family/members", tags=["family"])


@router.get("", response_model=FamilyMemberListResponse)
async def list_members(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyMemberListResponse:
    rows = list_members(db, current_user.id)
    return FamilyMemberListResponse(items=[FamilyMemberOut.model_validate(r) for r in rows])


@router.post("", response_model=FamilyMemberOut, status_code=201)
async def create_member(
    payload: FamilyMemberCreate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyMemberOut:
    try:
        row = add_member(db, current_user.id, payload)
    except ValueError as exc:
        if str(exc) == "max_members":
            raise HTTPException(
                status_code=400, detail="Maximum 5 family members per account."
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FamilyMemberOut.model_validate(row)


@router.put("/{member_id}", response_model=FamilyMemberOut)
async def update_member(
    member_id: int,
    payload: FamilyMemberUpdate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FamilyMemberOut:
    row = update_member(db, current_user.id, member_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Member not found.")
    return FamilyMemberOut.model_validate(row)


@router.delete("/{member_id}")
async def remove_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict:
    ok = delete_member(db, current_user.id, member_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found.")
    return {"deleted": True, "id": member_id}
