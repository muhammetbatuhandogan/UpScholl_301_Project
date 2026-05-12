from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import UserOnboarding
from app.schemas.onboarding_schema import OnboardingState


def _defaults() -> OnboardingState:
    return OnboardingState(
        step=1,
        region="",
        family_size="1",
        has_children="no",
        has_elderly="no",
        completed=False,
    )


def get_onboarding(db: Session, user_id: int) -> OnboardingState:
    row = db.get(UserOnboarding, user_id)
    if row is None:
        return _defaults()
    return OnboardingState(
        step=row.step,
        region=row.region or "",
        family_size=row.family_size or "1",
        has_children=row.has_children or "no",
        has_elderly=row.has_elderly or "no",
        completed=bool(row.completed),
    )


def upsert_onboarding(db: Session, user_id: int, payload: OnboardingState) -> OnboardingState:
    row = db.get(UserOnboarding, user_id)
    if row is None:
        row = UserOnboarding(user_id=user_id)
        db.add(row)
    row.step = payload.step
    row.region = payload.region.strip()
    row.family_size = payload.family_size
    row.has_children = payload.has_children
    row.has_elderly = payload.has_elderly
    row.completed = payload.completed
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return OnboardingState(
        step=row.step,
        region=row.region or "",
        family_size=row.family_size or "1",
        has_children=row.has_children or "no",
        has_elderly=row.has_elderly or "no",
        completed=bool(row.completed),
    )
