from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import BagItemState


def list_items(db: Session, user_id: int) -> list[BagItemState]:
    return list(db.scalars(select(BagItemState).where(BagItemState.user_id == user_id)).all())


def sync_items(db: Session, user_id: int, items: list[tuple[str, bool]]) -> list[BagItemState]:
    for key, checked in items:
        key = key.strip()[:80]
        if not key:
            continue
        row = db.scalar(
            select(BagItemState).where(
                BagItemState.user_id == user_id,
                BagItemState.item_key == key,
            )
        )
        if row is None:
            row = BagItemState(user_id=user_id, item_key=key, checked=checked)
            db.add(row)
        else:
            row.checked = checked
            row.updated_at = datetime.now(timezone.utc)
    db.commit()
    return list_items(db, user_id)
