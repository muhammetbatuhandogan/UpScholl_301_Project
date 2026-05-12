from typing import Any, Optional

from sqlalchemy.orm import Session

from app.db.models import AnalyticsEvent


def record_event(
    db: Session,
    *,
    event_name: str,
    payload: Optional[dict[str, Any]],
    user_id: Optional[int],
) -> AnalyticsEvent:
    row = AnalyticsEvent(
        user_id=user_id,
        event_name=event_name.strip(),
        payload=payload,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
