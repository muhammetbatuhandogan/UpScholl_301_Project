from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import UserReadinessScore


def get_score(db: Session, user_id: int) -> Optional[UserReadinessScore]:
    return db.get(UserReadinessScore, user_id)


def upsert_score(db: Session, user_id: int, total_score: int, breakdown: Optional[dict[str, Any]]) -> UserReadinessScore:
    if total_score < 0 or total_score > 100:
        raise ValueError("score_range")
    row = db.get(UserReadinessScore, user_id)
    if row is None:
        row = UserReadinessScore(user_id=user_id, total_score=total_score, breakdown=breakdown)
        db.add(row)
    else:
        row.total_score = total_score
        row.breakdown = breakdown
        row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row
