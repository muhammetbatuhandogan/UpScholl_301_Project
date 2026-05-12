from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schema import LoginInput, LoginResponse, RefreshRequest, UserProfile
from app.services.auth_service import (
    authenticate_user,
    get_user_from_token,
    refresh_with_token,
    revoke_all_refresh_tokens_for_user,
    revoke_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str = Header(default=""),
) -> UserProfile:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    access_token = authorization.replace("Bearer ", "", 1).strip()
    user = get_user_from_token(db, access_token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginInput, db: Session = Depends(get_db)) -> LoginResponse:
    login_response = authenticate_user(db, payload)
    if login_response is None:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return login_response


@router.post("/refresh", response_model=LoginResponse)
async def refresh_session(payload: RefreshRequest, db: Session = Depends(get_db)) -> LoginResponse:
    out = refresh_with_token(db, payload.refresh_token.strip())
    if out is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")
    return out


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return current_user


@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
    authorization: str = Header(default=""),
) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    access_token = authorization.replace("Bearer ", "", 1).strip()
    revoke_token(db, access_token)
    return {"ok": True}


@router.post("/logout-all")
async def logout_all_devices(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
    authorization: str = Header(default=""),
) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    access_token = authorization.replace("Bearer ", "", 1).strip()
    revoke_token(db, access_token)
    revoke_all_refresh_tokens_for_user(db, current_user.id)
    return {"ok": True, "revoked_refresh": True}
