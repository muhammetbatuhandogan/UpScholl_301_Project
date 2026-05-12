from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers.analytics_router import router as analytics_router
from app.routers.auth_router import router as auth_router
from app.routers.onboarding_router import router as onboarding_router
from app.routers.tasks_router import router as tasks_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(title="UpScholl Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(analytics_router)
app.include_router(onboarding_router)


@app.get("/health")
async def health(db: Session = Depends(get_db)) -> dict:
    database_ok = False
    try:
        db.execute(text("SELECT 1"))
        database_ok = True
    except Exception:
        database_ok = False
    return {
        "ok": True,
        "service": "backend",
        "database": "connected" if database_ok else "unavailable",
    }


@app.get("/api/status")
async def status(db: Session = Depends(get_db)) -> dict:
    database_ok = False
    try:
        db.execute(text("SELECT 1"))
        database_ok = True
    except Exception:
        database_ok = False
    return {
        "app": "UpScholl_301_Project",
        "backend": "running",
        "database": "connected" if database_ok else "unavailable",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "next_step": "OTP/SMS auth, family APIs, notifications (per planv2)",
    }
