from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from app.schemas.auth_schema import LoginInput, LoginResponse, UserProfile

_demo_user = UserProfile(
    id=1,
    username="demo",
    created_at=datetime.now(timezone.utc),
)

_access_tokens: dict = {}


def authenticate_user(payload: LoginInput) -> Optional[LoginResponse]:
    is_valid_demo_username = payload.username.strip() == "demo"
    is_valid_demo_password = payload.password == "demo123"
    if not is_valid_demo_username or not is_valid_demo_password:
        return None

    access_token = f"upscholl_{uuid4().hex}"
    _access_tokens[access_token] = _demo_user
    return LoginResponse(access_token=access_token, user=_demo_user)


def get_user_from_token(access_token: str) -> Optional[UserProfile]:
    if not access_token:
        return None
    return _access_tokens.get(access_token)
