from datetime import datetime, timezone

from zoneinfo import ZoneInfo

from app.services.notification_schedule_service import (
    active_slots_for_minute,
    next_slot_datetimes,
)


def test_monday_morning_slot():
    local = datetime(2026, 5, 11, 9, 5, tzinfo=ZoneInfo("Europe/Istanbul"))
    assert "mon_tasks" in active_slots_for_minute(local)


def test_wednesday_evening_slot():
    local = datetime(2026, 5, 13, 18, 10, tzinfo=ZoneInfo("Europe/Istanbul"))
    assert "wed_reminder" in active_slots_for_minute(local)


def test_outside_window_empty():
    local = datetime(2026, 5, 11, 10, 0, tzinfo=ZoneInfo("Europe/Istanbul"))
    assert active_slots_for_minute(local) == []


def test_next_slot_returns_future():
    fixed_utc = datetime(2026, 5, 11, 6, 0, 0, tzinfo=timezone.utc)
    upcoming = next_slot_datetimes("Europe/Istanbul", "mon_tasks", now_utc=fixed_utc, count=1)
    assert len(upcoming) == 1
    assert upcoming[0] > fixed_utc.astimezone(ZoneInfo("Europe/Istanbul"))


def test_invalid_timezone_falls_back():
    upcoming = next_slot_datetimes("Not/A_Real_Zone", "fri_family", count=1)
    assert len(upcoming) >= 1
