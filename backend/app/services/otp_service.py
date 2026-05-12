import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_otp_debug
from app.db.models import OtpSession, User
from app.schemas.auth_schema import LoginResponse
from app.services.auth_service import issue_access_token_response
from app.services.netgsm_sms import netgsm_configured, send_sms_sync

_PHONE_RE = re.compile(r"^\+[0-9]{10,18}$")


def normalize_phone(phone: str) -> str:
    raw = phone.strip().replace(" ", "")
    if not _PHONE_RE.match(raw):
        raise ValueError("invalid_phone")
    return raw


def request_otp(db: Session, phone: str) -> Optional[str]:
    phone_n = normalize_phone(phone)
    now = datetime.now(timezone.utc)
    recent = db.scalars(
        select(OtpSession)
        .where(OtpSession.phone == phone_n)
        .order_by(OtpSession.id.desc())
        .limit(1)
    ).first()
    if recent is not None and recent.created_at > now - timedelta(seconds=55):
        raise ValueError("rate_limited")

    db.execute(delete(OtpSession).where(OtpSession.phone == phone_n))
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    code_hash = bcrypt.hashpw(code.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    expires_at = now + timedelta(minutes=5)
    row = OtpSession(
        phone=phone_n,
        code_hash=code_hash,
        expires_at=expires_at,
        attempts_remaining=3,
    )
    db.add(row)
    db.commit()
    if get_otp_debug():
        return code
    if netgsm_configured():
        send_sms_sync(phone_n, f"UpScholl dogrulama kodunuz: {code}")
    return None


def verify_otp(db: Session, phone: str, code: str) -> LoginResponse:
    phone_n = normalize_phone(phone)
    if not code.isdigit() or len(code) != 6:
        raise ValueError("invalid_code")
    now = datetime.now(timezone.utc)
    row = db.scalars(
        select(OtpSession)
        .where(OtpSession.phone == phone_n)
        .order_by(OtpSession.id.desc())
        .limit(1)
    ).first()
    if row is None:
        raise ValueError("no_session")
    if row.expires_at < now:
        raise ValueError("expired")
    if row.attempts_remaining <= 0:
        raise ValueError("locked")

    if not bcrypt.checkpw(code.encode("utf-8"), row.code_hash.encode("utf-8")):
        row.attempts_remaining -= 1
        db.commit()
        raise ValueError("wrong_code")

    db.execute(delete(OtpSession).where(OtpSession.phone == phone_n))
    db.commit()

    user = db.scalar(select(User).where(User.phone == phone_n))
    if user is None:
        username = f"u{secrets.token_hex(10)}"
        while db.scalar(select(User.id).where(User.username == username)):
            username = f"u{secrets.token_hex(10)}"
        placeholder = bcrypt.hashpw(secrets.token_bytes(24), bcrypt.gensalt()).decode("utf-8")
        user = User(username=username, password_hash=placeholder, phone=phone_n)
        db.add(user)
        db.commit()
        db.refresh(user)

    return issue_access_token_response(db, user)
