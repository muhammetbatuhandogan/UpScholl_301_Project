"""Expo Push API (works with ExponentPushToken[...] device tokens)."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Sequence

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _is_expo_token(token: str) -> bool:
    t = token.strip()
    return t.startswith("ExponentPushToken[") or t.startswith("ExpoPushToken")


def send_expo_batch(tokens: Sequence[str], title: str, body: str) -> tuple[bool, str]:
    messages = []
    for raw in tokens:
        t = raw.strip()
        if not _is_expo_token(t):
            continue
        messages.append(
            {
                "to": t,
                "title": title[:120],
                "body": body[:380],
                "sound": "default",
                "priority": "high",
            }
        )
    if not messages:
        return False, "no_expo_tokens"
    payload = json.dumps({"messages": messages[:100]}).encode("utf-8")
    req = urllib.request.Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8", errors="replace")[:500]
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")[:300]
        logger.warning("expo_push_http_error", extra={"status": exc.code, "body": err_body})
        return False, f"http_{exc.code}"
    except Exception as exc:
        logger.warning("expo_push_error", extra={"detail": str(exc)})
        return False, "request_failed"
    return True, raw
