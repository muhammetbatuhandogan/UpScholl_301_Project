from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schema import LoginInput, LoginResponse, UserProfile
from app.services.auth_service import authenticate_user, get_user_from_token, revoke_token

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


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return current_user


@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    _current_user: UserProfile = Depends(get_current_user),
    authorization: str = Header(default=""),
) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    access_token = authorization.replace("Bearer ", "", 1).strip()
    revoke_token(db, access_token)
    return {"ok": True}
