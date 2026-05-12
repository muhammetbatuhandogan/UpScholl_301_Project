"""Netgsm SMS (GET API). Optional: only sends when credentials are set."""

from __future__ import annotations

import logging
from urllib.parse import quote, urlencode
from urllib.request import urlopen

from app.config import get_netgsm_msgheader, get_netgsm_password, get_netgsm_usercode, netgsm_configured

logger = logging.getLogger(__name__)


def _to_gsmno(phone_e164: str) -> str:
    """Netgsm commonly expects 5xxxxxxxxx or 90xxxxxxxxxx digits."""
    digits = "".join(c for c in phone_e164 if c.isdigit())
    if digits.startswith("90") and len(digits) >= 12:
        return digits
    if digits.startswith("0") and len(digits) >= 10:
        return "90" + digits[1:]
    if len(digits) == 10 and digits[0] == "5":
        return "90" + digits
    return digits


def send_sms_sync(destination_e164: str, message: str) -> tuple[bool, str]:
    """
    Returns (ok, detail). On misconfiguration returns (False, reason).
    Does not raise for HTTP errors — returns ok=False.
    """
    if not netgsm_configured():
        return False, "netgsm_not_configured"
    usercode = get_netgsm_usercode()
    password = get_netgsm_password()
    header = get_netgsm_msgheader()
    gsmno = _to_gsmno(destination_e164)
    if len(gsmno) < 10:
        return False, "invalid_destination"
    base = "https://api.netgsm.com.tr/sms/send/get"
    params = {
        "usercode": usercode,
        "password": password,
        "gsmno": gsmno,
        "message": message[:900],
        "msgheader": header[:11],
        "dil": "TR",
    }
    url = f"{base}?{urlencode(params, quote_via=quote)}"
    try:
        with urlopen(url, timeout=25) as resp:
            raw = resp.read().decode("utf-8", errors="replace").strip()
    except Exception as exc:
        logger.warning("netgsm_http_error", extra={"detail": str(exc)})
        return False, "http_error"
    if raw.startswith("00") or raw.isdigit():
        return True, raw
    logger.warning("netgsm_rejected", extra={"response": raw[:80]})
    return False, raw[:200]
