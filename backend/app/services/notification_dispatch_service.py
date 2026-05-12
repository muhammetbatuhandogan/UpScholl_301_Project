"""Batch-dispatch scheduled notifications (FR-NOT) with idempotent DB log + Expo push."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import DevicePushToken, NotificationDispatchLog
from app.services.notification_expo_push import send_expo_batch
from app.services.notification_schedule_service import SLOT_MESSAGES, active_slots_for_minute, safe_zoneinfo
from app.services.notification_service import get_or_create_settings

logger = logging.getLogger(__name__)


def run_due_notifications(db: Session) -> dict:
    user_ids = list(db.scalars(select(DevicePushToken.user_id).distinct()))
    new_logs = 0
    skipped_dup = 0
    skipped_dnd = 0
    push_ok = 0
    push_fail = 0

    for uid in user_ids:
        settings = get_or_create_settings(db, uid)
        if settings.dnd:
            skipped_dnd += 1
            continue
        tz = safe_zoneinfo(settings.timezone)
        local_now = datetime.now(timezone.utc).astimezone(tz)
        local_day = local_now.date().isoformat()
        slots = active_slots_for_minute(local_now)
        if not slots:
            continue

        tokens = list(
            db.scalars(select(DevicePushToken.token).where(DevicePushToken.user_id == uid)).all()
        )
        for slot in slots:
            if slot not in SLOT_MESSAGES:
                continue
            title, body = SLOT_MESSAGES[slot]
            row = NotificationDispatchLog(
                user_id=uid,
                slot_kind=slot,
                local_day=local_day,
                title=title,
                body=body,
                push_attempted=False,
            )
            db.add(row)
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                skipped_dup += 1
                continue

            try:
                ok, detail = send_expo_batch(tokens, title, body)
            except Exception as exc:
                ok = False
                detail = str(exc)[:300]
            row.push_attempted = True
            row.push_detail = (detail or "")[:300] if detail else None
            db.commit()
            new_logs += 1
            if ok:
                push_ok += 1
            else:
                push_fail += 1

    summary = {
        "users_with_devices": len(user_ids),
        "new_dispatch_logs": new_logs,
        "skipped_duplicate": skipped_dup,
        "skipped_dnd": skipped_dnd,
        "push_batches_ok": push_ok,
        "push_batches_failed": push_fail,
    }
    logger.info("run_due_notifications", extra=summary)
    return summary
