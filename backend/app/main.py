from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth_router import router as auth_router
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


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "service": "backend",
        "uptime_seconds": 0,
    }


@app.get("/api/status")
async def status() -> dict[str, str]:
    return {
        "app": "UpScholl_301_Project",
        "backend": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "next_step": "Task CRUD + Auth endpoints",
    }
