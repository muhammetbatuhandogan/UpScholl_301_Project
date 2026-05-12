from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_access_token_ttl_seconds, get_refresh_token_ttl_days
from app.db.models import AccessToken, RefreshToken, User
from app.schemas.auth_schema import LoginInput, LoginResponse, UserProfile


def issue_access_token_response(db: Session, user: User) -> LoginResponse:
    now = datetime.now(timezone.utc)
    access_str = f"upscholl_{uuid4().hex}"
    refresh_str = f"rfs_{uuid4().hex}{uuid4().hex}"[:128]
    access_ttl = timedelta(seconds=get_access_token_ttl_seconds())
    refresh_ttl = timedelta(days=get_refresh_token_ttl_days())
    db.add(
        AccessToken(
            token=access_str,
            user_id=user.id,
            expires_at=now + access_ttl,
        )
    )
    db.add(
        RefreshToken(
            token=refresh_str,
            user_id=user.id,
            expires_at=now + refresh_ttl,
        )
    )
    db.commit()
    return LoginResponse(
        access_token=access_str,
        refresh_token=refresh_str,
        expires_in=int(access_ttl.total_seconds()),
        user=UserProfile.model_validate(user),
    )


def authenticate_user(db: Session, payload: LoginInput) -> Optional[LoginResponse]:
    username = payload.username.strip()
    user = db.scalar(select(User).where(User.username == username))
    if user is None:
        return None
    if not bcrypt.checkpw(
        payload.password.encode("utf-8"),
        user.password_hash.encode("utf-8"),
    ):
        return None

    return issue_access_token_response(db, user)


def get_user_from_token(db: Session, access_token: str) -> Optional[UserProfile]:
    row = db.scalar(select(AccessToken).where(AccessToken.token == access_token))
    if row is None:
        return None
    now = datetime.now(timezone.utc)
    if row.expires_at is not None and row.expires_at < now:
        return None
    user = db.get(User, row.user_id)
    if user is None:
        return None
    return UserProfile.model_validate(user)


def revoke_token(db: Session, access_token: str) -> bool:
    row = db.scalar(select(AccessToken).where(AccessToken.token == access_token))
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


def refresh_with_token(db: Session, refresh_token: str) -> Optional[LoginResponse]:
    now = datetime.now(timezone.utc)
    row = db.scalar(select(RefreshToken).where(RefreshToken.token == refresh_token))
    if row is None or row.revoked_at is not None or row.expires_at < now:
        return None
    user = db.get(User, row.user_id)
    if user is None:
        return None
    row.revoked_at = now
    db.commit()
    return issue_access_token_response(db, user)


def revoke_all_refresh_tokens_for_user(db: Session, user_id: int) -> None:
    rows = db.scalars(select(RefreshToken).where(RefreshToken.user_id == user_id)).all()
    now = datetime.now(timezone.utc)
    for r in rows:
        if r.revoked_at is None:
            r.revoked_at = now
    db.commit()
