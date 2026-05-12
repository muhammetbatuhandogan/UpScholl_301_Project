import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import get_cron_secret
from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.notification_schema import (
    DevicePushOut,
    DeviceRegisterBody,
    NotificationSchedulePreviewOut,
    NotificationSettingsOut,
    NotificationSettingsPutBody,
    NotificationTestBody,
    NotificationTestOut,
    RunDueOut,
    ScheduleSlotPreview,
)
from app.services.notification_dispatch_service import run_due_notifications
from app.services.notification_schedule_service import SLOT_MESSAGES, next_slot_datetimes
from app.services.notification_service import (
    count_tokens,
    get_or_create_settings,
    register_device,
    update_settings,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/schedule", response_model=NotificationSchedulePreviewOut)
async def notification_schedule_preview(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> NotificationSchedulePreviewOut:
    settings = get_or_create_settings(db, current_user.id)
    slots: list[ScheduleSlotPreview] = []
    for slot_kind, (title, body) in SLOT_MESSAGES.items():
        upcoming = next_slot_datetimes(settings.timezone, slot_kind, count=3)
        slots.append(
            ScheduleSlotPreview(
                slot_kind=slot_kind,
                title=title,
                body=body,
                next_local_iso=[d.isoformat() for d in upcoming],
            )
        )
    return NotificationSchedulePreviewOut(timezone=settings.timezone, slots=slots)


@router.post("/run-due", response_model=RunDueOut)
async def notification_run_due_cron(
    db: Session = Depends(get_db),
    x_internal_cron: str = Header(default="", alias="X-Internal-Cron"),
) -> RunDueOut:
    secret = get_cron_secret()
    if not secret:
        raise HTTPException(
            status_code=503,
            detail="CRON_SECRET is not set; scheduled dispatch endpoint is disabled.",
        )
    if len(x_internal_cron) != len(secret) or not secrets.compare_digest(x_internal_cron, secret):
        raise HTTPException(status_code=401, detail="Invalid cron secret.")
    return RunDueOut.model_validate(run_due_notifications(db))
@router.post("/devices", response_model=DevicePushOut, status_code=201)
async def register_push_device(
    payload: DeviceRegisterBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> DevicePushOut:
    try:
        row = register_device(db, current_user.id, payload.token, payload.platform)
    except ValueError as exc:
        key = str(exc)
        if key == "invalid_platform":
            raise HTTPException(
                status_code=400,
                detail="platform must be one of: ios, android, web, expo.",
            ) from exc
        if key == "invalid_token":
            raise HTTPException(status_code=400, detail="token is required.") from exc
        raise HTTPException(status_code=400, detail=key) from exc
    return DevicePushOut.model_validate(row)


@router.get("/settings", response_model=NotificationSettingsOut)
async def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> NotificationSettingsOut:
    row = get_or_create_settings(db, current_user.id)
    return NotificationSettingsOut.model_validate(row)


@router.put("/settings", response_model=NotificationSettingsOut)
async def put_notification_settings(
    payload: NotificationSettingsPutBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> NotificationSettingsOut:
    row = update_settings(db, current_user.id, payload.timezone, payload.dnd)
    return NotificationSettingsOut.model_validate(row)


@router.post("/test", response_model=NotificationTestOut)
async def test_notification_dispatch(
    payload: NotificationTestBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> NotificationTestOut:
    settings = get_or_create_settings(db, current_user.id)
    n = count_tokens(db, current_user.id)
    if settings.dnd:
        return NotificationTestOut(
            ok=False,
            detail="Do not disturb is enabled; dispatch skipped.",
            registered_devices=n,
        )
    return NotificationTestOut(
        ok=True,
        detail=f"Stub dispatch recorded for title={payload.title!r} (FCM/APNs wiring is client-side).",
        registered_devices=n,
    )
