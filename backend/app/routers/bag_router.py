from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.bag_schema import BagItemStateOut, BagListResponse, BagSyncBody
from app.services.bag_service import list_items, sync_items

router = APIRouter(prefix="/api/bag", tags=["bag"])


@router.get("/items", response_model=BagListResponse)
async def get_bag_items(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> BagListResponse:
    rows = list_items(db, current_user.id)
    return BagListResponse(items=[BagItemStateOut.model_validate(r) for r in rows])


@router.put("/items", response_model=BagListResponse)
async def put_bag_items(
    payload: BagSyncBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> BagListResponse:
    pairs = [(i.item_key, i.checked) for i in payload.items]
    rows = sync_items(db, current_user.id, pairs)
    return BagListResponse(items=[BagItemStateOut.model_validate(r) for r in rows])
