from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_enable_notification_scheduler
from app.db.session import get_db
from app.routers.analytics_router import router as analytics_router
from app.routers.auth_router import router as auth_router
from app.routers.bag_router import router as bag_router
from app.routers.emergency_router import router as emergency_router
from app.routers.family_group_router import router as family_group_router
from app.routers.family_router import router as family_router
from app.routers.notification_router import router as notification_router
from app.routers.onboarding_router import router as onboarding_router
from app.routers.otp_router import router as otp_router
from app.routers.score_router import router as score_router
from app.routers.tasks_router import router as tasks_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import logging

    log = logging.getLogger("uvicorn.error")
    scheduler = None
    if get_enable_notification_scheduler():
        from apscheduler.schedulers.background import BackgroundScheduler

        def tick() -> None:
            from app.db.session import SessionLocal
            from app.services.notification_dispatch_service import run_due_notifications

            db = SessionLocal()
            try:
                run_due_notifications(db)
            except Exception:
                log.exception("notification_scheduler_tick_failed")
            finally:
                db.close()

        scheduler = BackgroundScheduler()
        scheduler.add_job(
            tick,
            "interval",
            minutes=15,
            id="notif_due",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        scheduler.start()
        log.info("Notification scheduler: run-due every 15 minutes (ENABLE_NOTIFICATION_SCHEDULER=true).")
    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.shutdown(wait=False)

app = FastAPI(title="UpScholl Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(otp_router)
app.include_router(tasks_router)
app.include_router(analytics_router)
app.include_router(onboarding_router)
app.include_router(bag_router)
app.include_router(score_router)
app.include_router(family_router)
app.include_router(family_group_router)
app.include_router(emergency_router)
app.include_router(notification_router)


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
        "next_step": "Mobile client wiring and UAT; optional external cron hitting POST /api/notifications/run-due.",
    }
