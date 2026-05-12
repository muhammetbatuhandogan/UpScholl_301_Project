import os

DEFAULT_DATABASE_URL = "postgresql://upscholl:upscholl_dev@127.0.0.1:5432/upscholl"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()
