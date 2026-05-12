"""FR-NOT weekly slots: local Monday 09:00, Wednesday 18:00, Friday 18:00 (15-minute fire window)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

SLOT_MESSAGES: dict[str, tuple[str, str]] = {
    "mon_tasks": (
        "Bu haftanın görevleri",
        "Bu haftanın görevleri hazır — başlamaya hazır mısın?",
    ),
    "wed_reminder": (
        "Görev hatırlatması",
        "Haftalık görevlerine göz at; skorunu güncelle.",
    ),
    "fri_family": (
        "Aile hatırlatması",
        "Aile üyelerinle hazırlığını konuşmayı unutma.",
    ),
}


def safe_zoneinfo(name: str) -> ZoneInfo:
    raw = (name or "").strip() or "Europe/Istanbul"
    try:
        return ZoneInfo(raw)
    except Exception:
        return ZoneInfo("Europe/Istanbul")


def active_slots_for_minute(local_dt: datetime) -> list[str]:
    """Which notification slots are active for this local clock minute (15m window)."""
    wd = local_dt.weekday()
    h, m = local_dt.hour, local_dt.minute
    slots: list[str] = []
    if wd == 0 and h == 9 and m <= 14:
        slots.append("mon_tasks")
    if wd == 2 and h == 18 and m <= 14:
        slots.append("wed_reminder")
    if wd == 4 and h == 18 and m <= 14:
        slots.append("fri_family")
    return slots


def next_slot_datetimes(
    tz_name: str,
    slot_kind: str,
    *,
    now_utc: Optional[datetime] = None,
    count: int = 3,
) -> list[datetime]:
    """Next upcoming local datetimes when the given slot would fire (at window start)."""
    tz = safe_zoneinfo(tz_name)
    now = now_utc or datetime.now(timezone.utc)
    now_local = now.astimezone(tz)
    rules = {
        "mon_tasks": (0, 9, 0),
        "wed_reminder": (2, 18, 0),
        "fri_family": (4, 18, 0),
    }
    if slot_kind not in rules:
        return []
    target_wd, hour, minute = rules[slot_kind]
    out: list[datetime] = []
    for i in range(400):
        d: date = now_local.date() + timedelta(days=i)
        if d.weekday() != target_wd:
            continue
        dt = datetime.combine(d, time(hour, minute, tzinfo=tz))
        if dt <= now_local:
            continue
        out.append(dt)
        if len(out) >= count:
            break
    return out
