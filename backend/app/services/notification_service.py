from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import DevicePushToken, NotificationSettings


def register_device(db: Session, user_id: int, token: str, platform: str) -> DevicePushToken:
    token = token.strip()[:512]
    platform = platform.strip().lower()[:20]
    if platform not in ("ios", "android", "web", "expo"):
        raise ValueError("invalid_platform")
    if not token:
        raise ValueError("invalid_token")
    existing = db.scalar(
        select(DevicePushToken).where(
            DevicePushToken.user_id == user_id,
            DevicePushToken.token == token,
        )
    )
    if existing is not None:
        return existing
    row = DevicePushToken(user_id=user_id, token=token, platform=platform)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_or_create_settings(db: Session, user_id: int) -> NotificationSettings:
    row = db.get(NotificationSettings, user_id)
    if row is None:
        row = NotificationSettings(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_settings(db: Session, user_id: int, timezone: str | None, dnd: bool | None) -> NotificationSettings:
    row = get_or_create_settings(db, user_id)
    if timezone is not None:
        row.timezone = timezone.strip()[:64] or row.timezone
    if dnd is not None:
        row.dnd = dnd
    db.commit()
    db.refresh(row)
    return row


def count_tokens(db: Session, user_id: int) -> int:
    return len(list(db.scalars(select(DevicePushToken).where(DevicePushToken.user_id == user_id)).all()))
