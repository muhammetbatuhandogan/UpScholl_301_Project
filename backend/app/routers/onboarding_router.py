from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.onboarding_schema import OnboardingState
from app.services.onboarding_service import get_onboarding, upsert_onboarding

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.get("", response_model=OnboardingState)
async def read_onboarding(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> OnboardingState:
    return get_onboarding(db, current_user.id)


@router.put("", response_model=OnboardingState)
async def write_onboarding(
    body: OnboardingState,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> OnboardingState:
    return upsert_onboarding(db, current_user.id, body)
