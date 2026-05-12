import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_guide_content_version
from app.db.session import get_db
from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.schemas.emergency_schema import (
    GuideVersionOut,
    SosContactOut,
    SosContactsPutBody,
    SosEventOut,
    SosTriggerBody,
)
from app.services.sos_service import create_sos_event, list_contacts, list_events, replace_contacts

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


def _load_manifest() -> dict:
    path = Path(__file__).resolve().parent.parent / "content" / "guide_manifest.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"version": get_guide_content_version(), "sections": []}


@router.get("/guide/version", response_model=GuideVersionOut)
async def guide_version() -> GuideVersionOut:
    manifest = _load_manifest()
    ver = str(manifest.get("version") or get_guide_content_version())
    return GuideVersionOut(version=ver, manifest=manifest)


@router.get("/contacts", response_model=list[SosContactOut])
async def get_contacts(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[SosContactOut]:
    rows = list_contacts(db, current_user.id)
    return [SosContactOut.model_validate(r) for r in rows]


@router.put("/contacts", response_model=list[SosContactOut])
async def put_contacts(
    payload: SosContactsPutBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[SosContactOut]:
    raw = [c.model_dump() for c in payload.contacts]
    try:
        rows = replace_contacts(db, current_user.id, raw)
    except ValueError as exc:
        key = str(exc)
        if key == "max_contacts":
            raise HTTPException(status_code=400, detail="Maximum 3 SOS contacts.") from exc
        if key == "invalid_contact":
            raise HTTPException(status_code=400, detail="Each contact needs name and phone.") from exc
        raise HTTPException(status_code=400, detail=key) from exc
    return [SosContactOut.model_validate(r) for r in rows]


@router.post("/sos", response_model=SosEventOut, status_code=201)
async def trigger_sos(
    payload: SosTriggerBody,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> SosEventOut:
    try:
        ev = create_sos_event(db, current_user.id, payload.latitude, payload.longitude)
    except ValueError as exc:
        key = str(exc)
        if key == "no_contacts":
            raise HTTPException(
                status_code=400,
                detail="Add at least one SOS contact before sending.",
            ) from exc
        raise HTTPException(status_code=400, detail=key) from exc
    return SosEventOut.model_validate(ev)


@router.get("/sos/logs", response_model=list[SosEventOut])
async def sos_logs(
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[SosEventOut]:
    rows = list_events(db, current_user.id, limit=50)
    return [SosEventOut.model_validate(r) for r in rows]
