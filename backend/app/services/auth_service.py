from typing import Optional
from uuid import uuid4

import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AccessToken, User
from app.schemas.auth_schema import LoginInput, LoginResponse, UserProfile


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

    token_str = f"upscholl_{uuid4().hex}"
    db.add(AccessToken(token=token_str, user_id=user.id))
    db.commit()

    return LoginResponse(
        access_token=token_str,
        user=UserProfile.model_validate(user),
    )


def get_user_from_token(db: Session, access_token: str) -> Optional[UserProfile]:
    row = db.scalar(select(AccessToken).where(AccessToken.token == access_token))
    if row is None:
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
