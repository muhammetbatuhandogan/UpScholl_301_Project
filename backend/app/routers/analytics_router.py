from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics_schema import AnalyticsEventCreate, AnalyticsEventResponse
from app.services.analytics_service import record_event
from app.services.auth_service import get_user_from_token

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/events", response_model=AnalyticsEventResponse, status_code=201)
async def post_analytics_event(
    body: AnalyticsEventCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(default=""),
) -> AnalyticsEventResponse:
    user_id = None
    if authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "", 1).strip()
        user = get_user_from_token(db, token)
        if user is not None:
            user_id = user.id
    row = record_event(
        db,
        event_name=body.event_name,
        payload=body.payload,
        user_id=user_id,
    )
    return AnalyticsEventResponse(
        id=row.id, event_name=row.event_name, user_id=row.user_id
    )
