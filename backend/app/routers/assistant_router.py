from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.routers.auth_router import get_current_user
from app.schemas.auth_schema import UserProfile
from app.services.ai_service import (
    AiServiceError,
    ai_configured,
    generate_chat_reply,
    generate_insights,
)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class InsightsRequest(BaseModel):
    context: dict = Field(default_factory=dict)


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    context: dict = Field(default_factory=dict)


@router.get("/status")
def assistant_status(_user: UserProfile = Depends(get_current_user)):
    return {"configured": ai_configured()}


@router.post("/insights")
def assistant_insights(
    body: InsightsRequest,
    _user: UserProfile = Depends(get_current_user),
):
    try:
        return generate_insights(body.context)
    except AiServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/chat")
def assistant_chat(
    body: ChatRequest,
    _user: UserProfile = Depends(get_current_user),
):
    try:
        reply = generate_chat_reply(
            [message.model_dump() for message in body.messages],
            body.context,
        )
        return {"reply": reply}
    except AiServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
