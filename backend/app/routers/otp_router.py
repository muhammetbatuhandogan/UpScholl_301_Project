from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth_schema import LoginResponse
from app.schemas.otp_schema import OtpRequestBody, OtpRequestResponse, OtpVerifyBody
from app.services.otp_service import request_otp, verify_otp

router = APIRouter(prefix="/api/auth/otp", tags=["auth-otp"])

_ERR_STATUS = {
    "invalid_phone": 400,
    "invalid_code": 400,
    "wrong_code": 400,
    "no_session": 400,
    "expired": 400,
    "locked": 400,
    "rate_limited": 429,
}


def _handle_otp_error(exc: ValueError) -> HTTPException:
    key = str(exc.args[0]) if exc.args else "unknown"
    status = _ERR_STATUS.get(key, 400)
    messages = {
        "invalid_phone": "Invalid phone format. Use E.164, e.g. +905551234567.",
        "rate_limited": "Please wait about one minute before requesting another code.",
        "wrong_code": "Invalid verification code.",
        "no_session": "No active verification session for this phone.",
        "expired": "Verification code expired.",
        "locked": "Too many failed attempts. Request a new code.",
        "invalid_code": "Code must be exactly 6 digits.",
    }
    return HTTPException(
        status_code=status,
        detail=messages.get(key, key),
    )


@router.post("/request", response_model=OtpRequestResponse)
async def otp_request(payload: OtpRequestBody, db: Session = Depends(get_db)) -> OtpRequestResponse:
    try:
        debug_code = request_otp(db, payload.phone)
    except ValueError as exc:
        raise _handle_otp_error(exc) from exc
    return OtpRequestResponse(debug_code=debug_code)


@router.post("/verify", response_model=LoginResponse)
async def otp_verify(payload: OtpVerifyBody, db: Session = Depends(get_db)) -> LoginResponse:
    try:
        return verify_otp(db, payload.phone, payload.code)
    except ValueError as exc:
        raise _handle_otp_error(exc) from exc
