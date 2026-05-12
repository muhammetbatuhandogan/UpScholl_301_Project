import threading
import time
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import SosContact, SosEvent, User
from app.services.netgsm_sms import send_sms_sync


def list_contacts(db: Session, user_id: int) -> list[SosContact]:
    return list(
        db.scalars(
            select(SosContact)
            .where(SosContact.user_id == user_id)
            .order_by(SosContact.sort_order.asc())
        ).all()
    )


def replace_contacts(db: Session, user_id: int, contacts: list[dict[str, Any]]) -> list[SosContact]:
    if len(contacts) > 3:
        raise ValueError("max_contacts")
    db.execute(delete(SosContact).where(SosContact.user_id == user_id))
    for i, c in enumerate(contacts):
        name = str(c.get("name", "")).strip()[:80]
        phone = str(c.get("phone", "")).strip()[:20]
        if not name or not phone:
            raise ValueError("invalid_contact")
        db.add(SosContact(user_id=user_id, name=name, phone=phone, sort_order=i))
    db.commit()
    return list_contacts(db, user_id)


def _build_message(user: User, lat: Optional[float], lon: Optional[float]) -> str:
    loc = "konum bilinmiyor"
    if lat is not None and lon is not None:
        loc = f"{lat:.5f},{lon:.5f}"
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return f"[{user.username}] yardim istiyor (deprem/hazirlik SOS). Konum: {loc}. Zaman: {ts}"


def _dispatch_once(db: Session, ev: SosEvent) -> bool:
    """Send SMS to all recipients. Returns True if at least one SMS accepted by provider."""
    any_ok = False
    errors: list[str] = []
    for r in ev.recipients:
        phone = str(r.get("phone", "")).strip()
        ok, detail = send_sms_sync(phone, ev.message)
        if ok:
            any_ok = True
        else:
            errors.append(detail[:120])
    ev.attempts += 1
    now = datetime.now(timezone.utc)
    ev.updated_at = now
    ev.last_error = "; ".join(errors)[:500] if errors else None
    if any_ok:
        ev.status = "sent"
    elif ev.attempts >= 4:
        ev.status = "failed"
    else:
        ev.status = "pending"
    db.commit()
    return any_ok


def _retry_worker(event_id: int) -> None:
    from app.db.session import SessionLocal

    for _ in range(3):
        time.sleep(30)
        db = SessionLocal()
        try:
            ev = db.get(SosEvent, event_id)
            if ev is None or ev.status == "sent":
                return
            if ev.attempts >= 4:
                return
            _dispatch_once(db, ev)
            if ev.status == "sent":
                return
        finally:
            db.close()


def create_sos_event(
    db: Session,
    user_id: int,
    latitude: Optional[float],
    longitude: Optional[float],
) -> SosEvent:
    user = db.get(User, user_id)
    if user is None:
        raise ValueError("no_user")
    contacts = list_contacts(db, user_id)
    if not contacts:
        raise ValueError("no_contacts")
    recipients = [{"name": c.name, "phone": c.phone} for c in contacts]
    msg = _build_message(user, latitude, longitude)
    ev = SosEvent(
        user_id=user_id,
        status="pending",
        latitude=latitude,
        longitude=longitude,
        message=msg,
        recipients=recipients,
        attempts=0,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    _dispatch_once(db, ev)
    db.refresh(ev)
    if ev.status == "pending" and ev.attempts < 4:
        threading.Thread(target=_retry_worker, args=(ev.id,), daemon=True).start()
    return ev


def list_events(db: Session, user_id: int, limit: int = 50) -> list[SosEvent]:
    return list(
        db.scalars(
            select(SosEvent)
            .where(SosEvent.user_id == user_id)
            .order_by(SosEvent.id.desc())
            .limit(limit)
        ).all()
    )
