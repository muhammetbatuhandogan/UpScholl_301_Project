import os

DEFAULT_DATABASE_URL = "postgresql://upscholl:upscholl_dev@127.0.0.1:5432/upscholl"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()


def get_otp_debug() -> bool:
    return os.getenv("OTP_DEBUG", "false").lower() in ("1", "true", "yes")


def get_netgsm_usercode() -> str:
    return os.getenv("NETGSM_USERCODE", "").strip()


def get_netgsm_password() -> str:
    return os.getenv("NETGSM_PASSWORD", "").strip()


def get_netgsm_msgheader() -> str:
    return os.getenv("NETGSM_MSGHEADER", "").strip() or "UPSCHOLL"


def netgsm_configured() -> bool:
    return bool(get_netgsm_usercode() and get_netgsm_password())


def get_guide_content_version() -> str:
    return os.getenv("GUIDE_CONTENT_VERSION", "1.0.0").strip()


def get_access_token_ttl_seconds() -> int:
    raw = os.getenv("ACCESS_TOKEN_TTL_SECONDS", "").strip()
    if raw.isdigit():
        return max(300, int(raw))
    return 86400


def get_refresh_token_ttl_days() -> int:
    raw = os.getenv("REFRESH_TOKEN_TTL_DAYS", "").strip()
    if raw.isdigit():
        return max(1, int(raw))
    return 30


def get_cron_secret() -> str:
    return os.getenv("CRON_SECRET", "").strip()


def get_enable_notification_scheduler() -> bool:
    return os.getenv("ENABLE_NOTIFICATION_SCHEDULER", "false").lower() in ("1", "true", "yes")
