from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.score_schema import ScoreOut, ScoreUpsertBody
from app.services.score_service import get_score, upsert_score

router = APIRouter(prefix="/api/score", tags=["score"])


@router.get("", response_model=ScoreOut)
async def read_score(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScoreOut:
    row = get_score(db, current_user.id)
    if row is None:
        return ScoreOut(
            user_id=current_user.id,
            total_score=0,
            breakdown=None,
            updated_at=datetime.now(timezone.utc),
        )
    return ScoreOut.model_validate(row)


@router.put("", response_model=ScoreOut)
async def write_score(
    payload: ScoreUpsertBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScoreOut:
    try:
        row = upsert_score(db, current_user.id, payload.total_score, payload.breakdown)
    except ValueError as exc:
        if str(exc) == "score_range":
            raise HTTPException(status_code=400, detail="total_score must be 0..100.") from exc
        raise
    return ScoreOut.model_validate(row)
