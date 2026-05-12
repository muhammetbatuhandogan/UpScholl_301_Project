from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DeviceRegisterBody(BaseModel):
    token: str = Field(min_length=8, max_length=512)
    platform: str = Field(max_length=20)


class DevicePushOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    platform: str
    created_at: datetime


class NotificationSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    timezone: str
    dnd: bool
    updated_at: datetime


class NotificationSettingsPutBody(BaseModel):
    timezone: str | None = Field(default=None, max_length=64)
    dnd: bool | None = None


class NotificationTestBody(BaseModel):
    title: str = Field(default="UpScholl", max_length=80)
    body: str = Field(default="Test bildirimi", max_length=200)


class NotificationTestOut(BaseModel):
    ok: bool
    detail: str
    registered_devices: int


class RunDueOut(BaseModel):
    users_with_devices: int
    new_dispatch_logs: int
    skipped_duplicate: int
    skipped_dnd: int
    push_batches_ok: int
    push_batches_failed: int


class ScheduleSlotPreview(BaseModel):
    slot_kind: str
    title: str
    body: str
    next_local_iso: list[str]


class NotificationSchedulePreviewOut(BaseModel):
    timezone: str
    slots: list[ScheduleSlotPreview]
