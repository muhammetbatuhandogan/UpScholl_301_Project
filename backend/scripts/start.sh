#!/bin/sh
set -e

echo "Running database migrations..."
python -m alembic upgrade head

PORT="${PORT:-8000}"
echo "Starting uvicorn on port ${PORT}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
